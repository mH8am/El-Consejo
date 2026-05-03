import { Message } from 'discord.js';
import * as fs from 'fs';
import { client } from '../client';
import { addXP } from '../../services/xpService';
import { extractSupportedUrls, buildPreviewEmbed, getProxyUrl } from '../../services/linkPreview';
import { downloadVideo } from '../../services/videoDownloader';
import { errorEmbed } from '../../utils/embeds';

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.guild) return;

  await addXP(message);

  const links = extractSupportedUrls(message.content);
  if (links.length === 0) return;

  const { url, platform } = links[0];

  // Try to download and upload as a file — the only way to get inline video playback in Discord
  const keepTyping = () => {
    if ('sendTyping' in message.channel) message.channel.sendTyping().catch(() => {});
  };
  keepTyping();
  const typingInterval = setInterval(keepTyping, 8_000);

  try {
    const videoPath = await downloadVideo(url);

    if (videoPath) {
      try {
        await message.reply({
          files: [{ attachment: videoPath, name: 'video.mp4' }],
          allowedMentions: { repliedUser: false },
        });
        return;
      } finally {
        fs.unlink(videoPath, () => {});
      }
    }

    // Download failed — try a proxy URL (shows a link preview, not inline video)
    const proxyUrl = getProxyUrl(url, platform);
    if (proxyUrl) {
      await message.reply({ content: proxyUrl, allowedMentions: { repliedUser: false } });
      return;
    }

    // No proxy available (Facebook) — try metadata embed
    const embed = await buildPreviewEmbed(url, platform);
    if (embed) {
      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
      return;
    }

    await message.reply({
      embeds: [errorEmbed(`Could not preview this ${platform} link. The content may be private or unavailable.`)],
      allowedMentions: { repliedUser: false },
    });
  } finally {
    clearInterval(typingInterval);
  }
});
