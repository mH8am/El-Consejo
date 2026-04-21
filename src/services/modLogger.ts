import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { log } from '../utils/logger';

interface ModAction {
  action: string;
  moderator: string;
  target: string;
  reason: string;
}

export async function logModAction(client: Client, action: ModAction): Promise<void> {
  const channelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!channelId) return;

  const channel = client.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle(`🛡️ Moderation Action — ${action.action}`)
    .addFields(
      { name: '👮 Moderator', value: action.moderator, inline: true },
      { name: '🎯 Target', value: action.target, inline: true },
      { name: '📝 Reason', value: action.reason || 'No reason provided' }
    )
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    log('error', `Failed to log mod action: ${(err as Error).message}`);
  }
}
