import { useEffect, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'

import {
  investigateClaimStream,
  type InvestigationProgress,
} from '../api'
import { InvestigationResult } from '../components/InvestigationResult'
import type { InvestigationResponse } from '../types'

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

      {result && <InvestigationResult result={result} />}
    </>
  )
}
