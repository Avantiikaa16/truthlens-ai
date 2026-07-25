import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import {
  investigateClaimStream,
  type InvestigationProgress,
} from './api'
import type { InvestigationResponse } from './types'
import './App.css'

const detectiveStepOrder = [
  'starting',
  'researching',
  'research_complete',
  'validating',
  'confidence',
  'complete',
]

const detectiveSteps = [
  {
    step: 'starting',
    label: 'Prepare investigation',
  },
  {
    step: 'researching',
    label: 'Search live sources',
  },
  {
    step: 'research_complete',
    label: 'Review strongest sources',
  },
  {
    step: 'validating',
    label: 'Validate evidence and conflicts',
  },
  {
    step: 'confidence',
    label: 'Calculate confidence',
  },
  {
    step: 'complete',
    label: 'Build final investigation',
  },
]

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

function App() {
  const [claim, setClaim] = useState('')
  const [result, setResult] = useState<InvestigationResponse | null>(null)
  const [pendingResult, setPendingResult] =
    useState<InvestigationResponse | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [progress, setProgress] = useState<InvestigationProgress>({
    step: 'starting',
    message: 'Preparing the investigation...',
    progress: 0,
  })

  const trustLevel = result
    ? getTrustLevel(result.confidence.score)
    : null

  useEffect(() => {
    if (!isLoading || pendingResult) {
      return
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current.progress >= 95) {
          return current
        }

        const nextProgress = Math.min(current.progress + 2, 95)

        let nextStep = current.step
        let nextMessage = current.message

        if (nextProgress < 25) {
          nextStep = 'starting'
          nextMessage = 'Preparing the investigation...'
        } else if (nextProgress < 45) {
          nextStep = 'researching'
          nextMessage = 'Searching and comparing live web sources...'
        } else if (nextProgress < 60) {
          nextStep = 'research_complete'
          nextMessage = 'Reviewing the strongest sources...'
        } else if (nextProgress < 75) {
          nextStep = 'validating'
          nextMessage = 'Validating evidence and checking conflicts...'
        } else if (nextProgress < 90) {
          nextStep = 'confidence'
          nextMessage = 'Calculating explainable confidence...'
        } else {
          nextStep = 'complete'
          nextMessage = 'Building the final investigation...'
        }

        return {
          step: nextStep,
          message: nextMessage,
          progress: nextProgress,
        }
      })
    }, 450)

    return () => window.clearInterval(interval)
  }, [isLoading, pendingResult])

  useEffect(() => {
    if (!pendingResult || !isLoading) {
      return
    }

    setProgress({
      step: 'complete',
      message: 'Investigation complete.',
      progress: 100,
    })

    const timeout = window.setTimeout(() => {
      setResult(pendingResult)
      setPendingResult(null)
      setIsLoading(false)

      window.setTimeout(() => {
        document
          .querySelector('.result-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [pendingResult, isLoading])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedClaim = claim.trim()

    if (cleanedClaim.length < 5) {
      setError('Enter a specific claim to investigate.')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)
    setPendingResult(null)

    setProgress({
      step: 'starting',
      message: 'Preparing the investigation...',
      progress: 0,
    })

    try {
      await investigateClaimStream(cleanedClaim, {
        onProgress: (nextProgress) => {
          setProgress((current) => ({
            ...nextProgress,
            progress: Math.max(current.progress, nextProgress.progress),
          }))
        },

        onResult: (investigation) => {
          setPendingResult(investigation)
        },
      })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong.',
      )

      setPendingResult(null)
      setIsLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="brand">
          <ShieldCheck size={34} />
          <span>TruthLens</span>
        </div>

        <h1>Investigate what the evidence actually supports.</h1>

        <p className="subtitle">
          Enter a live claim. TruthLens checks current sources, conflicts,
          official confirmation and how the story evolved.
        </p>

        <form className="claim-form" onSubmit={handleSubmit}>
          <textarea
            value={claim}
            onChange={(event) => setClaim(event.target.value)}
            placeholder="Example: Tesla started autonomous robotaxis in California"
            disabled={isLoading}
            rows={3}
          />

          <button type="submit" disabled={isLoading}>
            <Search size={19} />
            {isLoading ? 'Investigating…' : 'Investigate claim'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </section>

      {isLoading && (
        <section className="detective-card">
          <p className="eyebrow">AI Detective Mode</p>
          <h2>Investigating live evidence</h2>

          <div className="detective-status">
            <span className="spinner" />

            <div>
              <strong>{progress.message}</strong>
              <p>{progress.progress}% complete</p>
            </div>
          </div>

          <div className="detective-progress-track">
            <div
              className="detective-progress-fill"
              style={{ width: `${progress.progress}%` }}
            />
          </div>

          <div className="detective-steps">
            {detectiveSteps.map(({ step, label }) => {
              const currentIndex = detectiveStepOrder.indexOf(progress.step)
              const stepIndex = detectiveStepOrder.indexOf(step)

              const completed =
                progress.progress === 100 || stepIndex < currentIndex
              const active =
                progress.progress < 100 && step === progress.step

              return (
                <div
                  className={`detective-step ${
                    completed ? 'completed' : active ? 'active' : ''
                  }`}
                  key={step}
                >
                  <span>{completed ? '✓' : active ? '●' : '○'}</span>
                  {label}
                </div>
              )
            })}
          </div>

          <p className="loading-note">
            All displayed evidence comes from the live You.com investigation.
          </p>
        </section>
      )}

      {result && (
        <section className="result-section">
          <p className="eyebrow">Investigation result</p>

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
      )}
    </main>
  )
}

export default App