import React, { useMemo, useRef, useState } from 'react'
import Sidebar from './Sidebar.jsx'
import ChatHeader from './ChatHeader.jsx'
import ChatArea from './ChatArea.jsx'
import MediaSidebar from './MediaSidebar.jsx'
import Lightbox from './Lightbox.jsx'

export default function ChatLayout({ data, dark, onToggleDark, onReset, onBackToStats }) {
  const [primaryAuthor, setPrimaryAuthor] = useState(data.participants[0] || null)
  const [query, setQuery] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const chatRef = useRef(null)

  const images = useMemo(() => {
    const out = []
    for (const m of data.messages) {
      if (m._media && !m._media.missing && m._media.kind === 'image') {
        out.push({ url: m._media.url, messageId: m._id })
      }
    }
    return out
  }, [data.messages])

  const [lightbox, setLightbox] = useState(null) // {index}

  const openImageByUrl = (url, messageId) => {
    const idx = images.findIndex(i => i.url === url)
    setLightbox({ index: idx >= 0 ? idx : 0 })
  }

  const jumpTo = (id) => chatRef.current?.scrollToMessage(id)

  return (
    <div className="h-screen flex bg-wa-panel dark:bg-wa-bgDark text-wa-text dark:text-wa-textDark">
      <Sidebar
        data={data}
        primaryAuthor={primaryAuthor}
        onSelectAuthor={setPrimaryAuthor}
        dark={dark}
        onToggleDark={onToggleDark}
        onBackToStats={onBackToStats}
        onReset={onReset}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          data={data}
          query={query}
          setQuery={setQuery}
          onGoToStart={() => chatRef.current?.scrollToTop()}
          onJumpToDate={(d) => chatRef.current?.scrollToDate(d)}
          onToggleInfo={() => setShowInfo(s => !s)}
        />
        <ChatArea
          ref={chatRef}
          messages={data.messages}
          primaryAuthor={primaryAuthor}
          query={query}
          onOpenImage={openImageByUrl}
        />
      </main>
      <MediaSidebar
        open={showInfo}
        onClose={() => setShowInfo(false)}
        messages={data.messages}
        onJumpTo={jumpTo}
      />
      {lightbox && (
        <Lightbox
          images={images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(l => ({ index: (l.index - 1 + images.length) % images.length }))}
          onNext={() => setLightbox(l => ({ index: (l.index + 1) % images.length }))}
          onJump={jumpTo}
        />
      )}
    </div>
  )
}
