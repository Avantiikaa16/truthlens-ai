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

export interface InvestigationResponse {
  claim: string
  investigation: Investigation
  confidence: ConfidenceResult
  sources: ResearchSource[]
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