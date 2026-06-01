from fastapi import APIRouter, Depends

from app.core.security import decode_token
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter()
service = ProjectService()


@router.post('', response_model=ProjectRead)
async def create_project(request: ProjectCreate, payload: dict = Depends(decode_token)) -> ProjectRead:
    # Only Officers can create projects
    role = payload.get('role')
    if role != 'Officer':
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only Officers can create projects')
    return await service.create_project(request, created_by=payload.get('sub'))


@router.get('', response_model=list[ProjectRead])
async def list_projects(payload: dict = Depends(decode_token)) -> list[ProjectRead]:
    return await service.list_projects()


@router.get('/{project_id}', response_model=ProjectRead)
async def get_project(project_id: str, payload: dict = Depends(decode_token)) -> ProjectRead:
    return await service.get_project(project_id)


@router.put('/{project_id}', response_model=ProjectRead)
async def update_project(project_id: str, request: ProjectUpdate, payload: dict = Depends(decode_token)) -> ProjectRead:
    return await service.update_project(project_id, request)


@router.delete('/{project_id}')
async def delete_project(project_id: str, payload: dict = Depends(decode_token)) -> dict[str, str]:
    return await service.delete_project(project_id)
