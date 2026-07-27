import json
import asyncio
from collections.abc import AsyncGenerator

from fastapi.responses import StreamingResponse
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_optional_user
from app.confidence import calculate_confidence
from app.db.models import Investigation, User
from app.db.session import get_db
from app.models import (
    ConfidenceResult,
    Investigation as InvestigationSchema,
    InvestigationRequest,
    InvestigationResponse,
    ResearchSource,
)
from app.you_client import research_claim

router = APIRouter(prefix="/api", tags=["investigate"])


def parse_research_content(content: Any) -> dict[str, Any]:
    """
    Convert You.com Research content into a Python dictionary.

    Handles:
    - JSON objects
    - JSON returned as a string
    - JSON wrapped in Markdown code fences
    """

    if isinstance(content, dict):
        return content

    if not isinstance(content, str) or not content.strip():
        raise HTTPException(
            status_code=502,
            detail="You.com returned empty or invalid research content.",
        )

    cleaned_content = content.strip()

    if cleaned_content.startswith("```json"):
        cleaned_content = cleaned_content[7:]
    elif cleaned_content.startswith("```"):
        cleaned_content = cleaned_content[3:]

    if cleaned_content.endswith("```"):
        cleaned_content = cleaned_content[:-3]

    cleaned_content = cleaned_content.strip()

    try:
        parsed_content = json.loads(cleaned_content)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "You.com did not return valid JSON.",
                "parsing_error": str(exc),
                "received_content": cleaned_content[:1000],
            },
        ) from exc

    if not isinstance(parsed_content, dict):
        raise HTTPException(
            status_code=502,
            detail="You.com Research JSON must be an object.",
        )

    return parsed_content


def create_sse_event(
    event: str,
    data: dict[str, Any],
) -> str:
    payload = json.dumps(data)
    return f"event: {event}\ndata: {payload}\n\n"


async def _run_investigation(request: InvestigationRequest) -> InvestigationResponse:
    raw_response = await research_claim(
        claim=request.claim,
        research_effort=request.research_effort,
    )

    output = raw_response.get("output", {})

    if not isinstance(output, dict):
        raise HTTPException(
            status_code=502,
            detail="You.com returned an invalid output structure.",
        )

    research_content = output.get("content", "")
    raw_sources = output.get("sources", [])

    parsed_content = parse_research_content(research_content)

    try:
        investigation = InvestigationSchema.model_validate(parsed_content)
    except ValidationError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Research JSON did not match the TruthLens schema.",
                "validation_errors": exc.errors(),
                "received_data": parsed_content,
            },
        ) from exc

    if not isinstance(raw_sources, list):
        raw_sources = []

    sources = [
        ResearchSource(
            title=source.get("title", "Untitled source"),
            url=source.get("url", ""),
            snippets=source.get("snippets") or [],
        )
        for source in raw_sources
        if isinstance(source, dict) and source.get("url")
    ]

    confidence_data = calculate_confidence(
        investigation=investigation,
        source_count=len(sources),
    )

    confidence = ConfidenceResult.model_validate(confidence_data)

    return InvestigationResponse(
        claim=request.claim,
        investigation=investigation,
        confidence=confidence,
        sources=sources,
    )


async def _persist_investigation(
    db: AsyncSession,
    request: InvestigationRequest,
    result: InvestigationResponse,
    user: User | None,
) -> str | None:
    try:
        row = Investigation(
            user_id=user.id if user else None,
            claim=request.claim,
            research_effort=request.research_effort,
            result=result.model_dump(mode="json"),
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
        return str(row.id)
    except Exception:
        await db.rollback()
        return None


@router.post(
    "/investigate",
    response_model=InvestigationResponse,
)
async def investigate(
    request: InvestigationRequest,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> InvestigationResponse:
    result = await _run_investigation(request)
    investigation_id = await _persist_investigation(db, request, result, user)
    return result.model_copy(update={"id": investigation_id})


@router.post("/investigate-stream")
async def investigate_stream(
    request: InvestigationRequest,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            yield create_sse_event(
                "progress",
                {
                    "step": "starting",
                    "message": "Preparing the investigation...",
                    "progress": 10,
                },
            )

            await asyncio.sleep(0.1)

            yield create_sse_event(
                "progress",
                {
                    "step": "researching",
                    "message": "Searching and comparing live web sources...",
                    "progress": 25,
                },
            )

            raw_response = await research_claim(
                claim=request.claim,
                research_effort=request.research_effort,
            )

            yield create_sse_event(
                "progress",
                {
                    "step": "research_complete",
                    "message": "Live research completed.",
                    "progress": 60,
                },
            )

            output = raw_response.get("output", {})

            if not isinstance(output, dict):
                raise HTTPException(
                    status_code=502,
                    detail="You.com returned an invalid output structure.",
                )

            yield create_sse_event(
                "progress",
                {
                    "step": "validating",
                    "message": "Validating evidence and source relationships...",
                    "progress": 72,
                },
            )

            research_content = output.get("content", "")
            raw_sources = output.get("sources", [])

            parsed_content = parse_research_content(research_content)

            try:
                investigation = InvestigationSchema.model_validate(parsed_content)
            except ValidationError as exc:
                raise HTTPException(
                    status_code=502,
                    detail={
                        "message": "Research JSON did not match the TruthLens schema.",
                        "validation_errors": exc.errors(),
                    },
                ) from exc

            if not isinstance(raw_sources, list):
                raw_sources = []

            sources = [
                ResearchSource(
                    title=source.get("title", "Untitled source"),
                    url=source.get("url", ""),
                    snippets=source.get("snippets") or [],
                )
                for source in raw_sources
                if isinstance(source, dict) and source.get("url")
            ]

            yield create_sse_event(
                "progress",
                {
                    "step": "confidence",
                    "message": "Calculating explainable confidence...",
                    "progress": 88,
                },
            )

            confidence_data = calculate_confidence(
                investigation=investigation,
                source_count=len(sources),
            )

            confidence = ConfidenceResult.model_validate(confidence_data)

            result = InvestigationResponse(
                claim=request.claim,
                investigation=investigation,
                confidence=confidence,
                sources=sources,
            )

            investigation_id = await _persist_investigation(db, request, result, user)
            result = result.model_copy(update={"id": investigation_id})

            yield create_sse_event(
                "progress",
                {
                    "step": "complete",
                    "message": "Investigation ready.",
                    "progress": 100,
                },
            )

            yield create_sse_event(
                "result",
                result.model_dump(mode="json"),
            )

        except HTTPException as exc:
            yield create_sse_event(
                "error",
                {
                    "message": exc.detail,
                },
            )

        except Exception as exc:
            yield create_sse_event(
                "error",
                {
                    "message": f"Investigation failed: {str(exc)}",
                },
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
