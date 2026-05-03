import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { log } from '../utils/logger';

const execFileAsync = promisify(execFile);

const MAX_FILE_BYTES = 8 * 1024 * 1024; // Discord free-tier limit

// Write INSTAGRAM_COOKIES env var to a temp file once and reuse the path.
// Returns null if the env var is not set.
let cookiesFilePath: string | null = null;

function getCookiesPath(): string | null {
  if (cookiesFilePath) return cookiesFilePath;
  const raw = process.env.INSTAGRAM_COOKIES;
  if (!raw) return null;
  const p = path.join(os.tmpdir(), 'yt_dlp_cookies.txt');
  fs.writeFileSync(p, raw, 'utf8');
  cookiesFilePath = p;
  return p;
}

/**
 * Downloads a video using yt-dlp and returns the local temp file path.
 * Returns null if unavailable, too large, or yt-dlp fails.
 * Caller must delete the file after use.
 */
export async function downloadVideo(url: string): Promise<string | null> {
  const tmpPath = path.join(os.tmpdir(), `dc_video_${Date.now()}.mp4`);

  const cookiesPath = getCookiesPath();
  const cookiesArgs = cookiesPath ? ['--cookies', cookiesPath] : [];

  try {
    await execFileAsync('yt-dlp', [
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      '-f', 'best[ext=mp4]/best',
      '--max-filesize', '8m',
      '--max-duration', '300',      // skip videos over 5 min — no separate info call needed
      ...cookiesArgs,
      '-o', tmpPath,
      url,
    ], { timeout: 90_000 });

    if (!fs.existsSync(tmpPath)) return null;

    if (fs.statSync(tmpPath).size > MAX_FILE_BYTES) {
      fs.unlinkSync(tmpPath);
      return null;
    }

    return tmpPath;
  } catch (err: any) {
    const reason = err?.stderr?.trim() || err?.message || 'unknown';
    log('warn', `yt-dlp failed for ${url}: ${reason}`);
    try { fs.unlinkSync(tmpPath); } catch { /* already gone */ }
    return null;
  }
}
