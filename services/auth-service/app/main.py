from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes.auth import router as auth_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title='Auth Service', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth_router, prefix='/api/v1/auth', tags=['Auth'])


@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'auth-service'}
