import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Mic } from 'lucide-react'

// Deterministic pseudo-waveform based on the URL string, so each clip looks unique.
function waveformFor(seed, bars = 36) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const out = []
  for (let i = 0; i < bars; i++) {
    h = (h * 1664525 + 1013904223) >>> 0
    out.push(0.25 + (h % 1000) / 1000 * 0.75)
  }
  return out
}

const SPEEDS = [1, 1.5, 2]

export default function AudioPlayer({ src, mime, outgoing }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0..1
  const [duration, setDuration] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(0)
  const bars = waveformFor(src)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => {
      if (el.duration && isFinite(el.duration)) {
        setProgress(el.currentTime / el.duration)
        setDuration(el.duration)
      }
    }
    const onLoaded = () => { if (isFinite(el.duration)) setDuration(el.duration) }
    const onEnd = () => { setPlaying(false); setProgress(0) }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('ended', onEnd)
    }
  }, [src])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else { el.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length
    setSpeedIdx(next)
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next]
  }

  const onSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    setProgress(p)
    if (audioRef.current && duration) audioRef.current.currentTime = p * duration
  }

  const mm = (s) => {
    if (!s || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={[
      'flex items-center gap-3 min-w-[240px] max-w-[320px]',
      outgoing ? 'text-wa-text dark:text-wa-textDark' : 'text-wa-text dark:text-wa-textDark',
    ].join(' ')}>
      <audio ref={audioRef} src={src} preload="metadata" type={mime} />
      <button
        onClick={toggle}
        className="shrink-0 w-9 h-9 rounded-full bg-wa-green text-white flex items-center justify-center hover:bg-wa-greenDark"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div
          onClick={onSeek}
          className="relative h-6 flex items-center cursor-pointer select-none"
        >
          {bars.map((h, i) => {
            const filled = i / bars.length <= progress
            return (
              <span
                key={i}
                className="wave-bar"
                style={{
                  height: `${Math.max(3, h * 22)}px`,
                  opacity: filled ? 1 : 0.4,
                  color: filled ? '#00a884' : undefined,
                }}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] mt-0.5 text-wa-muted dark:text-wa-mutedDark">
          <span className="inline-flex items-center gap-1"><Mic size={10} /> {mm(duration * progress)} / {mm(duration)}</span>
          <button
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            title="Playback speed"
          >
            {SPEEDS[speedIdx]}x
          </button>
        </div>
      </div>
    </div>
  )
}
