import { useState } from 'react'
import { verifyPassword } from '../lib/api'

export default function Login({ onAuth }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const ok = await verifyPassword(password)
    if (ok) {
      sessionStorage.setItem('fressnapf-auth', 'true')
      sessionStorage.setItem('fressnapf-token', password)
      onAuth(true)
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Fressnapf Support Tracker</h1>
          <p className="text-gray-500 mt-2">Enter the shared password to access the tracker</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={loading}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
            }`}
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm">Incorrect password. Please try again.</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Tracker'}
          </button>
        </form>
      </div>
    </div>
  )
}
