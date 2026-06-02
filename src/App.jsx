import React, { useCallback, useEffect, useMemo, useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen.jsx'
import StatsDashboard from './components/StatsDashboard.jsx'
import ChatLayout from './components/ChatLayout.jsx'
import { parseZipFolder } from './lib/parseUpload.js'
import { computeStats } from './lib/stats.js'

export default function App() {
  const [stage, setStage] = useState('welcome') // 'welcome' | 'stats' | 'chat'
  const [data, setData] = useState(null) // {messages, mediaMap, participants}
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const handleUpload = useCallback(async (files) => {
    setLoading(true); setError(null)
    try {
      const parsed = await parseZipFolder(files)
      setData(parsed)
      setStage('stats')
      const { default: confetti } = await import('canvas-confetti')
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } })
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to parse the chat folder.')
    } finally {
      setLoading(false)
    }
  }, [])

  const stats = useMemo(() => (data ? computeStats(data.messages) : null), [data])

  const reset = () => { setData(null); setStage('welcome') }

  if (stage === 'welcome') {
    return (
      <WelcomeScreen
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        onUpload={handleUpload}
        loading={loading}
        error={error}
      />
    )
  }

  if (stage === 'stats') {
    return (
      <StatsDashboard
        stats={stats}
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        onContinue={() => setStage('chat')}
        onReset={reset}
      />
    )
  }

  return (
    <ChatLayout
      data={data}
      stats={stats}
      dark={dark}
      onToggleDark={() => setDark(d => !d)}
      onReset={reset}
      onBackToStats={() => setStage('stats')}
    />
  )
}
