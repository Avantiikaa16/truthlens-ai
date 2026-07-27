import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { getInvestigation } from '../api'
import { InvestigationResult } from '../components/InvestigationResult'
import type { InvestigationResponse } from '../types'

export function SharePage() {
  const { id } = useParams<{ id: string }>()
  const [result, setResult] = useState<InvestigationResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) {
      return
    }

    getInvestigation(id)
      .then(setResult)
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not load this investigation.',
        ),
      )
  }, [id])

  if (error) {
    return (
      <section className="hero">
        <div className="error-message">{error}</div>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="hero">
        <p className="subtitle">Loading investigation...</p>
      </section>
    )
  }

  return <InvestigationResult result={result} />
}
