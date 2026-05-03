import { Message } from 'discord.js';
import * as fs from 'fs';
import { client } from '../client';
import { addXP } from '../../services/xpService';
import { extractSupportedUrls, buildPreviewEmbed } from '../../services/linkPreview';
import { downloadVideo } from '../../services/videoDownloader';

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;

  await addXP(message);

  const links = extractSupportedUrls(message.content);
  if (links.length === 0) return;

  const { url, platform } = links[0];

  // Show typing indicator while we work (download can take several seconds)
  if ('sendTyping' in message.channel) message.channel.sendTyping().catch(() => {});

  const videoPath = await downloadVideo(url);

  if (videoPath) {
    try {
      await message.reply({
        files: [{ attachment: videoPath, name: 'video.mp4' }],
        allowedMentions: { repliedUser: false },
      });
    } finally {
      fs.unlink(videoPath, () => {});
    }
    return;
  }

  // Video unavailable or over 8MB — fall back to metadata embed
  const embed = await buildPreviewEmbed(url, platform);
  if (!embed) return;
  await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
});
