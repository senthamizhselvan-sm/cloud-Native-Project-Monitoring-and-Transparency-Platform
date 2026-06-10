from datetime import datetime, timezone

from bson import ObjectId

from app.db.mongodb import get_database
from app.models.timeline import TimelineInDB


def _to_object_id(pid: str) -> ObjectId | None:
    try:
        return ObjectId(pid)
    except Exception:
        return None


class TimelineRepository:
    def __init__(self) -> None:
        self.collection = get_database()['timeline']

    async def create(self, timeline: TimelineInDB) -> TimelineInDB:
        payload = timeline.model_dump(exclude={'id'})
        if not payload.get('timestamp'):
            payload['timestamp'] = datetime.now(timezone.utc)
        result = await self.collection.insert_one(payload)
        timeline.id = str(result.inserted_id)
        timeline.timestamp = payload['timestamp']
        return timeline

    async def list_by_project(self, project_id: str) -> list[TimelineInDB]:
        documents = []
        async for document in self.collection.find({'project_id': project_id}).sort('timestamp', 1):
            document['id'] = str(document.pop('_id'))
            documents.append(TimelineInDB(**document))
        return documents
