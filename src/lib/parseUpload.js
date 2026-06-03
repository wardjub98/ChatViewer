import { unzipSync, strFromU8 } from 'fflate'
import * as parser from 'whatsapp-chat-parser'

// Map common media extensions to a safe MIME type.
const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', heic: 'image/heic', bmp: 'image/bmp', svg: 'image/svg+xml',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska',
  '3gp': 'video/3gpp',
  // Voice notes: WhatsApp uses .opus (Ogg container). Chrome plays as audio/ogg.
  opus: 'audio/ogg', ogg: 'audio/ogg', oga: 'audio/ogg',
  aac: 'audio/aac', m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav',
  pdf: 'application/pdf',
  vcf: 'text/vcard', txt: 'text/plain',
}

function extOf(name) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function classifyMime(name) {
  return MIME[extOf(name)] || 'application/octet-stream'
}

function kindOf(mime, name = '') {
  // WhatsApp stickers are always .webp and typically named STK-…. Treat them
  // as a separate kind so the Images gallery stays photo-only.
  if (mime === 'image/webp' || /(^|\/)STK[-_]/i.test(name) || /sticker/i.test(name)) {
    return 'sticker'
  }
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'file'
}

// Files: a FileList or array of File. Each may have webkitRelativePath.
export async function parseZipFolder(files) {
  const list = Array.from(files)
  if (list.length === 0) throw new Error('No files were selected.')

  // Collect every file (flatten zips). Map basename -> {blob, mime}
  const mediaMap = new Map()
  let chatText = null
  let chatName = '_chat.txt'

  const addFile = async (name, dataBytesOrBlob, mime) => {
    const base = name.split('/').pop()
    if (!base) return
    if (/^_chat(\.[a-z]+)?\.txt$/i.test(base) || base.toLowerCase() === 'chat.txt') {
      const text = typeof dataBytesOrBlob === 'string'
        ? dataBytesOrBlob
        : (dataBytesOrBlob instanceof Blob
            ? await dataBytesOrBlob.text()
            : strFromU8(dataBytesOrBlob))
      // Prefer the largest chat file if multiple
      if (!chatText || text.length > chatText.length) {
        chatText = text; chatName = base
      }
      return
    }
    const blob = dataBytesOrBlob instanceof Blob
      ? new Blob([await dataBytesOrBlob.arrayBuffer()], { type: mime })
      : new Blob([dataBytesOrBlob], { type: mime })
    mediaMap.set(base, { blob, url: URL.createObjectURL(blob), mime, kind: kindOf(mime, base) })
  }

  for (const f of list) {
    const name = f.name
    const ext = extOf(name)
    if (ext === 'zip') {
      const buf = new Uint8Array(await f.arrayBuffer())
      const entries = unzipSync(buf)
      for (const [path, bytes] of Object.entries(entries)) {
        if (path.endsWith('/')) continue
        await addFile(path, bytes, classifyMime(path))
      }
    } else {
      await addFile(name, f, classifyMime(name))
    }
  }

  if (!chatText) throw new Error('Could not find a _chat.txt file in the upload.')

  const messages = parser.parseString(chatText, { daysFirst: undefined })

  // Annotate each message with media metadata if attached.
  const ATTACH_RE = /<attached:\s*([^>]+)>|‎?(?:image|video|audio|sticker|document)\s+omitted/i
  const FILE_RE = /([\w\-. ]+\.(?:jpe?g|png|gif|webp|heic|bmp|mp4|mov|webm|mkv|3gp|opus|ogg|aac|m4a|mp3|wav|pdf|vcf))/i

  const participants = new Set()
  for (const m of messages) {
    if (m.author && m.author !== 'System') participants.add(m.author)
    let filename = null
    if (m.attachment && m.attachment.fileName) filename = m.attachment.fileName
    else if (m.message) {
      const a = m.message.match(/<attached:\s*([^>]+)>/i)
      if (a) filename = a[1].trim()
      else {
        const b = m.message.match(FILE_RE)
        if (b) filename = b[1].trim()
      }
    }
    if (filename) {
      const media = mediaMap.get(filename) || mediaMap.get(filename.split('/').pop())
      if (media) {
        m._media = { ...media, filename }
      } else {
        m._media = { filename, missing: true }
      }
    }
  }

  // Assign stable indices for jumping/virtualization keys.
  messages.forEach((m, i) => { m._id = i })

  return {
    messages,
    mediaMap,
    participants: Array.from(participants),
    chatName,
  }
}
