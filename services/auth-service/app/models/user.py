from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserInDB(BaseModel):
    id: str | None = None
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    hashed_password: str
    role: str = Field(default='Citizen')
    district: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
