import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { log } from '../utils/logger';

interface ModAction {
  action: string;
  moderator: string;
  target: string;
  reason: string;
}

const ACTION_CONFIG: Record<string, { color: number; emoji: string }> = {
  'Ban':                    { color: 0xe74c3c, emoji: '🔨' },
  'Kick':                   { color: 0xe67e22, emoji: '👢' },
  'Mute (Timeout)':         { color: 0xf1c40f, emoji: '🔇' },
  'Unmute (Timeout Removed)':{ color: 0x2ecc71, emoji: '🔊' },
  'Warn':                   { color: 0xffa500, emoji: '⚠️' },
};

export async function logModAction(client: Client, action: ModAction): Promise<void> {
  const channelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!channelId) return;

  const channel = client.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const cfg = ACTION_CONFIG[action.action] ?? { color: 0x5865f2, emoji: '🛡️' };

  const embed = new EmbedBuilder()
    .setColor(cfg.color)
    .setAuthor({ name: `${cfg.emoji}  ${action.action}` })
    .addFields(
      { name: '👮 Moderator', value: action.moderator, inline: true },
      { name: '🎯 Target',    value: action.target,    inline: true },
      { name: '​',       value: '​',          inline: true },
      { name: '📝 Reason',    value: action.reason || 'No reason provided' }
    )
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    log('error', `Failed to log mod action: ${(err as Error).message}`);
  }
}
