from datetime import datetime

from pydantic import BaseModel, Field


class TimelineCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: str = Field(default='', max_length=1000)
    image_url: str | None = Field(default=None, max_length=500)


class TimelineRead(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    created_by: str
    timestamp: datetime
    image_url: str | None = None
