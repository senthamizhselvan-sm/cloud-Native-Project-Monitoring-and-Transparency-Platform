from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import decode_token, decode_token_optional
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import ProjectService
from app.schemas.timeline import TimelineCreate, TimelineRead
from app.models.timeline import TimelineInDB
from app.repositories.timeline_repository import TimelineRepository

router = APIRouter()
service = ProjectService()
timeline_repo = TimelineRepository()


@router.post('', response_model=ProjectRead)
async def create_project(request: ProjectCreate, payload: dict = Depends(decode_token)) -> ProjectRead:
    # Only Officers can create projects
    role = payload.get('role')
    if role != 'Officer':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only Officers can create projects')
    return await service.create_project(request, created_by=payload.get('sub'))


@router.get('', response_model=list[ProjectRead])
async def list_projects(payload: dict | None = Depends(decode_token_optional)) -> list[ProjectRead]:
    district = None
    if payload:
        role = payload.get('role')
        if role in ['Citizen', 'Engineer']:
            district = payload.get('district')
    return await service.list_projects(district=district)


@router.get('/{project_id}', response_model=ProjectRead)
async def get_project(project_id: str, payload: dict | None = Depends(decode_token_optional)) -> ProjectRead:
    district = None
    if payload:
        role = payload.get('role')
        if role in ['Citizen', 'Engineer']:
            district = payload.get('district')
    return await service.get_project(project_id, district=district)


@router.put('/{project_id}', response_model=ProjectRead)
async def update_project(project_id: str, request: ProjectUpdate, payload: dict = Depends(decode_token)) -> ProjectRead:
    return await service.update_project(project_id, request, user_payload=payload)


@router.delete('/{project_id}')
async def delete_project(project_id: str, payload: dict = Depends(decode_token)) -> dict[str, str]:
    return await service.delete_project(project_id)


@router.post('/{project_id}/timeline', response_model=TimelineRead)
async def add_timeline_event(
    project_id: str,
    request: TimelineCreate,
    payload: dict = Depends(decode_token)
) -> TimelineRead:
    role = payload.get('role')
    if role not in ['Officer', 'Engineer', 'Admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only Officers or Engineers can add timeline events')
    
    from datetime import datetime, timezone
    actor_name = payload.get('name') or payload.get('email') or payload.get('sub', 'system')
    event = TimelineInDB(
        project_id=project_id,
        title=request.title,
        description=request.description,
        created_by=actor_name,
        timestamp=datetime.now(timezone.utc),
        image_url=request.image_url
    )
    created = await timeline_repo.create(event)
    return TimelineRead(**created.model_dump(exclude_none=True))


@router.get('/{project_id}/timeline', response_model=list[TimelineRead])
async def list_timeline_events(
    project_id: str,
    payload: dict | None = Depends(decode_token_optional)
) -> list[TimelineRead]:
    events = await timeline_repo.list_by_project(project_id)
    return [TimelineRead(**e.model_dump(exclude_none=True)) for e in events]
