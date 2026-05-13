import {
  buildShareTextParts,
  decodePayload,
  type SharePayload,
} from '../../src/share/payload'

// Cloudflare Pages binds the static assets behind env.ASSETS. We fetch the
// SPA's index.html, then rewrite <head> on the fly so X / Slack / Discord
// crawlers see OG meta tags pointing at /og?d=<same payload>.
interface Env {
  ASSETS: { fetch: (req: Request | URL | string) => Promise<Response> }
}

const SITE_NAME = 'UI Design Quiz'

const buildOgMeta = (
  origin: string,
  d: string,
  payload: SharePayload,
): { title: string; description: string; image: string; url: string } => {
  const parts = buildShareTextParts(payload)
  const title = `${parts.eyebrow}  ${parts.scoreLine}  ${parts.timeLine}`
  const description =
    payload.m === 'e'
      ? 'エンドレスでたくさん挑戦しました。あなたも挑戦してみてください。'
      : 'UIパーツの名前を暗記カード形式で覚えるクイズ。あなたも挑戦してみてください。'
  return {
    title,
    description,
    image: `${origin}/og?d=${encodeURIComponent(d)}`,
    url: `${origin}/r?d=${encodeURIComponent(d)}`,
  }
}

const escapeAttr = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  )

class MetaInjector {
  constructor(private meta: ReturnType<typeof buildOgMeta>) {}
  element(el: Element) {
    const m = this.meta
    const tags = [
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">`,
      `<meta property="og:title" content="${escapeAttr(m.title)}">`,
      `<meta property="og:description" content="${escapeAttr(m.description)}">`,
      `<meta property="og:url" content="${escapeAttr(m.url)}">`,
      `<meta property="og:image" content="${escapeAttr(m.image)}">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escapeAttr(m.title)}">`,
      `<meta name="twitter:description" content="${escapeAttr(m.description)}">`,
      `<meta name="twitter:image" content="${escapeAttr(m.image)}">`,
    ].join('\n    ')
    el.append(`\n    ${tags}\n  `, { html: true })
  }
}

class TitleRewriter {
  constructor(private title: string) {}
  element(el: Element) {
    el.setInnerContent(this.title)
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const d = url.searchParams.get('d')
  const payload = d ? decodePayload(d) : null

  // Always serve the SPA's index.html; only the head differs.
  const assetUrl = new URL('/index.html', url.origin)
  const upstream = await env.ASSETS.fetch(assetUrl)

  if (!payload || !d) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    })
  }

  const meta = buildOgMeta(url.origin, d, payload)
  const rewriter = new HTMLRewriter()
    .on('head', new MetaInjector(meta))
    .on('title', new TitleRewriter(`${meta.title} – ${SITE_NAME}`))

  const response = rewriter.transform(upstream)
  // The HTML itself need not be heavily cached; the OGP image is the
  // expensive piece and is cached separately.
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
  return new Response(response.body, { status: response.status, headers })
}
