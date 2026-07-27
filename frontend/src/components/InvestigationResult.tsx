import { useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Link2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import type { InvestigationResponse } from '../types'

function getTrustLevel(score: number) {
  if (score >= 80) {
    return {
      label: 'Very High',
      className: 'very-high',
    }
  }

  if (score >= 60) {
    return {
      label: 'High',
      className: 'high',
    }
  }

  if (score >= 40) {
    return {
      label: 'Medium',
      className: 'medium',
    }
  }

  if (score >= 20) {
    return {
      label: 'Low',
      className: 'low',
    }
  }

  return {
    label: 'Very Low',
    className: 'very-low',
  }
}

interface InvestigationResultProps {
  result: InvestigationResponse
}

export function InvestigationResult({ result }: InvestigationResultProps) {
  const trustLevel = getTrustLevel(result.confidence.score)
  const [copied, setCopied] = useState(false)

  async function handleCopyLink() {
    if (!result.id) {
      return
    }

    const shareUrl = `${window.location.origin}/share/${result.id}`
    await navigator.clipboard.writeText(shareUrl)

    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="result-section">
      <div className="result-heading-row">
        <p className="eyebrow">Investigation result</p>

        {result.id && (
          <button
            type="button"
            className="share-button"
            onClick={handleCopyLink}
          >
            <Link2 size={15} />
            {copied ? 'Link copied' : 'Copy share link'}
          </button>
        )}
      </div>

      <div className="verdict-card">
        <div className="verdict-main">
          <div>
            <span className="verdict-label">Verdict</span>
            <h2>{result.investigation.verdict}</h2>
          </div>

          <div className="confidence-badge">
            <strong>{result.confidence.score}%</strong>
            <span>Investigation confidence</span>
          </div>
        </div>

        <p className="verdict-summary">
          {result.investigation.summary}
        </p>

         {trustLevel && (
            <div className="trust-meter">
              <div className="trust-meter-heading">
                <span>Evidence Trust Score</span>

                <strong className={`trust-level ${trustLevel.className}`}>
                  {trustLevel.label}
                </strong>
              </div>

              <div className="speedometer">
                <div
                  className="speedometer-fill"
                  style={{
                    '--trust-score': `${result.confidence.score * 1.8}deg`,
                  } as React.CSSProperties}
                />

                <div
                  className="speedometer-needle"
                  style={{
                    transform: `rotate(${result.confidence.score * 1.8 - 90}deg)`,
                  }}
                />

                <div className="speedometer-center" />

                <div className="speedometer-cover">
                  <strong>{result.confidence.score}</strong>
                  <span>out of 100</span>
                </div>
              </div>

              <div className="speedometer-labels">
                <span>Very Low</span>
                <span>Medium</span>
                <span>Very High</span>
              </div>

              <p className="trust-meter-description">
                Based on official sources, corroborating evidence and conflict analysis.
              </p>
            </div>
          )}

      </div>

      <section className="confidence-card">
        <div className="confidence-header">
          <div>
            <p className="eyebrow">Explainable confidence</p>

            <h3>
              Why this verdict received {result.confidence.score}%
            </h3>
          </div>

          <div className="confidence-score">
            {result.confidence.score}%
          </div>
        </div>

        <div className="confidence-track">
          <div
            className="confidence-fill"
            style={{ width: `${result.confidence.score}%` }}
          />
        </div>

        <div className="confidence-factors">
          {result.confidence.factors.map((factor, index) => (
            <div
              className="confidence-factor"
              key={`${factor.label}-${index}`}
            >
              <span>{factor.label}</span>

              <strong
                className={
                  factor.impact >= 0 ? 'positive' : 'negative'
                }
              >
                {factor.impact >= 0 ? '+' : ''}
                {factor.impact}
              </strong>
            </div>
          ))}
        </div>

        <div className="confidence-limitations">
          <p className="eyebrow">Why not 100%?</p>

          <ul>
            {result.confidence.limitations.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="claim-tree-card">
        <div className="section-heading">
          <GitBranch size={23} />

          <div>
            <p className="eyebrow">Claim tree</p>
            <h3>How the evidence connects</h3>
          </div>
        </div>

        <div className="claim-tree">
          <div className="claim-root">
            <span className="claim-root-label">Claim</span>
            <p>{result.claim}</p>
          </div>

          <div className="claim-tree-line" />

          <div className="claim-branches">
            <section className="claim-branch claim-branch-support">
              <div className="branch-heading">
                <CheckCircle2 size={19} />
                <h4>Supporting</h4>
              </div>

              {result.investigation.supporting_evidence.length === 0 ? (
                <p className="branch-empty">
                  No credible supporting evidence found.
                </p>
              ) : (
                result.investigation.supporting_evidence.map(
                  (item, index) => (
                    <article
                      className="claim-node"
                      key={`tree-support-${item.claim}-${index}`}
                    >
                      <p>{item.claim}</p>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.source ?? 'Open source'}
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </article>
                  ),
                )
              )}
            </section>

            <section className="claim-branch claim-branch-conflict">
              <div className="branch-heading">
                <XCircle size={19} />
                <h4>Conflicting</h4>
              </div>

              {result.investigation.contradicting_evidence.length === 0 ? (
                <p className="branch-empty">
                  No significant conflicting evidence found.
                </p>
              ) : (
                result.investigation.contradicting_evidence.map(
                  (item, index) => (
                    <article
                      className="claim-node"
                      key={`tree-conflict-${item.claim}-${index}`}
                    >
                      <p>{item.claim}</p>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.source ?? 'Open source'}
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </article>
                  ),
                )
              )}
            </section>

            <section className="claim-branch claim-branch-official">
              <div className="branch-heading">
                <ShieldCheck size={19} />
                <h4>Official evidence</h4>
              </div>

              {result.investigation.official_confirmation.found ? (
                <article className="claim-node">
                  <p>
                    {result.investigation.official_confirmation.statement ??
                      'A relevant official source was found.'}
                  </p>

                  {result.investigation.official_confirmation.url && (
                    <a
                      href={
                        result.investigation.official_confirmation.url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {result.investigation.official_confirmation.source ??
                        'Open official source'}
                      <ExternalLink size={13} />
                    </a>
                  )}
                </article>
              ) : (
                <p className="branch-empty">
                  No relevant official evidence found.
                </p>
              )}
            </section>
          </div>

          <div className="claim-tree-line claim-tree-line-bottom" />

          <div className="claim-outcome">
            <span>Final verdict</span>
            <strong>{result.investigation.verdict}</strong>

            <small>
              {result.confidence.score}% investigation confidence
            </small>
          </div>
        </div>
      </section>

      <section className="timeline-card">
        <div className="section-heading">
          <CalendarDays size={23} />

          <div>
            <p className="eyebrow">Story evolution</p>
            <h3>How the story developed</h3>
          </div>
        </div>

        {result.investigation.timeline.length === 0 ? (
          <p className="empty-state">
            No reliable timeline could be reconstructed.
          </p>
        ) : (
          <div className="timeline">
            {result.investigation.timeline.map((item, index) => (
              <article
                className="timeline-item"
                key={`${item.time}-${item.event}-${index}`}
              >
                <div className="timeline-marker">
                  <span />
                </div>

                <div className="timeline-content">
                  <time>{item.time ?? 'Date unavailable'}</time>
                  <p>{item.event}</p>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.source ?? 'Open source'}
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
