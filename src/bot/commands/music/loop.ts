import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { RepeatMode } from 'lavalink-client';
import { lavalink } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Set the loop mode for the queue')
  .addStringOption(opt =>
    opt.setName('mode')
      .setDescription('Loop mode')
      .setRequired(true)
      .addChoices(
        { name: 'Off', value: 'off' },
        { name: 'Track', value: 'track' },
        { name: 'Queue', value: 'queue' },
      )
  );

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const player = lavalink.getPlayer(interaction.guildId!);

  if (!player?.playing) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const mode = interaction.options.getString('mode', true) as RepeatMode;

  const labels: Record<RepeatMode, string> = {
    off: 'Off', track: 'Track', queue: 'Queue',
  };

  player.setRepeatMode(mode);
  await interaction.reply({ embeds: [successEmbed('Loop Mode', `Set loop mode to **${labels[mode]}**`)] });
}
