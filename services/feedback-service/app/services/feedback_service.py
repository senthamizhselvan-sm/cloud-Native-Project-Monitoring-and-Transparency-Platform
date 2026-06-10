from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.models.feedback import FeedbackInDB
from app.repositories.feedback_repository import FeedbackRepository
from app.schemas.feedback import FeedbackCreate, FeedbackRead, FeedbackUpdate


class FeedbackService:
    def __init__(self, feedback_repository: FeedbackRepository | None = None) -> None:
        self.feedback_repository = feedback_repository or FeedbackRepository()

    async def create_feedback(self, request: FeedbackCreate, citizen_id: str, district: str | None = None) -> FeedbackRead:
        if district:
            try:
                from app.db.mongodb import get_database
                from bson import ObjectId
                db = get_database()
                project = await db['projects'].find_one({'_id': ObjectId(request.project_id)})
                if project and project.get('location'):
                    p_loc = project.get('location')
                    if p_loc.strip().lower() != district.strip().lower():
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Cannot submit feedback for a project outside your registered district"
                        )
            except HTTPException:
                raise
            except Exception:
                pass

        feedback = FeedbackInDB(
            project_id=request.project_id,
            citizen_name=request.citizen_name,
            citizen_id=citizen_id,
            issue_type=request.issue_type,
            description=request.description,
            image_url=request.image_url,
            location=request.location,
            severity=request.severity or "Low",
            status='OPEN',
            assigned_inspector=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        created = await self.feedback_repository.create(feedback)
        
        # Log to activity feed in MongoDB 'activities' collection
        try:
            from app.db.mongodb import get_database
            from bson import ObjectId
            db = get_database()
            
            # Fetch project name
            p_name = "Infrastructure Project"
            try:
                project = await db['projects'].find_one({'_id': ObjectId(request.project_id)})
                if project:
                    p_name = project.get('name')
            except Exception:
                pass
                
            sev_emoji = "🔴" if request.severity == "High" else "🟡" if request.severity == "Medium" else "🟢"
            msg = f"🟡 Citizen {request.citizen_name} submitted complaint: \"{request.issue_type}\" in {request.location or 'unspecified location'} ({sev_emoji} {request.severity or 'Low'} Severity)"
            
            await db['activities'].insert_one({
                'type': 'COMPLAINT_SUBMIT',
                'message': msg,
                'project_id': request.project_id,
                'project_name': p_name,
                'timestamp': datetime.now(timezone.utc)
            })
        except Exception as e:
            print("Failed to log complaint activity:", e)

        return FeedbackRead(**created.model_dump(exclude_none=True))

    async def list_feedback(self, role: str, citizen_id: str, district: str | None = None) -> list[FeedbackRead]:
        if role in ['Officer', 'Admin']:
            feedbacks = await self.feedback_repository.list_all()
        else:
            feedbacks = await self.feedback_repository.list_by_citizen(citizen_id)

        res = []
        for fb in feedbacks:
            if district and fb.location:
                if fb.location.strip().lower() != district.strip().lower():
                    continue
            res.append(FeedbackRead(**fb.model_dump(exclude_none=True)))
        return res

    async def list_by_project(self, project_id: str, district: str | None = None) -> list[FeedbackRead]:
        feedbacks = await self.feedback_repository.list_by_project(project_id)
        res = []
        for fb in feedbacks:
            if district and fb.location:
                if fb.location.strip().lower() != district.strip().lower():
                    continue
            res.append(FeedbackRead(**fb.model_dump(exclude_none=True)))
        return res

    async def update_feedback(self, feedback_id: str, request: FeedbackUpdate) -> FeedbackRead:
        updates = request.model_dump(exclude_unset=True)
        current = await self.feedback_repository.get_by_id(feedback_id)
        
        feedback = await self.feedback_repository.update(feedback_id, updates)
        if feedback is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Feedback not found')
            
        # Log to activity feed in MongoDB 'activities' collection
        try:
            from app.db.mongodb import get_database
            from bson import ObjectId
            db = get_database()
            
            p_name = "Infrastructure Project"
            try:
                project = await db['projects'].find_one({'_id': ObjectId(feedback.project_id)})
                if project:
                    p_name = project.get('name')
            except Exception:
                pass
                
            msg_parts = []
            if current and current.status != feedback.status:
                msg_parts.append(f"updated complaint status to {feedback.status}")
            if current and current.assigned_inspector != feedback.assigned_inspector and feedback.assigned_inspector:
                msg_parts.append(f"assigned inspector {feedback.assigned_inspector}")
                
            if msg_parts:
                message = f"🔵 Officer " + " and ".join(msg_parts) + f" for project: {p_name}"
                await db['activities'].insert_one({
                    'type': 'COMPLAINT_UPDATE',
                    'message': message,
                    'project_id': feedback.project_id,
                    'project_name': p_name,
                    'timestamp': datetime.now(timezone.utc)
                })
        except Exception as e:
            print("Failed to log complaint update activity:", e)

        return FeedbackRead(**feedback.model_dump(exclude_none=True))
