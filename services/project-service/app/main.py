from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1.routes.project import router as project_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title='Project Service', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(project_router, prefix='/api/v1/projects', tags=['Projects'])

Instrumentator().instrument(app).expose(app)


@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'project-service'}
