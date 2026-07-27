import { Route, Routes } from 'react-router'

import { Navbar } from './components/Navbar'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { SharePage } from './pages/SharePage'
import { SignupPage } from './pages/SignupPage'
import './App.css'

function App() {
  return (
    <>
      <Navbar />

      <main className="app-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/share/:id" element={<SharePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
