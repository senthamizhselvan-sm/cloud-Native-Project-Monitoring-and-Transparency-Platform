from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    mongo_uri: str = Field(default='mongodb://localhost:27017')
    mongo_db_name: str = Field(default='government_monitoring')
    jwt_secret_key: str = Field(default='change-me')
    jwt_algorithm: str = Field(default='HS256')
    cors_origins: list[str] = Field(default_factory=lambda: ['http://localhost:5173'])

settings = Settings()
app = FastAPI(title='Audit Service', version='1.0.0')

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

def decode_token_optional(credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme)) -> dict | None:
    if credentials is None:
        return None
    try:
        return jwt.decode(credentials.credentials, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None

# Database client
db_client = AsyncIOMotorClient(settings.mongo_uri)
db = db_client[settings.mongo_db_name]
audit_collection = db['audit_logs']

# Schemas
class AuditLogCreate(BaseModel):
    user: str
    action: str
    resource: str

class AuditLogRead(BaseModel):
    id: str
    user: str
    action: str
    resource: str
    timestamp: datetime

# Activity Schemas
class ActivityCreate(BaseModel):
    type: str
    message: str
    project_id: str | None = None
    project_name: str | None = None

class ActivityRead(BaseModel):
    id: str
    type: str
    message: str
    project_id: str | None = None
    project_name: str | None = None
    timestamp: datetime

# Audit Routes
@app.post('/api/v1/audit/logs', response_model=AuditLogRead)
async def create_audit_log(request: AuditLogCreate, payload: dict = Depends(decode_token)):
    log_data = {
        'user': request.user,
        'action': request.action,
        'resource': request.resource,
        'timestamp': datetime.now(timezone.utc)
    }
    result = await audit_collection.insert_one(log_data)
    log_data['id'] = str(result.inserted_id)
    return AuditLogRead(**log_data)

@app.get('/api/v1/audit/logs', response_model=list[AuditLogRead])
async def list_audit_logs(payload: dict = Depends(decode_token)):
    role = payload.get('role')
    if role != 'Admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only Admins can view audit logs')
        
    logs = []
    async for doc in audit_collection.find().sort('timestamp', -1).limit(500):
        doc['id'] = str(doc.pop('_id'))
        logs.append(AuditLogRead(**doc))
    return logs

# Activity Routes
@app.post('/api/v1/audit/activities', response_model=ActivityRead)
async def create_activity(request: ActivityCreate, payload: dict = Depends(decode_token)):
    act_data = {
        'type': request.type,
        'message': request.message,
        'project_id': request.project_id,
        'project_name': request.project_name,
        'timestamp': datetime.now(timezone.utc)
    }
    result = await db['activities'].insert_one(act_data)
    act_data['id'] = str(result.inserted_id)
    return ActivityRead(**act_data)

@app.get('/api/v1/audit/activities', response_model=list[ActivityRead])
async def list_activities(project_id: str | None = None, payload: dict | None = Depends(decode_token_optional)):
    query = {}
    if project_id:
        query['project_id'] = project_id
        
    activities = []
    async for doc in db['activities'].find(query).sort('timestamp', -1).limit(100):
        doc['id'] = str(doc.pop('_id'))
        activities.append(ActivityRead(**doc))
    return list(activities)

@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'audit-service'}
