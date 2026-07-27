import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../context/AuthContext'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await signup(email, password)
      navigate('/')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <h1>Sign up</h1>
        <p className="subtitle">
          Create an account to save your investigations and view your history.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}
