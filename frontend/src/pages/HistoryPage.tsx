import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router'

import { listMyInvestigations } from '../api'
import { useAuth } from '../context/AuthContext'
import type { InvestigationSummary } from '../types'

export function HistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [investigations, setInvestigations] = useState<InvestigationSummary[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      return
    }

    listMyInvestigations()
      .then(setInvestigations)
      .catch((requestError: unknown) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not load your history.',
        ),
      )
      .finally(() => setIsLoading(false))
  }, [user])

  if (isAuthLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <section className="hero">
      <p className="eyebrow">Your history</p>
      <h1>Past investigations</h1>

      {error && <div className="error-message">{error}</div>}

      {!error && !isLoading && investigations.length === 0 && (
        <p className="subtitle">
          You haven't investigated any claims yet.
        </p>
      )}

      <div className="history-list">
        {investigations.map((item) => (
          <Link
            key={item.id}
            to={`/share/${item.id}`}
            className="history-item"
          >
            <div>
              <div className="history-item-claim">{item.claim}</div>
              <div className="history-item-meta">
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                <span>{item.confidence_score}% confidence</span>
              </div>
            </div>

            <span className="history-item-verdict">{item.verdict}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
