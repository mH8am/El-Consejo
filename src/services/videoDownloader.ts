import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { log } from '../utils/logger';

const execFileAsync = promisify(execFile);

// Discord free-tier upload limit
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Downloads a video from the given URL using yt-dlp and returns a local
 * temp file path. Returns null if the video is unavailable, too large, or
 * yt-dlp is not installed. Caller is responsible for deleting the file.
 */
export async function downloadVideo(url: string): Promise<string | null> {
  const tmpPath = path.join(os.tmpdir(), `dc_video_${Date.now()}.mp4`);

  try {
    await execFileAsync('yt-dlp', [
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      // Prefer mp4 under 8MB; fall back to any best format within the limit
      '-f', 'bestvideo[ext=mp4][filesize<8M]+bestaudio[ext=m4a]/best[ext=mp4][filesize<8M]/best[filesize<8M]',
      '--merge-output-format', 'mp4',
      '--max-filesize', '8m',
      '-o', tmpPath,
      url,
    ], { timeout: 60_000 });

    if (!fs.existsSync(tmpPath)) return null;

    // Double-check size in case yt-dlp's estimate was off
    if (fs.statSync(tmpPath).size > MAX_FILE_BYTES) {
      fs.unlinkSync(tmpPath);
      return null;
    }

    return tmpPath;
  } catch (err: any) {
    const reason = err?.stderr?.trim() || err?.message || 'unknown error';
    log('warn', `yt-dlp failed for ${url}: ${reason}`);
    try { fs.unlinkSync(tmpPath); } catch { /* already gone */ }
    return null;
  }
}
