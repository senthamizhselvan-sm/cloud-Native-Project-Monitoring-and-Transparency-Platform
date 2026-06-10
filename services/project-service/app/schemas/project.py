from datetime import datetime

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    department: str = Field(min_length=2, max_length=120)
    budget: float = Field(ge=0)
    start_date: datetime | None = None
    end_date: datetime | None = None
    location: str = Field(min_length=2, max_length=200)
    status: str = Field(default='Planned')
    completion: int = Field(default=0, ge=0, le=100)
    assigned_engineer: str | None = None


class ProjectCreate(ProjectBase):
    created_by: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=200)
    department: str | None = Field(default=None, min_length=2, max_length=120)
    budget: float | None = Field(default=None, ge=0)
    start_date: datetime | None = None
    end_date: datetime | None = None
    location: str | None = Field(default=None, min_length=2, max_length=200)
    status: str | None = None
    completion: int | None = Field(default=None, ge=0, le=100)
    assigned_engineer: str | None = None


class ProjectRead(ProjectBase):
    id: str
    created_by: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    risk_level: str = "Low"
    risk_score: float = 10.0
