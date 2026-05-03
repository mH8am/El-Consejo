import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalink, formatDuration } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

function parseTimeToMs(input: string): number | null {
  const parts = input.split(':').map(Number);
  if (parts.some(isNaN) || parts.some(p => p < 0)) return null;
  if (parts.length === 1) return parts[0] * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  return null;
}

export const data = new SlashCommandBuilder()
  .setName('seek')
  .setDescription('Jump to a specific position in the current track')
  .addStringOption(opt =>
    opt.setName('position')
      .setDescription('Time to seek to (e.g. 1:30 or 90)')
      .setRequired(true)
  );

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.queue.current) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const track = player.queue.current;
  if (track.info.isStream) {
    await interaction.reply({ embeds: [errorEmbed('Cannot seek in a live stream.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const input = interaction.options.getString('position', true);
  const ms = parseTimeToMs(input);

  if (ms === null) {
    await interaction.reply({ embeds: [errorEmbed('Invalid time format. Use `1:30` or `90` (seconds).')], flags: MessageFlags.Ephemeral });
    return;
  }

  const duration = track.info.duration ?? 0;
  if (ms > duration) {
    await interaction.reply({ embeds: [errorEmbed(`Cannot seek past the track duration (\`${formatDuration(duration)}\`).`)], flags: MessageFlags.Ephemeral });
    return;
  }

  await player.seek(ms);
  await interaction.reply({ embeds: [successEmbed('Seeked', `Jumped to \`${formatDuration(ms)}\` in **${track.info.title}**`)] });
}
