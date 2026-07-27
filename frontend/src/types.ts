export interface EvidenceItem {
  claim: string
  source: string | null
  url: string | null
}

export interface TimelineEvent {
  time: string | null
  event: string
  source: string | null
  url: string | null
}

export interface OfficialConfirmation {
  found: boolean
  status: string | null
  statement: string | null
  source: string | null
  url: string | null
}

export interface Investigation {
  verdict: string
  summary: string
  supporting_evidence: EvidenceItem[]
  contradicting_evidence: EvidenceItem[]
  official_confirmation: OfficialConfirmation
  timeline: TimelineEvent[]
}

export interface ResearchSource {
  title: string
  url: string
  snippets: string[]
}

export interface SourceRelationship {
  url: string
  source: string | null
  is_independent: boolean
  cites: string[]
}

export interface IndependentConfirmationResult {
  score: number
  independent_count: number
  total_count: number
  relationships: SourceRelationship[]
}

export interface InvestigationResponse {
  id: string | null
  claim: string
  investigation: Investigation
  confidence: ConfidenceResult
  independent_confirmation: IndependentConfirmationResult
  sources: ResearchSource[]
}

export interface InvestigationSummary {
  id: string
  claim: string
  verdict: string
  confidence_score: number
  created_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface ConfidenceFactor {
  label: string
  impact: number
}

export interface ConfidenceResult {
  score: number
  factors: ConfidenceFactor[]
  limitations: string[]
}