import React, { useMemo, useState } from 'react'
import { Image as ImageIcon, Film, Mic, X, CornerDownLeft } from 'lucide-react'
import Lightbox from './Lightbox.jsx'
import VideoThumb from './VideoThumb.jsx'
import AudioPlayer from './AudioPlayer.jsx'

export default function MediaSidebar({ open, onClose, messages, onJumpTo }) {
  const [tab, setTab] = useState('images')
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [activeVideo, setActiveVideo] = useState(null) // url string

  const { images, videos, audios } = useMemo(() => {
    const images = [], videos = [], audios = []
    for (const m of messages) {
      if (!m._media || m._media.missing) continue
      const item = {
        url: m._media.url, mime: m._media.mime,
        messageId: m._id, date: m.date, author: m.author,
        filename: m._media.filename,
      }
      // Only true photos go in the Images gallery — stickers (kind === 'sticker')
      // are intentionally excluded.
      if (m._media.kind === 'image') images.push(item)
      else if (m._media.kind === 'video') videos.push(item)
      else if (m._media.kind === 'audio') audios.push(item)
    }
    return { images, videos, audios }
  }, [messages])

  if (!open) return null

  const tabs = [
    { id: 'images', label: 'Images', icon: ImageIcon, count: images.length },
    { id: 'videos', label: 'Videos', icon: Film, count: videos.length },
    { id: 'audios', label: 'Voice', icon: Mic, count: audios.length },
  ]

  return (
    <aside className="w-[340px] h-full shrink-0 border-l border-wa-border dark:border-wa-borderDark bg-white dark:bg-wa-panelDark flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-wa-border dark:border-wa-borderDark shrink-0">
        <h3 className="font-semibold">Media, links and docs</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><X size={18} /></button>
      </div>
      <div className="flex border-b border-wa-border dark:border-wa-borderDark shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setActiveVideo(null) }}
            className={[
              'flex-1 px-3 py-2 text-sm inline-flex items-center justify-center gap-1.5',
              tab === t.id
                ? 'border-b-2 border-wa-green text-wa-green'
                : 'text-wa-muted dark:text-wa-mutedDark hover:bg-black/5 dark:hover:bg-white/10',
            ].join(' ')}
          >
            <t.icon size={14} /> {t.label} <span className="opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/*
        flex-1 + min-h-0 is critical: without min-h-0 the inner content can grow
        and push the flex item past its parent, killing overflow scrolling.
        overscroll-contain stops the page from rubber-banding on mobile.
      */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {tab === 'images' && (
          images.length === 0 ? <Empty label="No images" /> : (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((it, i) => (
                <div key={it.messageId} className="relative group aspect-square">
                  <img
                    src={it.url} alt=""
                    className="absolute inset-0 w-full h-full object-cover rounded cursor-pointer"
                    onClick={() => setLightboxIdx(i)}
                    loading="lazy"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); onJumpTo(it.messageId) }}
                    title="Go to message"
                    className="absolute bottom-1 right-1 p-1 rounded bg-black/60 text-white opacity-80 md:opacity-0 md:group-hover:opacity-100 transition"
                  >
                    <CornerDownLeft size={12} />
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'videos' && (
          videos.length === 0 ? <Empty label="No videos" /> : (
            <div className="grid grid-cols-2 gap-2">
              {videos.map((it) => (
                <div key={it.messageId} className="space-y-1">
                  <VideoThumb
                    src={it.url}
                    onClick={() => setActiveVideo(activeVideo === it.url ? null : it.url)}
                  />
                  {activeVideo === it.url && (
                    <video src={it.url} controls autoPlay playsInline className="w-full rounded bg-black" />
                  )}
                  <button
                    onClick={() => onJumpTo(it.messageId)}
                    className="w-full text-xs inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                  >
                    <CornerDownLeft size={12} /> Go to message
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'audios' && (
          audios.length === 0 ? <Empty label="No voice notes" /> : (
            <ul className="space-y-2">
              {audios.map((it) => (
                <li key={it.messageId} className="rounded border border-wa-border dark:border-wa-borderDark p-2">
                  <div className="text-xs text-wa-muted dark:text-wa-mutedDark mb-2 flex justify-between gap-2">
                    <span className="truncate">{it.author || 'Unknown'}</span>
                    <span className="shrink-0">{it.date ? new Date(it.date).toLocaleDateString() : ''}</span>
                  </div>
                  <AudioPlayer src={it.url} mime={it.mime} />
                  <button
                    onClick={() => onJumpTo(it.messageId)}
                    className="mt-2 w-full text-xs inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                  >
                    <CornerDownLeft size={12} /> Go to message
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      {lightboxIdx != null && images.length > 0 && (
        <Lightbox
          images={images}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => (i - 1 + images.length) % images.length)}
          onNext={() => setLightboxIdx(i => (i + 1) % images.length)}
          onJump={onJumpTo}
        />
      )}
    </aside>
  )
}

function Empty({ label }) {
  return <div className="text-center text-sm text-wa-muted dark:text-wa-mutedDark py-10">{label}</div>
}
