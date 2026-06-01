from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.models.project import ProjectInDB
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate


class ProjectService:
    def __init__(self, project_repository: ProjectRepository | None = None) -> None:
        self.project_repository = project_repository or ProjectRepository()

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
        return ProjectRead(**created_project.model_dump(exclude_none=True))

    async def list_projects(self) -> list[ProjectRead]:
        projects = await self.project_repository.list()
        return [ProjectRead(**project.model_dump(exclude_none=True)) for project in projects]

    async def get_project(self, project_id: str) -> ProjectRead:
        project = await self.project_repository.get_by_id(project_id)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        return ProjectRead(**project.model_dump(exclude_none=True))

    async def update_project(self, project_id: str, request: ProjectUpdate) -> ProjectRead:
        updates = request.model_dump(exclude_unset=True)
        project = await self.project_repository.update(project_id, updates)
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        return ProjectRead(**project.model_dump(exclude_none=True))

    async def delete_project(self, project_id: str) -> dict[str, str]:
        deleted = await self.project_repository.delete(project_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        return {'message': 'Project deleted successfully'}
