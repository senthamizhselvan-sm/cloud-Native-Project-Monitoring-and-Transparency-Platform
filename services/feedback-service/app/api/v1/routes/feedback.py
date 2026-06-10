from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import decode_token, decode_token_optional
from app.schemas.feedback import FeedbackCreate, FeedbackRead, FeedbackUpdate
from app.services.feedback_service import FeedbackService

router = APIRouter()
service = FeedbackService()


@router.post('', response_model=FeedbackRead)
async def create_feedback(request: FeedbackCreate, payload: dict = Depends(decode_token)) -> FeedbackRead:
    citizen_id = payload.get('sub')
    if not citizen_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')
    district = None
    role = payload.get('role')
    if role in ['Citizen', 'Engineer']:
        district = payload.get('district')
    return await service.create_feedback(request, citizen_id=citizen_id, district=district)


@router.get('', response_model=list[FeedbackRead])
async def list_feedback(payload: dict = Depends(decode_token)) -> list[FeedbackRead]:
    role = payload.get('role', 'Citizen')
    citizen_id = payload.get('sub')
    if not citizen_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')
    district = None
    if role in ['Citizen', 'Engineer']:
        district = payload.get('district')
    return await service.list_feedback(role, citizen_id, district=district)


@router.get('/project/{project_id}', response_model=list[FeedbackRead])
async def list_by_project(project_id: str, payload: dict | None = Depends(decode_token_optional)) -> list[FeedbackRead]:
    district = None
    if payload:
        role = payload.get('role')
        if role in ['Citizen', 'Engineer']:
            district = payload.get('district')
    return await service.list_by_project(project_id, district=district)


@router.put('/{feedback_id}', response_model=FeedbackRead)
async def update_feedback(feedback_id: str, request: FeedbackUpdate, payload: dict = Depends(decode_token)) -> FeedbackRead:
    role = payload.get('role')
    if role not in ['Officer', 'Admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only Officers or Admins can update feedback')
    return await service.update_feedback(feedback_id, request)
