from datetime import datetime, timezone

from bson import ObjectId

from app.db.mongodb import get_database
from app.models.feedback import FeedbackInDB


def _to_object_id(feedback_id: str) -> ObjectId | None:
    try:
        return ObjectId(feedback_id)
    except Exception:
        return None


class FeedbackRepository:
    def __init__(self) -> None:
        self.collection = get_database()['feedback']

    async def create(self, feedback: FeedbackInDB) -> FeedbackInDB:
        payload = feedback.model_dump(exclude={'id'})
        timestamp = datetime.now(timezone.utc)
        payload['created_at'] = timestamp
        payload['updated_at'] = timestamp
        result = await self.collection.insert_one(payload)
        feedback.id = str(result.inserted_id)
        feedback.created_at = timestamp
        feedback.updated_at = timestamp
        return feedback

    async def list_all(self) -> list[FeedbackInDB]:
        documents = []
        async for document in self.collection.find().sort('created_at', -1):
            document['id'] = str(document.pop('_id'))
            documents.append(FeedbackInDB(**document))
        return documents

    async def list_by_citizen(self, citizen_id: str) -> list[FeedbackInDB]:
        documents = []
        async for document in self.collection.find({'citizen_id': citizen_id}).sort('created_at', -1):
            document['id'] = str(document.pop('_id'))
            documents.append(FeedbackInDB(**document))
        return documents

    async def list_by_project(self, project_id: str) -> list[FeedbackInDB]:
        documents = []
        async for document in self.collection.find({'project_id': project_id}).sort('created_at', -1):
            document['id'] = str(document.pop('_id'))
            documents.append(FeedbackInDB(**document))
        return documents

    async def get_by_id(self, feedback_id: str) -> FeedbackInDB | None:
        object_id = _to_object_id(feedback_id)
        if object_id is None:
            return None
        document = await self.collection.find_one({'_id': object_id})
        if document is None:
            return None
        document['id'] = str(document.pop('_id'))
        return FeedbackInDB(**document)

    async def update(self, feedback_id: str, updates: dict) -> FeedbackInDB | None:
        object_id = _to_object_id(feedback_id)
        if object_id is None:
            return None
        updates['updated_at'] = datetime.now(timezone.utc)
        await self.collection.update_one({'_id': object_id}, {'$set': updates})
        return await self.get_by_id(feedback_id)
