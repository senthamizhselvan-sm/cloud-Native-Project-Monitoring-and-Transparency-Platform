from datetime import datetime, timezone

from bson import ObjectId
from app.db.mongodb import get_database
from app.models.user import UserInDB


class UserRepository:
    def __init__(self) -> None:
        self.collection = get_database()['users']

    async def find_by_email(self, email: str) -> UserInDB | None:
        document = await self.collection.find_one({'email': email})
        if document is None:
            return None
        document['id'] = str(document.pop('_id'))
        return UserInDB(**document)

    async def find_by_id(self, id: str) -> UserInDB | None:
        try:
            oid = ObjectId(id)
        except Exception:
            return None
        document = await self.collection.find_one({'_id': oid})
        if document is None:
            return None
        document['id'] = str(document.pop('_id'))
        return UserInDB(**document)

    async def create(self, user: UserInDB) -> UserInDB:
        payload = user.model_dump(exclude={'id'})
        timestamp = datetime.now(timezone.utc)
        payload['created_at'] = timestamp
        payload['updated_at'] = timestamp
        result = await self.collection.insert_one(payload)
        user.id = str(result.inserted_id)
        user.created_at = timestamp
        user.updated_at = timestamp
        return user
