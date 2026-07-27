import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db.models import Investigation, User
from app.db.session import get_db
from app.models import InvestigationResponse
from app.schemas_auth import InvestigationSummary

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


@router.get("/mine", response_model=list[InvestigationSummary])
async def list_my_investigations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[InvestigationSummary]:
    result = await db.execute(
        select(Investigation)
        .where(Investigation.user_id == current_user.id)
        .order_by(Investigation.created_at.desc())
    )

    return [
        InvestigationSummary(
            id=str(row.id),
            claim=row.claim,
            verdict=row.result.get("investigation", {}).get("verdict", "Unknown"),
            confidence_score=row.result.get("confidence", {}).get("score", 0),
            created_at=row.created_at,
        )
        for row in result.scalars().all()
    ]


@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(
    investigation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> InvestigationResponse:
    investigation = await db.get(Investigation, investigation_id)

    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    return InvestigationResponse.model_validate({
        **investigation.result,
        "id": str(investigation.id),
    })
