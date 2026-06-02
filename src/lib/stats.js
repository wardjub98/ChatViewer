// Simple emoji regex covering most pictographic emoji (good enough for stats).
const EMOJI_RE = /\p{Extended_Pictographic}/gu

// Common stop words to filter out of top-word counts.
const STOP = new Set((
  'the a an and or but if then else for of in on at to from with by is are was were be been being am ' +
  'i you he she it we they me him her us them my your his its our their this that these those not no ' +
  'do does did doing have has had having will would can could should may might just so as too very ' +
  'about up down out over under than then there here also into only than which what who whom whose ' +
  'yes ok okay yeah yep nope nah lol lmao haha hahaha im ive id ill youre youve youd youll hes shes ' +
  'thats whats hows whens wheres got get going gonna wanna i\'m you\'re it\'s don\'t can\'t won\'t ' +
  'omitted media image video audio sticker document attached'
).split(/\s+/))

const LAUGH_RE = /\b(?:ha(?:ha)+|he(?:he)+|lol+|lmao+|rofl|jaja+|xd+|😂|🤣)\b/giu
const QUESTION_RE = /\?/g
const SHOUT_RE = /\b[A-Z]{4,}\b/g
const URL_RE = /\bhttps?:\/\/\S+/gi
const DAY_MS = 86_400_000

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function computeStats(messages) {
  const perAuthor = new Map()
  const ensure = (a) => {
    if (!perAuthor.has(a)) perAuthor.set(a, {
      author: a, count: 0, wordCount: 0, charCount: 0,
      words: new Map(), emojis: new Map(),
      media: { image: 0, video: 0, audio: 0, file: 0 },
      laughs: 0, questions: 0, shouts: 0, links: 0,
      longest: { len: 0, text: '', date: null },
      hourHistogram: new Array(24).fill(0),
      weekdayHistogram: new Array(7).fill(0),
      starters: 0,        // messages that started a new conversation (>6h gap)
      replyTotal: 0,      // ms summed
      replyCount: 0,      // # replies counted
      replyFastestMin: Infinity,
    })
    return perAuthor.get(a)
  }

  const perDay = new Map()         // dayKey -> count
  const perDayByAuthor = new Map() // dayKey -> Map(author -> count)

  let totalMedia = 0
  let totalWords = 0
  let prev = null // previous non-system message

  for (const m of messages) {
    if (!m.author || m.author === 'System') continue
    const s = ensure(m.author)
    s.count++

    // Media
    if (m._media && !m._media.missing) {
      const k = m._media.kind || 'file'
      s.media[k] = (s.media[k] || 0) + 1
      totalMedia++
    }

    // Date-derived stats
    const d = m.date ? new Date(m.date) : null
    if (d) {
      s.hourHistogram[d.getHours()]++
      s.weekdayHistogram[d.getDay()]++
      const k = dayKey(d)
      perDay.set(k, (perDay.get(k) || 0) + 1)
      if (!perDayByAuthor.has(k)) perDayByAuthor.set(k, new Map())
      const dm = perDayByAuthor.get(k)
      dm.set(m.author, (dm.get(m.author) || 0) + 1)
    }

    // Gap / replies / starters
    if (prev && prev.date && d) {
      const gap = d - new Date(prev.date)
      if (gap > 6 * 60 * 60 * 1000) {
        // Conversation restart
        s.starters++
      } else if (prev.author !== m.author && gap > 0) {
        s.replyTotal += gap
        s.replyCount++
        const min = gap / 60000
        if (min < s.replyFastestMin) s.replyFastestMin = min
      }
    } else if (!prev) {
      s.starters++ // very first message of the chat
    }
    prev = m

    const text = (m.message || '').replace(/<attached:[^>]+>/gi, '').trim()
    if (!text) continue

    s.charCount += text.length

    // emojis
    const ems = text.match(EMOJI_RE)
    if (ems) for (const e of ems) s.emojis.set(e, (s.emojis.get(e) || 0) + 1)

    // words (raw count, before stopword filtering)
    const cleaned = text.toLowerCase().replace(EMOJI_RE, ' ')
    const allWords = cleaned.match(/[\p{Letter}\p{Number}']{2,}/gu) || []
    s.wordCount += allWords.length
    totalWords += allWords.length
    for (const w of allWords) {
      if (STOP.has(w) || /^\d+$/.test(w)) continue
      s.words.set(w, (s.words.get(w) || 0) + 1)
    }

    // Fun counters
    s.laughs += (text.match(LAUGH_RE) || []).length
    s.questions += (text.match(QUESTION_RE) || []).length
    s.shouts += (text.match(SHOUT_RE) || []).length
    s.links += (text.match(URL_RE) || []).length

    if (text.length > s.longest.len) {
      s.longest = { len: text.length, text: text.slice(0, 240), date: m.date || null }
    }
  }

  const topN = (map, n) => Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, n)

  const perPerson = Array.from(perAuthor.values()).map(s => ({
    author: s.author,
    count: s.count,
    wordCount: s.wordCount,
    charCount: s.charCount,
    avgWordsPerMessage: s.count ? s.wordCount / s.count : 0,
    media: s.media,
    topWords: topN(s.words, 5),
    uniqueWords: s.words.size,
    topEmojis: topN(s.emojis, 8),
    laughs: s.laughs,
    questions: s.questions,
    shouts: s.shouts,
    links: s.links,
    longest: s.longest,
    hourHistogram: s.hourHistogram,
    weekdayHistogram: s.weekdayHistogram,
    starters: s.starters,
    avgReplyMin: s.replyCount ? (s.replyTotal / s.replyCount) / 60000 : null,
    fastestReplyMin: s.replyFastestMin === Infinity ? null : s.replyFastestMin,
  }))

  // Busiest day overall
  let busiestDay = null, busiestDayCount = 0
  for (const [k, c] of perDay) {
    if (c > busiestDayCount) { busiestDayCount = c; busiestDay = k }
  }

  // Longest streak of consecutive chatting days
  const sortedDays = Array.from(perDay.keys()).sort()
  let longestStreak = 0, currentStreak = 0, prevTs = null
  for (const k of sortedDays) {
    const ts = new Date(k).getTime()
    if (prevTs != null && ts - prevTs === DAY_MS) currentStreak++
    else currentStreak = 1
    if (currentStreak > longestStreak) longestStreak = currentStreak
    prevTs = ts
  }

  // Longest silence between any two messages with dates
  let longestSilenceDays = 0, silenceStart = null, silenceEnd = null
  let prevDated = null
  for (const m of messages) {
    if (!m.date || !m.author || m.author === 'System') continue
    if (prevDated) {
      const gapDays = (new Date(m.date) - new Date(prevDated.date)) / DAY_MS
      if (gapDays > longestSilenceDays) {
        longestSilenceDays = gapDays
        silenceStart = prevDated.date
        silenceEnd = m.date
      }
    }
    prevDated = m
  }

  // Aggregate hour-of-day across everyone
  const hourHistogram = new Array(24).fill(0)
  for (const p of perPerson) for (let i = 0; i < 24; i++) hourHistogram[i] += p.hourHistogram[i]
  const peakHour = hourHistogram.indexOf(Math.max(...hourHistogram))

  const firstDated = messages.find(m => m.date)?.date || null
  const lastDated = [...messages].reverse().find(m => m.date)?.date || null
  const spanDays = (firstDated && lastDated)
    ? Math.max(1, Math.round((new Date(lastDated) - new Date(firstDated)) / DAY_MS))
    : 0

  return {
    totalMessages: messages.filter(m => m.author && m.author !== 'System').length,
    totalMedia,
    totalWords,
    activeDays: perDay.size,
    spanDays,
    longestStreak,
    busiestDay,
    busiestDayCount,
    longestSilence: silenceStart ? { days: Math.floor(longestSilenceDays), from: silenceStart, to: silenceEnd } : null,
    peakHour,
    hourHistogram,
    perPerson,
    firstDate: firstDated,
    lastDate: lastDated,
  }
}
