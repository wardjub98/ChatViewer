import React, { useCallback, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Lightbox({ images, index, onClose, onPrev, onNext, onJump }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft') onPrev()
    else if (e.key === 'ArrowRight') onNext()
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  if (index == null || !images[index]) return null
  const img = images[index]

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10"><X /></button>
      {onJump && (
        <button
          onClick={() => { onJump(img.messageId); onClose() }}
          className="absolute top-4 left-4 text-white text-sm px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20"
        >
          Go to message
        </button>
      )}
      <button onClick={onPrev} className="absolute left-4 text-white p-3 rounded-full hover:bg-white/10"><ChevronLeft size={28} /></button>
      <img src={img.url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" />
      <button onClick={onNext} className="absolute right-4 text-white p-3 rounded-full hover:bg-white/10"><ChevronRight size={28} /></button>
      <div className="absolute bottom-4 text-white/80 text-xs">{index + 1} / {images.length}</div>
    </div>
  )
}
