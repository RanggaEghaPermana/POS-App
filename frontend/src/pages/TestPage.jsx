import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'

export default function TestPage() {
  const { token, user } = useAuth()
  const [message, setMessage] = useState('Testing...')

  useEffect(() => {
    console.log('TestPage mounted')
    console.log('Token:', token)
    console.log('User:', user)
    setMessage(`Token: ${token ? 'EXISTS' : 'MISSING'}, User: ${user ? user.name : 'NO USER'}`)
  }, [token, user])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Page</h1>
      <p>Status: {message}</p>
      <p>Current Time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>Debug Info:</strong>
        <br />Token: {token ? token.substring(0, 20) + '...' : 'null'}
        <br />User: {user ? JSON.stringify(user) : 'null'}
        <br />API Base: {import.meta.env.VITE_API_BASE || 'undefined'}
      </div>
    </div>
  )
}