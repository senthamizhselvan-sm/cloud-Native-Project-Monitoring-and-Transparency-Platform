from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackBase(BaseModel):
    project_id: str = Field(min_length=3, max_length=100)
    citizen_name: str = Field(min_length=2, max_length=120)
    issue_type: str = Field(default='Poor Quality')
    description: str = Field(min_length=5, max_length=1000)
    image_url: str | None = None
    location: str | None = Field(default=None, max_length=200)
    severity: str | None = Field(default="Low", max_length=50)


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackUpdate(BaseModel):
    status: str | None = None
    assigned_inspector: str | None = None


class FeedbackRead(FeedbackBase):
    id: str
    citizen_id: str
    status: str
    assigned_inspector: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
