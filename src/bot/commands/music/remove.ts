import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Track } from 'lavalink-client';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Remove a track from the queue by its position')
  .addIntegerOption(opt =>
    opt.setName('position')
      .setDescription('Queue position to remove')
      .setMinValue(1)
      .setRequired(true)
  );

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.queue.current) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const position = interaction.options.getInteger('position', true);
  const queueLength = player.queue.tracks.length;

  if (queueLength === 0) {
    await interaction.reply({ embeds: [errorEmbed('The queue is empty.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (position > queueLength) {
    await interaction.reply({ embeds: [errorEmbed(`Position must be between 1 and **${queueLength}**.`)], flags: MessageFlags.Ephemeral });
    return;
  }

  const [removed] = player.queue.splice(position - 1, 1) as Track[];
  await interaction.reply({ embeds: [successEmbed('Removed', `Removed **${removed.info.title}** from position **${position}**`)] });
}
