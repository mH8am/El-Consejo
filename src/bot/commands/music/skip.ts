import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the current track');

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue?.isPlaying()) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const track = queue.currentTrack!;
  queue.node.skip();

  await interaction.reply({ embeds: [successEmbed('Skipped', `Skipped **${track.title}**`)] });
}
