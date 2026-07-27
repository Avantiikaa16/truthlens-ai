import { ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <ShieldCheck size={22} />
        <span>TruthLens</span>
      </Link>

      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-email">{user.email}</span>
            <Link to="/history">History</Link>
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="primary">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
