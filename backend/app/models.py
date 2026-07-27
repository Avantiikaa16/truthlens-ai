from typing import Literal

from pydantic import BaseModel, Field


class InvestigationRequest(BaseModel):
    claim: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="A factual claim to investigate",
    )
    research_effort: Literal["lite", "standard", "deep"] = "lite"


class EvidenceItem(BaseModel):
    claim: str
    source: str | None = None
    url: str | None = None


class TimelineEvent(BaseModel):
    time: str | None = None
    event: str
    source: str | None = None
    url: str | None = None


class OfficialConfirmation(BaseModel):
    found: bool
    status: str | None = None
    statement: str | None = None
    source: str | None = None
    url: str | None = None

class SourceRelationship(BaseModel):
    url: str
    source: str | None = None
    is_independent: bool = True
    cites: list[str] = []

class Investigation(BaseModel):
    verdict: str
    summary: str
    supporting_evidence: list[EvidenceItem] = []
    contradicting_evidence: list[EvidenceItem] = []
    official_confirmation: OfficialConfirmation
    timeline: list[TimelineEvent] = []
    source_relationships: list[SourceRelationship] = []

class ResearchSource(BaseModel):
    title: str
    url: str
    snippets: list[str] = []

class IndependentConfirmationResult(BaseModel):
    score: int = 0
    independent_count: int = 0
    total_count: int = 0
    relationships: list[SourceRelationship] = []

class InvestigationResponse(BaseModel):
    id: str | None = None
    claim: str
    investigation: Investigation
    confidence: ConfidenceResult
    independent_confirmation: IndependentConfirmationResult = Field(
        default_factory=IndependentConfirmationResult
    )
    sources: list[ResearchSource]

class ConfidenceFactor(BaseModel):
    label: str
    impact: int

class ConfidenceResult(BaseModel):
    score: int
    factors: list[ConfidenceFactor] = []

class ConfidenceResult(BaseModel):
    score: int
    factors: list[ConfidenceFactor] = []
    limitations: list[str] = []