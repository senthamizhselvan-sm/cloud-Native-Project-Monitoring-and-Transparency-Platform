from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.models.project import ProjectInDB
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.models.timeline import TimelineInDB
from app.repositories.timeline_repository import TimelineRepository
from app.db.mongodb import get_database

class ProjectService:
    def __init__(self, project_repository: ProjectRepository | None = None) -> None:
        self.project_repository = project_repository or ProjectRepository()

    async def calculate_project_risk(self, project: ProjectInDB) -> dict:
        score = 10.0
        
        # 1. Delayed status penalty
        if project.status == "Delayed":
            score += 30.0
        
        # 2. Check if end date is in the past and project is not completed
        now = datetime.now(timezone.utc)
        if project.end_date and project.completion < 100:
            end_date = project.end_date
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            if now > end_date:
                days_past = (now - end_date).days
                score += min(30.0, days_past * 0.5)
                
        # 3. Complaint count penalty
        try:
            feedback_col = get_database()['feedback']
            complaints_count = await feedback_col.count_documents({'project_id': project.id})
            score += min(30.0, complaints_count * 10)
        except Exception:
            pass
            
        # 4. Budget penalty for large projects that are lagging
        if project.budget > 10000000 and project.completion < 50:
            score += 10.0
            
        score = max(0.0, min(100.0, score))
        
        if score < 35.0:
            level = "Low"
        elif score < 70.0:
            level = "Medium"
        else:
            level = "High"
            
        return {"risk_score": round(score, 2), "risk_level": level}

    async def create_project(self, request: ProjectCreate, created_by: str | None = None) -> ProjectRead:
        project = ProjectInDB(
            name=request.name,
            department=request.department,
            budget=request.budget,
            start_date=request.start_date,
            end_date=request.end_date,
            location=request.location,
            status=request.status,
            completion=request.completion,
            assigned_engineer=request.assigned_engineer,
            created_by=request.created_by or created_by,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        created_project = await self.project_repository.create(project)
        
        # Automatic timeline creation milestone
        try:
            timeline_repo = TimelineRepository()
            event = TimelineInDB(
                project_id=created_project.id,
                title="Project Created",
                description=f"Project authorized and registered under {created_project.department} department.",
                created_by=created_project.created_by or "Officer",
                timestamp=datetime.now(timezone.utc),
                image_url=None
            )
            await timeline_repo.create(event)
        except Exception as e:
            print("Failed to log timeline event:", e)
            
        # Activity feed logging
        try:
            activities_col = get_database()['activities']
            await activities_col.insert_one({
                'type': 'PROJECT_CREATE',
                'message': f"🔵 Officer created project: {created_project.name}",
                'project_id': created_project.id,
                'project_name': created_project.name,
                'timestamp': datetime.now(timezone.utc)
            })
        except Exception as e:
            print("Failed to log activity:", e)

        # Calculate risk metadata
        risk_data = await self.calculate_project_risk(created_project)
        p_dict = created_project.model_dump(exclude_none=True)
        p_dict.update(risk_data)
        return ProjectRead(**p_dict)

    async def list_projects(self, district: str | None = None) -> list[ProjectRead]:
        projects = await self.project_repository.list()
        res = []
        for project in projects:
            if district and project.location:
                if project.location.strip().lower() != district.strip().lower():
                    continue
            risk_data = await self.calculate_project_risk(project)
            p_dict = project.model_dump(exclude_none=True)
            p_dict.update(risk_data)
            res.append(ProjectRead(**p_dict))
        return res

    async def get_project(self, project_id: str, district: str | None = None) -> ProjectRead:
        project = await self.project_repository.get_by_id(project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        if district and project.location:
            if project.location.strip().lower() != district.strip().lower():
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Access restricted to your registered district')
        risk_data = await self.calculate_project_risk(project)
        p_dict = project.model_dump(exclude_none=True)
        p_dict.update(risk_data)
        return ProjectRead(**p_dict)

    async def update_project(self, project_id: str, request: ProjectUpdate, user_payload: dict | None = None) -> ProjectRead:
        current = await self.project_repository.get_by_id(project_id)
        if current is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')

        if user_payload:
            role = user_payload.get('role')
            district = user_payload.get('district')
            if role in ['Citizen', 'Engineer'] and district and current.location:
                if current.location.strip().lower() != district.strip().lower():
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='You do not have permission to update projects outside your district')

        updates = request.model_dump(exclude_unset=True)
        updated_project = await self.project_repository.update(project_id, updates)
        if updated_project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')

        actor_name = "System"
        if user_payload:
            actor_name = user_payload.get('name') or user_payload.get('email') or user_payload.get('sub', 'System')

        # Auto-generation of timeline milestones
        try:
            timeline_repo = TimelineRepository()
            timeline_events_to_create = []
            
            # Completion checks
            if current.completion < 20 and updated_project.completion >= 20:
                timeline_events_to_create.append(("20% Completion Milestone", f"Project has reached 20% completion. Progress updated by {actor_name}."))
            if current.completion < 50 and updated_project.completion >= 50:
                timeline_events_to_create.append(("50% Completion Milestone", f"Project has reached half-way completion milestone. Progress updated by {actor_name}."))
            if current.completion < 100 and updated_project.completion == 100:
                timeline_events_to_create.append(("Project Completed", f"Work completed at 100%. Recorded by {actor_name}."))
                
            # Status checks
            if current.status != updated_project.status:
                if updated_project.status == "Completed":
                    timeline_events_to_create.append(("Project Completed", f"Project status marked as Completed by {actor_name}."))
                elif updated_project.status == "Delayed":
                    timeline_events_to_create.append(("Project Delayed Alert", f"Project execution status flagged as Delayed by {actor_name}."))
                elif updated_project.status == "In Progress":
                    timeline_events_to_create.append(("Construction Phase Commenced", f"Ground construction started. Updated by {actor_name}."))
                elif updated_project.status == "Inspection Scheduled":
                    timeline_events_to_create.append(("Quality Inspection Scheduled", f"Inspection phase set. Updated by {actor_name}."))

            # Engineer assigned checks
            if current.assigned_engineer != updated_project.assigned_engineer and updated_project.assigned_engineer:
                timeline_events_to_create.append((f"Engineer Assigned", f"Engineer {updated_project.assigned_engineer} assigned to supervise project site."))

            for evt_title, evt_desc in timeline_events_to_create:
                # Avoid duplicate timeline event insertions
                event = TimelineInDB(
                    project_id=project_id,
                    title=evt_title,
                    description=evt_desc,
                    created_by=actor_name,
                    timestamp=datetime.now(timezone.utc),
                    image_url=None
                )
                await timeline_repo.create(event)
        except Exception as e:
            print("Failed to auto log timeline update:", e)

        # Consolidated Activity Log
        try:
            msg_parts = []
            if current.completion != updated_project.completion:
                msg_parts.append(f"updated progress to {updated_project.completion}%")
            if current.status != updated_project.status:
                msg_parts.append(f"changed status to {updated_project.status}")
            if current.assigned_engineer != updated_project.assigned_engineer and updated_project.assigned_engineer:
                msg_parts.append(f"assigned engineer {updated_project.assigned_engineer}")
            if current.budget != updated_project.budget:
                msg_parts.append(f"revised budget to ₹{updated_project.budget:,.0f}")
                
            if msg_parts:
                emoji = "🟢" if updated_project.status == "Completed" else "🔴" if updated_project.status == "Delayed" else "🔵" if updated_project.status == "In Progress" else "🟡"
                message = f"{emoji} {actor_name} " + " and ".join(msg_parts)
                
                activities_col = get_database()['activities']
                await activities_col.insert_one({
                    'type': 'PROJECT_UPDATE',
                    'message': message,
                    'project_id': project_id,
                    'project_name': updated_project.name,
                    'timestamp': datetime.now(timezone.utc)
                })
        except Exception as e:
            print("Failed to log activities feed:", e)

        risk_data = await self.calculate_project_risk(updated_project)
        p_dict = updated_project.model_dump(exclude_none=True)
        p_dict.update(risk_data)
        return ProjectRead(**p_dict)

    async def delete_project(self, project_id: str) -> dict[str, str]:
        deleted = await self.project_repository.delete(project_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        return {'message': 'Project deleted successfully'}
