import React, { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'

// Lightweight video thumbnail: renders a <video> at the start (no controls),
// seeks to ~1s once metadata loads so the browser paints a real frame, and
// swaps in a full controllable player on click. Avoids the "black box +
// play button" placeholder the bare <video> element shows for blob URLs.
export default function VideoThumb({ src, onClick }) {
  const ref = useRef(null)
  const [activated, setActivated] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || activated) return
    const onLoaded = () => {
      try {
        const target = Math.min(1, (el.duration || 1) * 0.1)
        if (isFinite(target) && target > 0) el.currentTime = target
        else setReady(true)
      } catch { setReady(true) }
    }
    const onSeeked = () => setReady(true)
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('seeked', onSeeked)
    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('seeked', onSeeked)
    }
  }, [activated])

  if (activated) {
    return (
      <video
        src={src}
        controls
        autoPlay
        playsInline
        className="w-full rounded bg-black"
      />
    )
  }

  return (
    <div
      onClick={() => { onClick ? onClick() : setActivated(true) }}
      className="relative w-full aspect-video rounded overflow-hidden bg-black cursor-pointer group"
    >
      <video
        ref={ref}
        src={src}
        preload="metadata"
        muted
        playsInline
        className={[
          'absolute inset-0 w-full h-full object-cover transition-opacity',
          ready ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
        <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center">
          <Play size={20} className="ml-0.5" />
        </div>
      </div>
    </div>
  )
}
