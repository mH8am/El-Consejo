import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { useQueue, QueueRepeatMode } from 'discord-player';
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
        { name: 'Autoplay', value: 'autoplay' },
      )
  );

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = useQueue(interaction.guild!);

  if (!queue?.isPlaying()) {
    await interaction.reply({ embeds: [errorEmbed('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const mode = interaction.options.getString('mode', true);

  const modeMap: Record<string, QueueRepeatMode> = {
    off:      QueueRepeatMode.OFF,
    track:    QueueRepeatMode.TRACK,
    queue:    QueueRepeatMode.QUEUE,
    autoplay: QueueRepeatMode.AUTOPLAY,
  };

  const labels: Record<string, string> = {
    off:      'Off',
    track:    'Track',
    queue:    'Queue',
    autoplay: 'Autoplay',
  };

  queue.setRepeatMode(modeMap[mode]);
  await interaction.reply({ embeds: [successEmbed('Loop Mode', `Set loop mode to **${labels[mode]}**`)] });
}
