import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { useQueue } from 'discord-player';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('Set the playback volume (1–100)')
  .addIntegerOption(opt =>
    opt.setName('level')
      .setDescription('Volume level (1–100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  );

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue?.isPlaying()) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const level = interaction.options.getInteger('level', true);
  queue.node.setVolume(level);

  await interaction.reply({ embeds: [successEmbed('Volume', `Set volume to **${level}%**`)] });
}
