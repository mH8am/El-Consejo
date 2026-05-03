import { Message } from 'discord.js';
import { client } from '../client';
import { addXP } from '../../services/xpService';
import { extractSupportedUrls, buildPreviewEmbed } from '../../services/linkPreview';

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;

  await addXP(message);

  const links = extractSupportedUrls(message.content);
  if (links.length === 0) return;

  // Only preview the first supported link per message
  const { url, platform } = links[0];
  const embed = await buildPreviewEmbed(url, platform);
  if (!embed) return;

  await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
});
