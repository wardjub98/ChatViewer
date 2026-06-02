import React, { useCallback, useRef, useState } from 'react'
import { Upload, MessageCircle, Sun, Moon, Loader2, FolderOpen, FileArchive } from 'lucide-react'

export default function WelcomeScreen({ dark, onToggleDark, onUpload, loading, error }) {
  const folderRef = useRef(null)
  const zipRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback(async (e) => {
    e.preventDefault(); setDragOver(false)
    const items = e.dataTransfer.items
    const collected = []

    // Try to traverse a directory drop (WebKit-style entry API).
    const traverse = (entry) => new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(f => { collected.push(f); resolve() })
      } else if (entry.isDirectory) {
        const reader = entry.createReader()
        const readAll = () => reader.readEntries(async (entries) => {
          if (!entries.length) return resolve()
          await Promise.all(entries.map(traverse))
          readAll()
        })
        readAll()
      } else resolve()
    })

    if (items && items.length && items[0].webkitGetAsEntry) {
      const entries = []
      for (const it of items) {
        const ent = it.webkitGetAsEntry?.()
        if (ent) entries.push(ent)
      }
      await Promise.all(entries.map(traverse))
      if (collected.length) return onUpload(collected)
    }
    // Fallback: plain files (e.g. a single .zip)
    onUpload(Array.from(e.dataTransfer.files))
  }, [onUpload])

  return (
    <div className="min-h-screen bg-gradient-to-br from-wa-panel to-white dark:from-wa-bgDark dark:to-[#111b21] text-wa-text dark:text-wa-textDark flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <MessageCircle className="text-wa-green" /> WhatsApp Chat Viewer
        </div>
        <button onClick={onToggleDark} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10" title="Toggle theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-center">Your chats, beautifully revived.</h1>
        <p className="text-wa-muted dark:text-wa-mutedDark mb-8 text-center max-w-xl">
          Drop the WhatsApp export folder (or its .zip) below. Everything is parsed locally in your browser —
          no uploads, no servers, no tracking.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={[
            'w-full max-w-2xl rounded-2xl border-2 border-dashed p-10 transition-all',
            dragOver
              ? 'border-wa-green bg-wa-green/10 scale-[1.01]'
              : 'border-wa-border dark:border-wa-borderDark bg-white/60 dark:bg-wa-panelDark/60',
          ].join(' ')}
        >
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-wa-green/10 text-wa-green mb-4">
              <Upload size={36} />
            </div>
            <p className="font-semibold text-lg mb-1">Drag & drop your chat folder or .zip here</p>
            <p className="text-sm text-wa-muted dark:text-wa-mutedDark mb-6">
              Must contain <code className="px-1 rounded bg-black/5 dark:bg-white/10">_chat.txt</code> plus any media files.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => folderRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wa-green text-white hover:bg-wa-greenDark transition"
              >
                <FolderOpen size={16} /> Choose folder
              </button>
              <button
                onClick={() => zipRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-wa-border dark:border-wa-borderDark hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <FileArchive size={16} /> Choose .zip
              </button>
            </div>

            <input
              ref={folderRef} type="file" hidden
              webkitdirectory="" directory="" multiple
              onChange={(e) => e.target.files?.length && onUpload(e.target.files)}
            />
            <input
              ref={zipRef} type="file" hidden accept=".zip"
              onChange={(e) => e.target.files?.length && onUpload(e.target.files)}
            />

            {loading && (
              <div className="mt-6 flex items-center gap-2 text-wa-muted dark:text-wa-mutedDark">
                <Loader2 className="animate-spin" size={16} /> Parsing your chat…
              </div>
            )}
            {error && <div className="mt-6 text-red-500 text-sm">{error}</div>}
          </div>
        </div>

        <p className="mt-8 text-xs text-wa-muted dark:text-wa-mutedDark text-center max-w-xl">
          Tip: in WhatsApp, open a chat → ⋮ → More → Export chat → <em>Include media</em>. Then drop the
          unzipped folder (or the .zip itself) here.
        </p>
      </main>

      <footer className="text-center text-xs text-wa-muted dark:text-wa-mutedDark py-4">
        100% client-side · Your data never leaves your device.
      </footer>
    </div>
  )
}
