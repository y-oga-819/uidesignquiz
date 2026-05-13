import { ImageResponse, loadGoogleFont } from 'workers-og'
import { decodePayload } from '../src/share/payload'
import { FONT_TEXT, renderOgHtml } from './_lib/render'

const WIDTH = 1200
const HEIGHT = 630

// Cache the rendered PNG aggressively at the edge. The d= parameter fully
// determines the image, so a long immutable TTL is safe.
const CACHE_HEADER = 'public, max-age=31536000, immutable, s-maxage=31536000'

const fallback = (): Response => {
  // Minimal SVG fallback for malformed payloads. Sent as PNG-equivalent
  // image/svg+xml — most crawlers accept SVG OG images, and the SVG path
  // never invokes the heavy WASM pipeline.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="100%" height="100%" fill="#0b1020"/>
  <text x="50%" y="48%" font-family="sans-serif" font-size="64" fill="#e2e8f0" text-anchor="middle">UI Design Quiz</text>
  <text x="50%" y="58%" font-family="sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle">UIパーツの名前を覚えるクイズ</text>
</svg>`
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
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

    return new ImageResponse(renderOgHtml(payload), {
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
      headers: {
        'Cache-Control': CACHE_HEADER,
      },
    })
  } catch (e) {
    console.error('OG generation failed', e)
    return fallback()
  }
}
