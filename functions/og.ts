import { ImageResponse, loadGoogleFont } from 'workers-og'
import { decodePayload } from '../src/share/payload'
import { FONT_TEXT, renderOgHtml } from './_lib/render'

const WIDTH = 1200
const HEIGHT = 630

// Cache the rendered PNG aggressively at the edge. The d= parameter fully
// determines the image, so a long immutable TTL is safe.
const CACHE_HEADER = 'public, max-age=31536000, immutable, s-maxage=31536000'

const escapeXml = (s: string): string =>
  s.replace(/[&<>]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;',
  )

const fallback = (err?: unknown): Response => {
  // Minimal SVG fallback. When the dynamic PNG path throws we surface the
  // error message inline so the failure is visible without scraping
  // Cloudflare's real-time logs.
  const message =
    err === undefined
      ? ''
      : err instanceof Error
        ? `${err.name}: ${err.message}`
        : String(err)
  const errLine = message
    ? `\n  <text x="50%" y="86%" font-family="monospace" font-size="22" fill="#fca5a5" text-anchor="middle">${escapeXml(message).slice(0, 240)}</text>`
    : ''
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="100%" height="100%" fill="#0b1020"/>
  <text x="50%" y="48%" font-family="sans-serif" font-size="64" fill="#e2e8f0" text-anchor="middle">UI Design Quiz</text>
  <text x="50%" y="58%" font-family="sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle">UIパーツの名前を覚えるクイズ</text>${errLine}
</svg>`
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  })
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url)
  const d = url.searchParams.get('d')
  const payload = d ? decodePayload(d) : null
  if (!payload) return fallback()

  try {
    const fontData = await loadGoogleFont({
      family: 'Noto Sans JP',
      weight: 700,
      text: FONT_TEXT,
    })

    // NOTE: workers-og's ImageResponse returns the Response synchronously and
    // does the actual Satori→resvg render inside a ReadableStream.start()
    // callback. If the render throws, the response body errors mid-flight but
    // the 200/image/png headers are already on the wire — clients see a
    // broken image. Buffer the body here so render failures land in catch
    // below and we can serve the SVG fallback instead.
    const image = new ImageResponse(renderOgHtml(payload), {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
      emoji: 'twemoji',
    })
    const png = await image.arrayBuffer()
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE_HEADER,
      },
    })
  } catch (e) {
    console.error('OG generation failed', e)
    return fallback(e)
  }
}
