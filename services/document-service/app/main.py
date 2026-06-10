from datetime import datetime, timezone
import os
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
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
app = FastAPI(title='Document Service', version='1.0.0')

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
collection = db['documents']

# Make sure upload directory exists
os.makedirs('static/uploads', exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Schemas
class DocumentRead(BaseModel):
    id: str
    project_id: str
    filename: str
    file_url: str
    document_type: str
    version: int
    uploaded_at: datetime

# Upload Endpoint
@app.post('/api/v1/documents/upload', response_model=DocumentRead)
async def upload_document(
    project_id: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    payload: dict = Depends(decode_token)
):
    # Retrieve role
    role = payload.get('role')
    if role not in ['Officer', 'Engineer', 'Contractor', 'Admin', 'Citizen']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Not authorized to upload files')

    # Versioning implementation
    existing_cursor = collection.find({'project_id': project_id, 'filename': file.filename})
    existing_docs = await existing_cursor.to_list(length=100)
    version = 1
    if existing_docs:
        versions = [d.get('version', 1) for d in existing_docs]
        version = max(versions) + 1

    file_path = f"static/uploads/{project_id}_v{version}_{file.filename}"
    
    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'File write failed: {str(e)}')

    mock_url = f"http://localhost:8004/static/uploads/{project_id}_v{version}_{file.filename}"

    doc_data = {
        'project_id': project_id,
        'filename': file.filename,
        'file_url': mock_url,
        'document_type': document_type,
        'version': version,
        'uploaded_at': datetime.now(timezone.utc)
    }

    result = await collection.insert_one(doc_data)
    doc_data['id'] = str(result.inserted_id)

    # Log to activity feed in MongoDB 'activities' collection
    try:
        activities_col = db['activities']
        # Fetch project name
        p_name = "Infrastructure Project"
        try:
            project = await db['projects'].find_one({'_id': ObjectId(project_id)})
            if project:
                p_name = project.get('name')
        except Exception:
            pass
        
        actor_name = payload.get('name') or payload.get('email') or payload.get('sub', 'System')
        message = f"🔵 {actor_name} uploaded {document_type} file: \"{file.filename}\" (Version {version}) for project: {p_name}"
        
        await activities_col.insert_one({
            'type': 'DOCUMENT_UPLOAD',
            'message': message,
            'project_id': project_id,
            'project_name': p_name,
            'timestamp': datetime.now(timezone.utc)
        })
    except Exception as e:
        print("Failed to log document activity:", e)

    return DocumentRead(**doc_data)

# Fetch Documents for Project
@app.get('/api/v1/documents/project/{project_id}', response_model=list[DocumentRead])
async def get_project_documents(project_id: str, payload: dict | None = Depends(decode_token_optional)):
    documents = []
    async for doc in collection.find({'project_id': project_id}).sort('uploaded_at', -1):
        doc['id'] = str(doc.pop('_id'))
        if 'version' not in doc:
            doc['version'] = 1
        documents.append(DocumentRead(**doc))
    return documents

@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'document-service'}
