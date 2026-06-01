from fastapi import APIRouter, Depends

from app.core.security import decode_token
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter()
service = AuthService()


@router.post('/register', response_model=UserRead)
async def register(request: RegisterRequest) -> UserRead:
    return await service.register(request)


@router.post('/login', response_model=TokenResponse)
async def login(request: LoginRequest) -> TokenResponse:
    return await service.login(request)


@router.get('/profile', response_model=UserRead)
async def profile(payload: dict = Depends(decode_token)) -> UserRead:
    return await service.get_profile(payload)
