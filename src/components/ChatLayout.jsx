import React, { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './Sidebar.jsx'
import ChatHeader from './ChatHeader.jsx'
import ChatArea from './ChatArea.jsx'
import MediaSidebar from './MediaSidebar.jsx'
import Lightbox from './Lightbox.jsx'

const MOBILE_BP = 768 // px — Tailwind's md breakpoint

export default function ChatLayout({ data, dark, onToggleDark, onReset, onBackToStats }) {
  const [primaryAuthor, setPrimaryAuthor] = useState(data.participants[0] || null)
  const [query, setQuery] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const chatRef = useRef(null)

  // Sidebar collapsed state — auto-collapse on mobile widths.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= MOBILE_BP
  })

  // Track viewport so we can render the sidebar as an overlay on mobile.
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BP)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const images = useMemo(() => {
    const out = []
    for (const m of data.messages) {
      if (m._media && !m._media.missing && m._media.kind === 'image') {
        out.push({ url: m._media.url, messageId: m._id })
      }
    }
    return out
  }, [data.messages])

  const [lightbox, setLightbox] = useState(null)

  const openImageByUrl = (url) => {
    const idx = images.findIndex(i => i.url === url)
    setLightbox({ index: idx >= 0 ? idx : 0 })
  }

  const jumpTo = (id) => {
    chatRef.current?.scrollToMessage(id)
    if (isMobile) setShowInfo(false)
  }

  // On mobile, picking a person in the sidebar should auto-close it.
  const handleSelectAuthor = (a) => {
    setPrimaryAuthor(a)
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div className="h-screen flex bg-wa-panel dark:bg-wa-bgDark text-wa-text dark:text-wa-textDark overflow-hidden">
      {/* Sidebar — overlay on mobile, inline on desktop */}
      {sidebarOpen && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 z-30 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div className={isMobile ? 'fixed inset-y-0 left-0 z-40 max-w-[85vw]' : 'relative'}>
            <Sidebar
              data={data}
              primaryAuthor={primaryAuthor}
              onSelectAuthor={handleSelectAuthor}
              dark={dark}
              onToggleDark={onToggleDark}
              onBackToStats={onBackToStats}
              onReset={onReset}
              onClose={isMobile ? () => setSidebarOpen(false) : null}
            />
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          data={data}
          query={query}
          setQuery={setQuery}
          onGoToStart={() => chatRef.current?.scrollToTop()}
          onJumpToDate={(d) => chatRef.current?.scrollToDate(d)}
          onToggleInfo={() => setShowInfo(s => !s)}
          onToggleSidebar={() => setSidebarOpen(s => !s)}
        />
        <ChatArea
          ref={chatRef}
          messages={data.messages}
          primaryAuthor={primaryAuthor}
          query={query}
          onOpenImage={openImageByUrl}
        />
      </main>

      {/* Media sidebar — also overlay on mobile */}
      {showInfo && isMobile && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setShowInfo(false)} />
      )}
      <div className={showInfo && isMobile ? 'fixed inset-y-0 right-0 z-40 max-w-[85vw]' : ''}>
        <MediaSidebar
          open={showInfo}
          onClose={() => setShowInfo(false)}
          messages={data.messages}
          onJumpTo={jumpTo}
        />
      </div>

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
