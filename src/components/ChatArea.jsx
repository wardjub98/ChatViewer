import React, { useEffect, useImperativeHandle, useMemo, useRef, forwardRef, useState } from 'react'
import { VariableSizeList as List } from 'react-window'
import MessageBubble from './MessageBubble.jsx'

function sameDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dateLabel(d) {
  const today = new Date()
  const y = new Date(); y.setDate(today.getDate() - 1)
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, y)) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Flatten messages into a row list, inserting day-separator rows.
function buildRows(messages, primaryAuthor) {
  const rows = []
  let lastDate = null
  let lastAuthor = null
  for (const m of messages) {
    const d = m.date ? new Date(m.date) : null
    if (d && !sameDay(d, lastDate)) {
      rows.push({ kind: 'date', id: `d-${d.toDateString()}`, label: dateLabel(d) })
      lastDate = d
      lastAuthor = null
    }
    if (m.author === 'System' || !m.author) {
      rows.push({ kind: 'system', id: `s-${m._id}`, message: m })
      lastAuthor = null
      continue
    }
    const outgoing = primaryAuthor && m.author === primaryAuthor
    const showAuthor = m.author !== lastAuthor
    rows.push({ kind: 'msg', id: `m-${m._id}`, message: m, outgoing, showAuthor, messageId: m._id })
    lastAuthor = m.author
  }
  return rows
}

// Rough height estimator for virtualization.
function estimateHeight(row) {
  if (row.kind === 'date') return 40
  if (row.kind === 'system') return 36
  const m = row.message
  let h = 32 // padding + time
  if (row.showAuthor) h += 16
  if (m._media && !m._media.missing) {
    if (m._media.kind === 'image' || m._media.kind === 'video') h += 220
    else if (m._media.kind === 'audio') h += 60
    else h += 40
  }
  const text = (m.message || '').replace(/<attached:[^>]+>/gi, '').trim()
  if (text) {
    const lines = Math.ceil(text.length / 50) + (text.match(/\n/g)?.length || 0)
    h += Math.max(1, lines) * 18
  }
  return h + 8
}

const ChatArea = forwardRef(function ChatArea(
  { messages, primaryAuthor, query, onOpenImage },
  ref
) {
  const rows = useMemo(() => buildRows(messages, primaryAuthor), [messages, primaryAuthor])

  // Filtered view (search). When searching we don't virtualize differently — we just dim non-matches by filtering rows.
  const filteredRows = useMemo(() => {
    if (!query) return rows
    const q = query.toLowerCase()
    const out = []
    let lastDateRow = null
    for (const r of rows) {
      if (r.kind === 'date') { lastDateRow = r; continue }
      if (r.kind === 'msg' && (r.message.message || '').toLowerCase().includes(q)) {
        if (lastDateRow) { out.push(lastDateRow); lastDateRow = null }
        out.push(r)
      }
    }
    return out
  }, [rows, query])

  const listRef = useRef(null)
  const sizeMap = useRef(new Map())
  const containerRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Reset cached sizes when row list changes shape.
  useEffect(() => {
    sizeMap.current.clear()
    listRef.current?.resetAfterIndex(0)
  }, [filteredRows])

  const getSize = (i) => sizeMap.current.get(i) ?? estimateHeight(filteredRows[i])
  const setMeasured = (i, h) => {
    const prev = sizeMap.current.get(i)
    if (prev !== h) {
      sizeMap.current.set(i, h)
      listRef.current?.resetAfterIndex(i)
    }
  }

  useImperativeHandle(ref, () => ({
    scrollToMessage(messageId) {
      const idx = filteredRows.findIndex(r => r.kind === 'msg' && r.messageId === messageId)
      if (idx >= 0) listRef.current?.scrollToItem(idx, 'center')
    },
    scrollToTop() {
      listRef.current?.scrollToItem(0, 'start')
    },
    scrollToDate(date) {
      const target = new Date(date)
      // Find first message on or after the target date.
      let idx = -1
      for (let i = 0; i < filteredRows.length; i++) {
        const r = filteredRows[i]
        if (r.kind !== 'msg') continue
        const md = r.message.date ? new Date(r.message.date) : null
        if (md && md >= target) { idx = i; break }
      }
      if (idx >= 0) listRef.current?.scrollToItem(idx, 'start')
    },
  }), [filteredRows])

  const Row = ({ index, style }) => {
    const r = filteredRows[index]
    const rowRef = useRef(null)
    useEffect(() => {
      if (rowRef.current) {
        const h = rowRef.current.getBoundingClientRect().height
        if (h > 0) setMeasured(index, h)
      }
    })

    return (
      <div style={style}>
        <div ref={rowRef} className="py-0.5">
          {r.kind === 'date' && (
            <div className="flex justify-center my-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-white/80 dark:bg-wa-panelDark/80 text-wa-muted dark:text-wa-mutedDark shadow-sm">
                {r.label}
              </span>
            </div>
          )}
          {r.kind === 'system' && (
            <div className="flex justify-center">
              <span className="text-xs px-2.5 py-1 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200">
                {r.message.message}
              </span>
            </div>
          )}
          {r.kind === 'msg' && (
            <MessageBubble
              message={r.message}
              outgoing={r.outgoing}
              showAuthor={r.showAuthor}
              onOpenImage={onOpenImage}
              query={query}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 wa-wallpaper relative">
      {size.h > 0 && (
        <List
          ref={listRef}
          height={size.h}
          width={size.w}
          itemCount={filteredRows.length}
          itemSize={getSize}
          estimatedItemSize={80}
          overscanCount={6}
        >
          {Row}
        </List>
      )}
      {filteredRows.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-wa-muted dark:text-wa-mutedDark text-sm">
          No messages match “{query}”.
        </div>
      )}
    </div>
  )
})

export default ChatArea
