import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

const SUPPORTED_HOSTS: Record<string, string> = {
  'tiktok.com':     'TikTok',
  'vm.tiktok.com':  'TikTok',
  'twitter.com':    'Twitter',
  'x.com':          'Twitter',
  't.co':           'Twitter',
  'instagram.com':  'Instagram',
  'facebook.com':   'Facebook',
  'web.facebook.com': 'Facebook',
  'fb.com':         'Facebook',
  'fb.watch':       'Facebook',
};

const PLATFORM_COLORS: Record<string, number> = {
  TikTok:    0x010101,
  Twitter:   0x1da1f2,
  Instagram: 0xe1306c,
  Facebook:  0x1877f2,
};

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ── Platform-specific fetchers ────────────────────────────────────────────────

interface OGData {
  title?:       string;
  description?: string;
  image?:       string;
  siteName?:    string;
}

// Resolve share/short links to their canonical Facebook URL and
// normalise web.facebook.com → www.facebook.com for oEmbed compatibility
async function resolveFacebookUrl(url: string): Promise<string> {
  try {
    const u = new URL(url);
    u.hostname = 'www.facebook.com';
    const res = await axios.get(u.toString(), {
      timeout: 8_000,
      maxRedirects: 5,
      headers: { 'User-Agent': BROWSER_UA },
      validateStatus: () => true,
    });
    const final: string = (res.request as any)?.res?.responseUrl ?? (res.request as any)?.responseURL ?? u.toString();
    return final;
  } catch {
    return url;
  }
}

// Facebook exposes a public oEmbed endpoint for videos — no token needed
async function fetchFacebookOEmbed(url: string): Promise<OGData | null> {
  const canonical = await resolveFacebookUrl(url);
  const endpoint = `https://www.facebook.com/plugins/video/oembed.json/?url=${encodeURIComponent(canonical)}`;
  const res = await axios.get(endpoint, {
    timeout: 8_000,
    headers: { 'User-Agent': BROWSER_UA },
  });
  const d = res.data;
  if (!d?.title && !d?.thumbnail_url) return null;
  return {
    title:    d.title ?? 'Facebook Video',
    image:    d.thumbnail_url,
    siteName: 'Facebook',
  };
}

// Twitter/X — proxy through fxtwitter JSON API (native OG broken since 2023)
async function fetchTwitter(url: string): Promise<OGData | null> {
  const u = new URL(url);
  u.hostname = 'api.fxtwitter.com';
  const res = await axios.get(u.toString(), { timeout: 8_000 });
  const tweet = res.data?.tweet;
  if (!tweet) return null;
  return {
    title:       tweet.author?.name ? `@${tweet.author.screen_name}` : undefined,
    description: tweet.text,
    image:       tweet.media?.photos?.[0]?.url ?? tweet.media?.videos?.[0]?.thumbnail_url,
    siteName:    'Twitter / X',
  };
}

// Parse OG meta tags from raw HTML — attribute-order independent
function parseOGFromHtml(html: string): OGData {
  const og: OGData = {};
  // Match each <meta ...> tag as a whole, then extract attributes separately
  const tagRe = /<meta\s[^>]+\/?>/gi;
  const propRe = /(?:property|name)\s*=\s*"og:([^"]+)"/i;
  const contentRe = /content\s*=\s*"([^"]*)"/i;

  let tag: RegExpExecArray | null;
  while ((tag = tagRe.exec(html)) !== null) {
    const propM = propRe.exec(tag[0]);
    const contM = contentRe.exec(tag[0]);
    if (!propM || !contM) continue;

    const prop = propM[1];
    const val  = contM[1]
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    if (prop === 'title')       og.title       = val;
    if (prop === 'description') og.description = val;
    if (prop === 'image')       og.image       = val;
    if (prop === 'site_name')   og.siteName    = val;
  }

  if (!og.title) {
    const t = html.match(/<title[^>]*>([^<]{1,256})<\/title>/i);
    if (t) og.title = t[1].trim();
  }

  return og;
}

async function fetchGenericOG(url: string): Promise<OGData | null> {
  const res = await axios.get(url, {
    timeout: 8_000,
    maxContentLength: 600_000,
    validateStatus: (s) => s < 500,
    headers: {
      'User-Agent':      BROWSER_UA,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept':          'text/html,application/xhtml+xml',
    },
  });

  const html: string = typeof res.data === 'string' ? res.data : '';
  const og = parseOGFromHtml(html);
  if (!og.title && !og.image) return null;
  return og;
}

// ── Main fetch dispatcher ─────────────────────────────────────────────────────

async function fetchPreviewData(url: string, platform: string): Promise<OGData | null> {
  switch (platform) {
    case 'Facebook':
      // oEmbed first (works for video URLs), fall back to HTML scrape
      return await fetchFacebookOEmbed(url).catch(() => fetchGenericOG(url).catch(() => null));

    case 'Twitter':
      return await fetchTwitter(url).catch(() => null);

    default:
      return await fetchGenericOG(url).catch(() => null);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function extractSupportedUrls(content: string): Array<{ url: string; platform: string }> {
  const raw = content.match(URL_REGEX) ?? [];
  const seen = new Set<string>();
  const results: Array<{ url: string; platform: string }> = [];

  for (const url of raw) {
    try {
      const { hostname } = new URL(url);
      const bare = hostname.replace(/^www\./, '');
      const platform = SUPPORTED_HOSTS[bare];
      if (platform && !seen.has(url)) {
        seen.add(url);
        results.push({ url, platform });
      }
    } catch { /* skip malformed */ }
  }

  return results;
}

export async function buildPreviewEmbed(url: string, platform: string): Promise<EmbedBuilder | null> {
  try {
    const og = await fetchPreviewData(url, platform);
    if (!og) return null;

    const embed = new EmbedBuilder()
      .setColor(PLATFORM_COLORS[platform] ?? 0x5865f2)
      .setURL(url)
      .setFooter({ text: og.siteName ?? platform });

    if (og.title)       embed.setTitle(og.title.slice(0, 256));
    if (og.description) embed.setDescription(og.description.slice(0, 350));
    if (og.image)       embed.setImage(og.image);

    return embed;
  } catch {
    return null;
  }
}
