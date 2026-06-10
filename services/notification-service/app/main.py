from datetime import datetime, timezone
import json
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from bson import ObjectId

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    mongo_uri: str = Field(default='mongodb://localhost:27017')
    mongo_db_name: str = Field(default='government_monitoring')
    jwt_secret_key: str = Field(default='change-me')
    jwt_algorithm: str = Field(default='HS256')
    cors_origins: list[str] = Field(default_factory=lambda: ['http://localhost:5173'])

settings = Settings()
app = FastAPI(title='Notification Service', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

Instrumentator().instrument(app).expose(app)

# JWT Security
security_scheme = HTTPBearer(auto_error=False)

def decode_token(credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')
    try:
        return jwt.decode(credentials.credentials, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

# Database client
db_client = AsyncIOMotorClient(settings.mongo_uri)
db = db_client[settings.mongo_db_name]
notifications_collection = db['notifications']

# Schemas
class NotificationCreate(BaseModel):
    user_id: str
    message: str

class NotificationRead(BaseModel):
    id: str
    user_id: str
    message: str
    read: bool
    created_at: datetime

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # Maps user_id -> list of WebSockets
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, data: dict, user_id: str):
        if user_id in self.active_connections:
            payload = json.dumps(data)
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    pass

    async def broadcast(self, data: dict):
        payload = json.dumps(data)
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_text(payload)
                except Exception:
                    pass

manager = ConnectionManager()

# WebSocket Route
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Maintain connection alive and receive client heartbeats
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

# Routes
@app.post('/api/v1/notifications', response_model=NotificationRead)
async def create_notification(request: NotificationCreate, payload: dict = Depends(decode_token)):
    notif_data = {
        'user_id': request.user_id,
        'message': request.message,
        'read': False,
        'created_at': datetime.now(timezone.utc)
    }
    result = await notifications_collection.insert_one(notif_data)
    notif_data['id'] = str(result.inserted_id)
    
    # Broadcast to WebSockets
    ws_payload = {
        "type": "notification",
        "id": notif_data['id'],
        "user_id": request.user_id,
        "message": request.message,
        "read": False,
        "created_at": notif_data['created_at'].isoformat()
    }
    if request.user_id == 'all':
        await manager.broadcast(ws_payload)
    else:
        await manager.send_personal_message(ws_payload, request.user_id)
        
    return NotificationRead(**notif_data)

@app.get('/api/v1/notifications', response_model=list[NotificationRead])
async def list_notifications(payload: dict = Depends(decode_token)):
    user_id = payload.get('sub')
    if not user_id:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')
         
    notifications = []
    async for doc in notifications_collection.find({
        '$or': [{'user_id': user_id}, {'user_id': 'all'}]
    }).sort('created_at', -1):
        doc['id'] = str(doc.pop('_id'))
        notifications.append(NotificationRead(**doc))
    return notifications

@app.put('/api/v1/notifications/{notif_id}/read', response_model=NotificationRead)
async def mark_as_read(notif_id: str, payload: dict = Depends(decode_token)):
    try:
        object_id = ObjectId(notif_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid notification ID format')
        
    result = await notifications_collection.find_one_and_update(
        {'_id': object_id},
        {'$set': {'read': True}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Notification not found')
        
    result['id'] = str(result.pop('_id'))
    return NotificationRead(**result)

@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'notification-service'}
