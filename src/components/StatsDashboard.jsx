import React from 'react'
import {
  Sun, Moon, ArrowRight, RotateCcw, MessageSquare, Image as ImageIcon,
  Film, Mic, FileText, Type, Flame, CalendarDays, Clock, Zap, Smile,
  HelpCircle, Link as LinkIcon, Megaphone, Timer, Quote, Hourglass,
} from 'lucide-react'

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-wa-green/10 text-wa-green shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-wa-muted dark:text-wa-mutedDark uppercase tracking-wide">{label}</div>
        <div className="text-xl font-semibold truncate">{value}</div>
        {sub && <div className="text-[11px] text-wa-muted dark:text-wa-mutedDark truncate">{sub}</div>}
      </div>
    </div>
  )
}

function Bar({ value, max, color = 'bg-wa-green' }) {
  const w = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  )
}

function formatDuration(min) {
  if (min == null) return '—'
  if (min < 1) return `${Math.round(min * 60)}s`
  if (min < 60) return `${min.toFixed(1)}m`
  const h = min / 60
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString() : '—'
}

function hourLabel(h) {
  const ampm = h < 12 ? 'am' : 'pm'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}${ampm}`
}

export default function StatsDashboard({ stats, dark, onToggleDark, onContinue, onReset }) {
  if (!stats) return null
  const maxMsg = Math.max(...stats.perPerson.map(p => p.count), 1)
  const maxWords = Math.max(...stats.perPerson.map(p => p.wordCount), 1)
  const maxHour = Math.max(...stats.hourHistogram, 1)

  return (
    <div className="min-h-screen bg-wa-panel dark:bg-wa-bgDark text-wa-text dark:text-wa-textDark">
      <header className="flex items-center justify-between px-6 py-4 border-b border-wa-border dark:border-wa-borderDark bg-white dark:bg-wa-panelDark sticky top-0 z-10">
        <div className="font-semibold">Our Stats</div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-wa-border dark:border-wa-borderDark hover:bg-black/5 dark:hover:bg-white/10">
            <RotateCcw size={14} /> New chat
          </button>
          <button onClick={onToggleDark} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={onContinue} className="inline-flex items-center gap-1 text-sm px-4 py-1.5 rounded-full bg-wa-green text-white hover:bg-wa-greenDark">
            Open chat <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Top-line cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<MessageSquare size={20} />} label="Total messages" value={stats.totalMessages.toLocaleString()} />
          <StatCard icon={<Type size={20} />} label="Total words" value={stats.totalWords.toLocaleString()} />
          <StatCard icon={<ImageIcon size={20} />} label="Total media" value={stats.totalMedia.toLocaleString()} />
          <StatCard
            icon={<CalendarDays size={20} />}
            label="Date range"
            value={`${stats.spanDays.toLocaleString()} days`}
            sub={`${fmtDate(stats.firstDate)} → ${fmtDate(stats.lastDate)}`}
          />
          <StatCard
            icon={<Flame size={20} />}
            label="Longest streak"
            value={`${stats.longestStreak} days`}
            sub="consecutive chatting"
          />
          <StatCard
            icon={<Zap size={20} />}
            label="Busiest day"
            value={stats.busiestDayCount.toLocaleString() + ' msgs'}
            sub={stats.busiestDay ? new Date(stats.busiestDay).toLocaleDateString() : '—'}
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Peak hour"
            value={hourLabel(stats.peakHour)}
            sub={`${stats.hourHistogram[stats.peakHour].toLocaleString()} msgs at that hour`}
          />
          <StatCard
            icon={<Hourglass size={20} />}
            label="Longest silence"
            value={stats.longestSilence ? `${stats.longestSilence.days} days` : '—'}
            sub={stats.longestSilence ? `${fmtDate(stats.longestSilence.from)} → ${fmtDate(stats.longestSilence.to)}` : ''}
          />
        </div>

        {/* Messages per person */}
        <section className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-5">
          <h3 className="font-semibold mb-4">Messages per person</h3>
          <div className="space-y-3">
            {stats.perPerson.map((p) => (
              <div key={p.author}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{p.author}</span>
                  <span className="text-wa-muted dark:text-wa-mutedDark">
                    {p.count.toLocaleString()} ({stats.totalMessages ? Math.round(p.count / stats.totalMessages * 100) : 0}%)
                  </span>
                </div>
                <Bar value={p.count} max={maxMsg} />
              </div>
            ))}
          </div>
        </section>

        {/* Words per person */}
        <section className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-5">
          <h3 className="font-semibold mb-4">Words per person</h3>
          <div className="space-y-4">
            {stats.perPerson.map((p) => (
              <div key={p.author}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{p.author}</span>
                  <span className="text-wa-muted dark:text-wa-mutedDark">{p.wordCount.toLocaleString()} words</span>
                </div>
                <Bar value={p.wordCount} max={maxWords} color="bg-purple-500" />
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-wa-muted dark:text-wa-mutedDark">
                  <span>{p.avgWordsPerMessage.toFixed(1)} words/msg</span>
                  <span>{p.charCount.toLocaleString()} characters</span>
                  <span>{p.uniqueWords.toLocaleString()} unique words</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Fun stats grid */}
        <section className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-5">
          <h3 className="font-semibold mb-4">Fun stats per person</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {stats.perPerson.map(p => (
              <div key={p.author} className="rounded-lg border border-wa-border dark:border-wa-borderDark p-4">
                <div className="font-medium mb-3">{p.author}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <FunRow icon={<Smile size={14} />} label="Laughs (haha/lol/😂)" value={p.laughs.toLocaleString()} />
                  <FunRow icon={<HelpCircle size={14} />} label="Questions asked" value={p.questions.toLocaleString()} />
                  <FunRow icon={<Megaphone size={14} />} label="SHOUTING words" value={p.shouts.toLocaleString()} />
                  <FunRow icon={<LinkIcon size={14} />} label="Links shared" value={p.links.toLocaleString()} />
                  <FunRow icon={<Zap size={14} />} label="Convos started" value={p.starters.toLocaleString()} />
                  <FunRow icon={<Timer size={14} />} label="Avg reply time" value={formatDuration(p.avgReplyMin)} />
                </div>
                {p.longest.len > 0 && (
                  <div className="mt-3 pt-3 border-t border-wa-border dark:border-wa-borderDark">
                    <div className="flex items-center gap-1 text-xs text-wa-muted dark:text-wa-mutedDark mb-1">
                      <Quote size={12} /> Longest message — {p.longest.len.toLocaleString()} chars
                      {p.longest.date && <span> · {fmtDate(p.longest.date)}</span>}
                    </div>
                    <div className="text-xs italic line-clamp-3">
                      “{p.longest.text}{p.longest.text.length >= 240 ? '…' : ''}”
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Hour-of-day activity */}
        <section className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-5">
          <h3 className="font-semibold mb-4">When do you chat? (hour of day)</h3>
          <div className="flex items-end gap-1 h-32">
            {stats.hourHistogram.map((n, h) => (
              <div key={h} className="flex-1 flex flex-col items-center justify-end" title={`${hourLabel(h)} — ${n.toLocaleString()} msgs`}>
                <div
                  className="w-full bg-wa-green/80 rounded-t"
                  style={{ height: `${(n / maxHour) * 100}%`, minHeight: n > 0 ? 2 : 0 }}
                />
                {h % 3 === 0 && (
                  <div className="text-[10px] text-wa-muted dark:text-wa-mutedDark mt-1">{hourLabel(h)}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Media breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-5">
            <h3 className="font-semibold mb-4">Media shared</h3>
            <div className="space-y-3">
              {stats.perPerson.map(p => (
                <div key={p.author} className="text-sm">
                  <div className="font-medium mb-1">{p.author}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Pill icon={<ImageIcon size={12} />} value={p.media.image} label="Images" />
                    <Pill icon={<Film size={12} />} value={p.media.video} label="Videos" />
                    <Pill icon={<Mic size={12} />} value={p.media.audio} label="Voice" />
                    <Pill icon={<FileText size={12} />} value={p.media.file} label="Files" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-5">
            <h3 className="font-semibold mb-4">Top emojis</h3>
            <div className="space-y-4">
              {stats.perPerson.map(p => {
                const max = Math.max(...p.topEmojis.map(e => e[1]), 1)
                return (
                  <div key={p.author}>
                    <div className="text-sm font-medium mb-2">{p.author}</div>
                    {p.topEmojis.length === 0 && <div className="text-xs text-wa-muted dark:text-wa-mutedDark">No emojis used.</div>}
                    <div className="space-y-1">
                      {p.topEmojis.map(([emoji, n]) => (
                        <div key={emoji} className="flex items-center gap-3">
                          <span className="text-xl w-7 text-center">{emoji}</span>
                          <div className="flex-1"><Bar value={n} max={max} /></div>
                          <span className="text-xs tabular-nums w-10 text-right text-wa-muted dark:text-wa-mutedDark">{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Top words */}
        <section className="rounded-xl bg-white dark:bg-wa-panelDark border border-wa-border dark:border-wa-borderDark p-5">
          <h3 className="font-semibold mb-4">Top 5 words per person</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {stats.perPerson.map(p => {
              const max = Math.max(...p.topWords.map(w => w[1]), 1)
              return (
                <div key={p.author}>
                  <div className="text-sm font-medium mb-2">{p.author}</div>
                  {p.topWords.length === 0 && <div className="text-xs text-wa-muted dark:text-wa-mutedDark">No meaningful words found.</div>}
                  <div className="space-y-1.5">
                    {p.topWords.map(([w, n]) => (
                      <div key={w} className="flex items-center gap-3">
                        <span className="w-28 truncate text-sm">{w}</span>
                        <div className="flex-1"><Bar value={n} max={max} /></div>
                        <span className="text-xs tabular-nums w-10 text-right text-wa-muted dark:text-wa-mutedDark">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

function Pill({ icon, value, label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">
      {icon}<strong className="tabular-nums">{value}</strong>
      <span className="text-wa-muted dark:text-wa-mutedDark">{label}</span>
    </span>
  )
}

function FunRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-wa-green shrink-0">{icon}</span>
      <span className="text-wa-muted dark:text-wa-mutedDark truncate">{label}</span>
      <span className="ml-auto font-semibold tabular-nums">{value}</span>
    </div>
  )
}
