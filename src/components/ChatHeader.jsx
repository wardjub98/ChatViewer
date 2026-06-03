import React, { useRef, useState } from 'react'
import { Search, X, Calendar, ChevronsUp, Info, Users, Menu } from 'lucide-react'

export default function ChatHeader({
  data, query, setQuery,
  onGoToStart, onJumpToDate,
  onToggleInfo, onToggleSidebar,
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const dateRef = useRef(null)

  const minDate = data.messages.find(m => m.date)?.date
  const maxDate = [...data.messages].reverse().find(m => m.date)?.date

  return (
    <header className="h-14 px-4 flex items-center justify-between bg-wa-panel dark:bg-wa-panelDark border-b border-wa-border dark:border-wa-borderDark gap-2">
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
          title="Toggle chats menu"
          aria-label="Toggle chats menu"
        >
          <Menu size={20} />
        </button>
      )}
      <button onClick={onToggleInfo} className="flex items-center gap-3 min-w-0 flex-1 hover:bg-black/5 dark:hover:bg-white/10 px-2 py-1 rounded">
        <div className="w-9 h-9 rounded-full bg-wa-green/20 text-wa-green flex items-center justify-center">
          <Users size={18} />
        </div>
        <div className="min-w-0 text-left">
          <div className="font-medium truncate">{data.participants.join(', ')}</div>
          <div className="text-xs text-wa-muted dark:text-wa-mutedDark truncate">
            {data.messages.length.toLocaleString()} messages
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1">
        {showSearch ? (
          <div className="flex items-center bg-white dark:bg-wa-bgDark rounded-full border border-wa-border dark:border-wa-borderDark px-2">
            <Search size={14} className="text-wa-muted dark:text-wa-mutedDark" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages…"
              className="bg-transparent px-2 py-1.5 text-sm outline-none w-56"
            />
            <button
              onClick={() => { setQuery(''); setShowSearch(false) }}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowSearch(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10" title="Search">
            <Search size={18} />
          </button>
        )}

        <button onClick={onGoToStart} title="Back to the beginning" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ChevronsUp size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => { setShowDate(s => !s); setTimeout(() => dateRef.current?.focus(), 0) }}
            title="Travel in time"
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Calendar size={18} />
          </button>
          {showDate && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark rounded-lg shadow-lg p-3 z-30 w-64">
              <div className="text-xs text-wa-muted dark:text-wa-mutedDark mb-2">Jump to a date</div>
              <input
                ref={dateRef}
                type="date"
                min={minDate ? new Date(minDate).toISOString().slice(0, 10) : undefined}
                max={maxDate ? new Date(maxDate).toISOString().slice(0, 10) : undefined}
                onChange={(e) => {
                  if (e.target.value) {
                    onJumpToDate(new Date(e.target.value))
                    setShowDate(false)
                  }
                }}
                className="w-full px-2 py-1.5 rounded border border-wa-border dark:border-wa-borderDark bg-transparent text-sm"
              />
              <p className="text-[11px] text-wa-muted dark:text-wa-mutedDark mt-2">
                Range: {minDate ? new Date(minDate).toLocaleDateString() : '—'} → {maxDate ? new Date(maxDate).toLocaleDateString() : '—'}
              </p>
            </div>
          )}
        </div>

        <button onClick={onToggleInfo} title="Media & info" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <Info size={18} />
        </button>
      </div>
    </header>
  )
}
