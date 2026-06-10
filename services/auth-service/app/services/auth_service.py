from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import UserInDB
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead


class AuthService:
    def __init__(self, user_repository: UserRepository | None = None) -> None:
        self.user_repository = user_repository or UserRepository()

    async def register(self, request: RegisterRequest) -> UserRead:
        existing_user = await self.user_repository.find_by_email(request.email)
        if existing_user is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

        user = UserInDB(
            full_name=request.full_name,
            email=request.email,
            hashed_password=hash_password(request.password),
            role=request.role,
            district=request.district,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        created_user = await self.user_repository.create(user)
        return UserRead(
            id=created_user.id or '',
            full_name=created_user.full_name,
            email=created_user.email,
            role=created_user.role,
            district=created_user.district,
            is_active=created_user.is_active,
        )

    async def login(self, request: LoginRequest) -> TokenResponse:
        user = await self.user_repository.find_by_email(request.email)
        if user is None or not verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

        token = create_access_token(
            subject=user.id or user.email,
            role=user.role,
            name=user.full_name,
            email=user.email,
            district=getattr(user, 'district', '') or ''
        )
        return TokenResponse(access_token=token)

    async def get_profile(self, payload: dict) -> dict:
        user_id = payload.get('sub')
        # try to fetch full user info from repository
        user = await self.user_repository.find_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        return UserRead(
            id=user.id or '',
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            district=getattr(user, 'district', None),
            is_active=user.is_active,
        )
