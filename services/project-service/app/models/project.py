from datetime import datetime

from pydantic import BaseModel, Field


class ProjectInDB(BaseModel):
    id: str | None = None
    name: str = Field(min_length=3, max_length=200)
    department: str = Field(min_length=2, max_length=120)
    budget: float = Field(ge=0)
    start_date: datetime | None = None
    end_date: datetime | None = None
    location: str = Field(min_length=2, max_length=200)
    status: str = Field(default='Planned')
    completion: int = Field(default=0, ge=0, le=100)
    created_by: str | None = None
    assigned_engineer: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
