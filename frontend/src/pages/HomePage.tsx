import { useEffect, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'

import {
  investigateClaimStream,
  type InvestigationProgress,
} from '../api'
import { InvestigationResult } from '../components/InvestigationResult'
import type { InvestigationResponse } from '../types'

const exampleClaimPool = [
  {
    label: 'Health',
    claim: 'The FDA approved a new mRNA vaccine for RSV in adults over 60',
  },
  {
    label: 'Agriculture',
    claim: 'The USDA declared a nationwide emergency over bird flu in egg-laying hens',
  },
  {
    label: 'Tech',
    claim: 'Tesla started autonomous robotaxis in California',
  },
  {
    label: 'Social',
    claim: 'X was banned in Brazil after Musk defied a court order',
  },
  {
    label: 'Politics',
    claim: 'The EU approved the AI Act regulating high-risk artificial intelligence systems',
  },
  {
    label: 'Finance',
    claim: 'The Federal Reserve cut interest rates by 50 basis points in September 2024',
  },
  {
    label: 'Climate',
    claim: 'NASA confirmed 2024 as the hottest year on record',
  },
  {
    label: 'Sports',
    claim: 'FIFA awarded Saudi Arabia the right to host the 2034 World Cup',
  },
  {
    label: 'Entertainment',
    claim: 'Barbie became the highest-grossing film of 2023',
  },
  {
    label: 'Legal',
    claim: 'The U.S. Supreme Court overturned Roe v. Wade',
  },
  {
    label: 'Education',
    claim: 'Harvard University eliminated tuition for families earning under $200,000',
  },
  {
    label: 'Science',
    claim: 'CERN confirmed the discovery of a new fundamental particle',
  },
  {
    label: 'Business',
    claim: "China's Evergrande Group was ordered to liquidate by a Hong Kong court",
  },
  {
    label: 'Crime & Safety',
    claim: 'The FBI confirmed a nationwide spike in cybercrime in 2024',
  },
  {
    label: 'Food Safety',
    claim: 'The CDC linked a salmonella outbreak to cucumbers in 2024',
  },
  {
    label: 'Space',
    claim: "NASA's Artemis II mission launched astronauts around the Moon",
  },
]

function pickRandomExamples<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

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

export function HomePage() {
  const [displayedExamples] = useState(() =>
    pickRandomExamples(exampleClaimPool, 4),
  )
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
    <>
      <section className="hero">
        <div className="brand">
          <ShieldCheck size={34} />
          <span>TruthLens</span>
        </div>

        <h1>Investigate what the evidence actually supports.</h1>

        <p className="subtitle">
          From health and policy claims to tech launches and viral posts,
          enter any claim and TruthLens checks it against live sources,
          conflicts, official confirmation and how the story evolved.
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

        <div className="example-chips">
          {displayedExamples.map((example) => (
            <button
              type="button"
              className="example-chip"
              key={example.label}
              disabled={isLoading}
              onClick={() => setClaim(example.claim)}
            >
              <span className="example-chip-label">{example.label}</span>
              {example.claim}
            </button>
          ))}
        </div>

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

      {result && <InvestigationResult result={result} />}
    </>
  )
}
