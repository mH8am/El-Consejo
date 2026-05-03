import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { log } from '../utils/logger';

const execFileAsync = promisify(execFile);

const MAX_FILE_BYTES  = 8 * 1024 * 1024; // Discord free-tier limit
const MAX_DURATION_S  = 300;              // skip videos longer than 5 minutes

/**
 * Downloads a video using yt-dlp and returns the local temp file path.
 * Returns null if unavailable, too large, too long, or yt-dlp is not installed.
 * Caller must delete the file after use.
 */
export async function downloadVideo(url: string): Promise<string | null> {
  // ── Step 1: get video info without downloading ──────────────────────────────
  let duration = 0;
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '--no-playlist',
      '--quiet',
      '--print', 'duration',
      url,
    ], { timeout: 15_000 });
    duration = parseFloat(stdout.trim()) || 0;
  } catch (err: any) {
    log('warn', `yt-dlp info failed for ${url}: ${err?.stderr?.trim() || err?.message}`);
    return null;
  }

  if (duration > MAX_DURATION_S) {
    log('info', `yt-dlp skipped ${url}: duration ${duration}s exceeds limit`);
    return null;
  }

  // ── Step 2: download (no ffmpeg merge — avoids transcoding memory spike) ────
  const tmpPath = path.join(os.tmpdir(), `dc_video_${Date.now()}.mp4`);

  try {
    await execFileAsync('yt-dlp', [
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      '-f', 'best[ext=mp4]/best',   // prefer already-muxed mp4; no merge step
      '--max-filesize', '8m',
      '-o', tmpPath,
      url,
    ], { timeout: 60_000 });

    if (!fs.existsSync(tmpPath)) return null;

    if (fs.statSync(tmpPath).size > MAX_FILE_BYTES) {
      fs.unlinkSync(tmpPath);
      return null;
    }

    return tmpPath;
  } catch (err: any) {
    log('warn', `yt-dlp download failed for ${url}: ${err?.stderr?.trim() || err?.message}`);
    try { fs.unlinkSync(tmpPath); } catch { /* already gone */ }
    return null;
  }
}
