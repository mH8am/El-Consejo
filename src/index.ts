import 'dotenv/config';
import { validateEnv } from './utils/validateEnv';
validateEnv();
import { client } from './bot/client';
import { startApi } from './api/server';
import { initLavalinkManager } from './services/lavalinkManager';
import { loadCommands } from './utils/loader';
import { log } from './utils/logger';
import path from 'path';

// Load all commands
loadCommands(client, path.join(__dirname, 'bot/commands'));

// Register events
import './bot/events/ready';
import './bot/events/interactionCreate';
import './bot/events/guildMemberAdd';
import './bot/events/guildMemberRemove';
import './bot/events/messageCreate';

// Set up Lavalink manager (init() is called inside the ready event)
initLavalinkManager(client);

// Start Express API
startApi();

// Login the bot
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  log('error', `Failed to login: ${err.message}`);
  process.exit(1);
});
