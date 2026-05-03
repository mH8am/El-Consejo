import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Platforms Discord does NOT natively embed (so our embed adds value)
const SUPPORTED_HOSTS: Record<string, string> = {
  'tiktok.com':      'TikTok',
  'vm.tiktok.com':   'TikTok',
  'twitter.com':     'Twitter',
  'x.com':           'Twitter',
  't.co':            'Twitter',
  'instagram.com':   'Instagram',
  'facebook.com':    'Facebook',
  'fb.com':          'Facebook',
  'fb.watch':        'Facebook',
};

const PLATFORM_COLORS: Record<string, number> = {
  TikTok:    0x010101,
  Twitter:   0x1da1f2,
  Instagram: 0xe1306c,
  Facebook:  0x1877f2,
};

// Twitter/X native OG is broken — proxy through fxtwitter for proper embeds
function rewriteUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'twitter.com' || u.hostname === 'x.com' || u.hostname === 't.co') {
      u.hostname = 'api.fxtwitter.com';
      return u.toString();
    }
  } catch { /* fall through */ }
  return url;
}

interface OGData {
  title?:       string;
  description?: string;
  image?:       string;
  siteName?:    string;
  videoUrl?:    string;
}

async function fetchOGData(url: string): Promise<OGData> {
  const fetchUrl = rewriteUrl(url);
  const isTwitter = fetchUrl.includes('fxtwitter.com');

  // fxtwitter returns JSON; everything else is HTML
  if (isTwitter) {
    const res = await axios.get(fetchUrl, { timeout: 8_000 });
    const tweet = res.data?.tweet;
    return {
      title:       tweet?.author?.name ? `@${tweet.author.screen_name}` : undefined,
      description: tweet?.text,
      image:       tweet?.media?.photos?.[0]?.url ?? tweet?.media?.videos?.[0]?.thumbnail_url,
      siteName:    'Twitter / X',
    };
  }

  const res = await axios.get(url, {
    timeout: 8_000,
    maxContentLength: 600_000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  const html: string = typeof res.data === 'string' ? res.data : '';
  const og: OGData = {};

  // Parse <meta property="og:*"> and <meta name="og:*">
  const metaRe = /<meta[^>]+(?:property|name)="og:([^"]+)"[^>]+content="([^"]*)"[^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const [, prop, val] = m;
    const decoded = val.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (prop === 'title')       og.title = decoded;
    if (prop === 'description') og.description = decoded;
    if (prop === 'image')       og.image = decoded;
    if (prop === 'site_name')   og.siteName = decoded;
    if (prop === 'video:url' || prop === 'video:secure_url') og.videoUrl = decoded;
  }

  // Fallback: <title> tag
  if (!og.title) {
    const t = html.match(/<title[^>]*>([^<]{1,256})<\/title>/i);
    if (t) og.title = t[1].trim();
  }

  return og;
}

export function extractSupportedUrls(content: string): Array<{ url: string; platform: string }> {
  const raw = content.match(URL_REGEX) ?? [];
  const results: Array<{ url: string; platform: string }> = [];

  for (const url of raw) {
    try {
      const { hostname } = new URL(url);
      const bare = hostname.replace(/^www\./, '');
      const platform = SUPPORTED_HOSTS[bare];
      if (platform) results.push({ url, platform });
    } catch { /* skip malformed */ }
  }

  return results;
}

export async function buildPreviewEmbed(url: string, platform: string): Promise<EmbedBuilder | null> {
  try {
    const og = await fetchOGData(url);
    if (!og.title && !og.description && !og.image) return null;

    const embed = new EmbedBuilder()
      .setColor(PLATFORM_COLORS[platform] ?? 0x5865f2)
      .setURL(url);

    if (og.title)       embed.setTitle(og.title.slice(0, 256));
    if (og.description) embed.setDescription(og.description.slice(0, 350));
    if (og.image)       embed.setImage(og.image);

    embed.setFooter({ text: og.siteName ?? platform });

    return embed;
  } catch {
    return null;
  }
}
