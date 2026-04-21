import { Message } from 'discord.js';
import { client } from '../client';
import { addXP } from '../../services/xpService';

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;
  await addXP(message);
});
