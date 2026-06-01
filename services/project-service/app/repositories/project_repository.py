from datetime import datetime, timezone

from bson import ObjectId

from app.db.mongodb import get_database
from app.models.project import ProjectInDB


def _to_object_id(project_id: str) -> ObjectId | None:
    try:
        return ObjectId(project_id)
    except Exception:
        return None


class ProjectRepository:
    def __init__(self) -> None:
        self.collection = get_database()['projects']

    async def create(self, project: ProjectInDB) -> ProjectInDB:
        payload = project.model_dump(exclude={'id'})
        timestamp = datetime.now(timezone.utc)
        payload['created_at'] = timestamp
        payload['updated_at'] = timestamp
        result = await self.collection.insert_one(payload)
        project.id = str(result.inserted_id)
        project.created_at = timestamp
        project.updated_at = timestamp
        return project

    async def list(self) -> list[ProjectInDB]:
        documents = []
        async for document in self.collection.find().sort('created_at', -1):
            document['id'] = str(document.pop('_id'))
            documents.append(ProjectInDB(**document))
        return documents

    async def get_by_id(self, project_id: str) -> ProjectInDB | None:
        object_id = _to_object_id(project_id)
        if object_id is None:
            return None

        document = await self.collection.find_one({'_id': object_id})
        if document is None:
            return None
        document['id'] = str(document.pop('_id'))
        return ProjectInDB(**document)

    async def update(self, project_id: str, updates: dict) -> ProjectInDB | None:
        object_id = _to_object_id(project_id)
        if object_id is None:
            return None

        updates['updated_at'] = datetime.now(timezone.utc)
        await self.collection.update_one({'_id': object_id}, {'$set': updates})
        return await self.get_by_id(project_id)

    async def delete(self, project_id: str) -> bool:
        object_id = _to_object_id(project_id)
        if object_id is None:
            return False

        result = await self.collection.delete_one({'_id': object_id})
        return result.deleted_count == 1
