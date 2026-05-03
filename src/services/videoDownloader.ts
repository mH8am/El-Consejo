import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { log } from '../utils/logger';

const execFileAsync = promisify(execFile);

// Cap raw download at 200MB to avoid filling disk with huge files
const MAX_DOWNLOAD_MB = 200;

// Write INSTAGRAM_COOKIES env var to a temp file once and reuse the path.
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

async function compressVideo(inputPath: string, maxBytes: number): Promise<string | null> {
  const outputPath = inputPath.replace('.mp4', '_compressed.mp4');
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      inputPath,
    ], { timeout: 10_000 });

    const duration = parseFloat(stdout.trim());
    if (!duration || duration <= 0) return null;

    // Target bitrate: fill the budget minus 64kbps audio track
    const targetBits = maxBytes * 8 * 0.95;
    const videoBitrate = Math.max(100, Math.floor((targetBits - 64_000 * duration) / duration / 1000));

    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-c:v', 'libx264', '-b:v', `${videoBitrate}k`,
      '-c:a', 'aac', '-b:a', '64k',
      '-y', outputPath,
    ], { timeout: 300_000 });

    if (!fs.existsSync(outputPath)) return null;

    if (fs.statSync(outputPath).size > maxBytes) {
      fs.unlinkSync(outputPath);
      return null;
    }

    return outputPath;
  } catch (err: any) {
    log('warn', `ffmpeg compression failed: ${err?.message}`);
    try { fs.unlinkSync(outputPath); } catch { /* already gone */ }
    return null;
  }
}

/**
 * Downloads a video using yt-dlp, compresses it if needed, and returns the
 * local temp file path. Returns null if unavailable or yt-dlp fails.
 * Caller must delete the file after use.
 */
export async function downloadVideo(url: string, maxUploadBytes: number = 8 * 1024 * 1024): Promise<string | null> {
  const tmpPath = path.join(os.tmpdir(), `dc_video_${Date.now()}.mp4`);

  const cookiesPath = getCookiesPath();
  const cookiesArgs = cookiesPath ? ['--cookies', cookiesPath] : [];

  try {
    await execFileAsync('yt-dlp', [
      '--no-playlist',
      '--no-warnings',
      '--quiet',
      '-f', 'best[ext=mp4]/best',
      '--max-filesize', `${MAX_DOWNLOAD_MB}m`,
      ...cookiesArgs,
      '-o', tmpPath,
      url,
    ], { timeout: 180_000 });

    if (!fs.existsSync(tmpPath)) return null;

    const size = fs.statSync(tmpPath).size;

    if (size <= maxUploadBytes) return tmpPath;

    // File is too large for Discord — compress it down
    const compressed = await compressVideo(tmpPath, maxUploadBytes);
    fs.unlinkSync(tmpPath);
    return compressed;
  } catch (err: any) {
    const reason = err?.stderr?.trim() || err?.message || 'unknown';
    log('warn', `yt-dlp failed for ${url}: ${reason}`);
    try { fs.unlinkSync(tmpPath); } catch { /* already gone */ }
    return null;
  }
}
