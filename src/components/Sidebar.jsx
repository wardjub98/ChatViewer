import React from 'react'
import { MessageCircle, BarChart3, RotateCcw, Sun, Moon } from 'lucide-react'

export default function Sidebar({ data, primaryAuthor, onSelectAuthor, dark, onToggleDark, onBackToStats, onReset }) {
  const lastMessage = data.messages[data.messages.length - 1]
  return (
    <aside className="w-[320px] shrink-0 border-r border-wa-border dark:border-wa-borderDark bg-white dark:bg-wa-panelDark flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-wa-border dark:border-wa-borderDark">
        <div className="flex items-center gap-2 font-semibold">
          <MessageCircle className="text-wa-green" size={18} /> Chats
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onBackToStats} title="Stats" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <BarChart3 size={16} />
          </button>
          <button onClick={onToggleDark} title="Theme" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onReset} title="Load new chat" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      <div className="px-3 py-2 text-xs uppercase tracking-wide text-wa-muted dark:text-wa-mutedDark">
        Conversation
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-l-4 border-wa-green bg-wa-green/5">
          <div className="font-semibold truncate">{data.participants.join(', ')}</div>
          <div className="text-xs text-wa-muted dark:text-wa-mutedDark truncate">
            {lastMessage?.message?.slice(0, 64) || '…'}
          </div>
        </div>

        <div className="px-4 py-3 mt-3">
          <div className="text-xs uppercase tracking-wide text-wa-muted dark:text-wa-mutedDark mb-2">
            View as
          </div>
          <div className="space-y-1">
            {data.participants.map(p => (
              <button
                key={p}
                onClick={() => onSelectAuthor(p)}
                className={[
                  'w-full text-left px-3 py-2 rounded-lg text-sm',
                  primaryAuthor === p
                    ? 'bg-wa-green text-white'
                    : 'hover:bg-black/5 dark:hover:bg-white/10',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-wa-muted dark:text-wa-mutedDark mt-2">
            Messages from this person appear as outgoing (green) bubbles.
          </p>
        </div>
      </div>

      <footer className="px-4 py-3 text-[11px] text-wa-muted dark:text-wa-mutedDark border-t border-wa-border dark:border-wa-borderDark">
        {data.messages.length.toLocaleString()} messages loaded
      </footer>
    </aside>
  )
}
