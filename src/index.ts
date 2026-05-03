import 'dotenv/config';
import { validateEnv } from './utils/validateEnv';
validateEnv();
import { client } from './bot/client';
import { startApi } from './api/server';
import { initMusicPlayer } from './services/musicPlayer';
import { loadCommands } from './utils/loader';
import { log } from './utils/logger';
import path from 'path';

async function main() {
  // Load all commands
  loadCommands(client, path.join(__dirname, 'bot/commands'));

  // Register events
  import('./bot/events/ready');
  import('./bot/events/interactionCreate');
  import('./bot/events/guildMemberAdd');
  import('./bot/events/guildMemberRemove');
  import('./bot/events/messageCreate');

  // Initialize music player (must run before login so the Player singleton is ready)
  await initMusicPlayer(client);

  // Start Express API
  startApi();

  // Login the bot
  await client.login(process.env.DISCORD_TOKEN).catch((err) => {
    log('error', `Failed to login: ${err.message}`);
    process.exit(1);
  });
}

main().catch((err) => {
  log('error', `Startup error: ${err.message}`);
  process.exit(1);
});
