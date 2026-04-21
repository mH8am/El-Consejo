import { log } from './logger';

const REQUIRED = ['DISCORD_TOKEN', 'CLIENT_ID', 'RIOT_API_KEY'];
const OPTIONAL = ['LP_CHANNEL_ID', 'MOD_LOG_CHANNEL_ID', 'WELCOME_CHANNEL_ID', 'API_SECRET_KEY'];

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    for (const key of missing) {
      log('error', `Missing required environment variable: ${key}`);
    }
    process.exit(1);
  }

  for (const key of OPTIONAL) {
    if (!process.env[key]) {
      log('warn', `Optional environment variable not set: ${key} — related features will be disabled`);
    }
  }
}
