import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('clearqueue')
  .setDescription('Remove all upcoming tracks from the queue');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.queue.current) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const count = player.queue.tracks.length;

  if (count === 0) {
    await interaction.reply({ embeds: [errorEmbed('The queue is already empty.')], flags: MessageFlags.Ephemeral });
    return;
  }

  player.queue.splice(0, count);
  await interaction.reply({ embeds: [successEmbed('Queue Cleared', `Removed **${count}** track${count === 1 ? '' : 's'} from the queue.`)] });
}
