import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadCommandData } from './utils/loader';
import { log } from './utils/logger';
import path from 'path';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.CLIENT_ID!;

if (!token || !clientId) {
  log('error', 'DISCORD_TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

(async () => {
  const commands = loadCommandData(path.join(__dirname, 'bot/commands'));
  const rest = new REST({ version: '10' }).setToken(token);

  log('info', `Registering ${commands.length} slash commands...`);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  log('info', 'Slash commands registered successfully.');
})();
