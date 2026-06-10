from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str = Field(default='Citizen')
    district: str | None = None


class UserRead(UserBase):
    id: str
    is_active: bool = True
