import React, { useState } from 'react'
import AudioPlayer from './AudioPlayer.jsx'
import { FileText, AlertCircle } from 'lucide-react'

function colorFor(name) {
  const palette = ['#06cf9c', '#a463f2', '#ffa629', '#ff7a7a', '#5dafff', '#f15c6d', '#9fc132']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

export default function MessageBubble({ message, outgoing, showAuthor, onOpenImage, query }) {
  const m = message
  const time = m.date ? new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const media = m._media

  const bubble = outgoing
    ? 'bg-wa-bubbleOut dark:bg-wa-bubbleOutDark text-wa-text dark:text-wa-textDark'
    : 'bg-wa-bubbleIn dark:bg-wa-bubbleInDark text-wa-text dark:text-wa-textDark'

  const tail = outgoing ? 'bubble-tail-out' : 'bubble-tail-in'

  const text = (m.message || '').replace(/<attached:[^>]+>/gi, '').trim()

  const renderText = () => {
    if (!text) return null
    if (!query) return <span className="whitespace-pre-wrap break-words">{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx < 0) return <span className="whitespace-pre-wrap break-words">{text}</span>
    return (
      <span className="whitespace-pre-wrap break-words">
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-500/40 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </span>
    )
  }

  return (
    <div className={['flex px-3', outgoing ? 'justify-end' : 'justify-start'].join(' ')}>
      <div className={[
        'relative max-w-[78%] md:max-w-[65%] rounded-lg px-2.5 py-1.5 shadow-sm',
        bubble,
        showAuthor ? tail : '',
      ].join(' ')}>
        {showAuthor && !outgoing && (
          <div className="text-xs font-semibold mb-0.5" style={{ color: colorFor(m.author || '') }}>
            {m.author}
          </div>
        )}

        {media && media.missing && (
          <div className="flex items-center gap-2 text-xs text-wa-muted dark:text-wa-mutedDark italic mb-1">
            <AlertCircle size={14} /> Missing attachment: {media.filename}
          </div>
        )}

        {media && !media.missing && media.kind === 'image' && (
          <img
            src={media.url}
            alt=""
            loading="lazy"
            onClick={() => onOpenImage?.(media.url, m._id)}
            className="rounded mb-1 max-h-[320px] cursor-pointer object-cover"
          />
        )}

        {media && !media.missing && media.kind === 'video' && (
          <video src={media.url} controls preload="metadata" className="rounded mb-1 max-h-[320px]" />
        )}

        {media && !media.missing && media.kind === 'audio' && (
          <div className="mb-1">
            <AudioPlayer src={media.url} mime={media.mime} outgoing={outgoing} />
          </div>
        )}

        {media && !media.missing && media.kind === 'file' && (
          <a href={media.url} download={media.filename} className="flex items-center gap-2 px-2 py-1.5 rounded bg-black/5 dark:bg-white/10 mb-1 text-sm">
            <FileText size={16} /> {media.filename}
          </a>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 text-sm leading-snug">{renderText()}</div>
          <div className="text-[10px] text-wa-muted dark:text-wa-mutedDark whitespace-nowrap pl-2 pb-0.5">{time}</div>
        </div>
      </div>
    </div>
  )
}
