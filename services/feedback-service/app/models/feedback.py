from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackInDB(BaseModel):
    id: str | None = None
    project_id: str = Field(min_length=3, max_length=100)
    citizen_name: str = Field(min_length=2, max_length=120)
    citizen_id: str
    issue_type: str = Field(default='Poor Quality')
    description: str = Field(min_length=5, max_length=1000)
    image_url: str | None = None
    status: str = Field(default='OPEN')
    assigned_inspector: str | None = None
    location: str | None = None
    severity: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
