from datetime import datetime

from pydantic import BaseModel, Field


class TimelineInDB(BaseModel):
    id: str | None = None
    project_id: str
    title: str
    description: str = ''
    created_by: str
    timestamp: datetime
    image_url: str | None = None
