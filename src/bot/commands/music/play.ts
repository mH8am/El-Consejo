import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';
import { errorEmbed, successEmbed, infoEmbed } from '../../../utils/embeds';
import { MusicMetadata } from '../../../services/musicPlayer';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song from YouTube or Spotify')
  .addStringOption(opt =>
    opt.setName('query')
      .setDescription('Song name, YouTube URL, or Spotify URL')
      .setRequired(true)
  );

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({ embeds: [errorEmbed('You must be in a voice channel to play music.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const botMember = interaction.guild!.members.me!;
  if (!voiceChannel.permissionsFor(botMember)?.has(['Connect', 'Speak'])) {
    await interaction.reply({ embeds: [errorEmbed('I need **Connect** and **Speak** permissions in that voice channel.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const query = interaction.options.getString('query', true);
  await interaction.deferReply();

  try {
    const player = useMainPlayer();
    const existingQueue = useQueue(interaction.guild!);
    const wasPlaying = existingQueue?.isPlaying() ?? false;

    const { track } = await player.play(voiceChannel, query, {
      nodeOptions: {
        metadata: { channel: interaction.channel } as MusicMetadata,
        volume: 80,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300_000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 300_000,
      },
    });

    const embed = wasPlaying
      ? successEmbed('Added to Queue', `[${track.title}](${track.url})\nby **${track.author}** • \`${track.duration}\``)
      : infoEmbed('Now Playing', `[${track.title}](${track.url})\nby **${track.author}** • \`${track.duration}\``);

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    const msg = err?.message ?? 'Could not find or play that track.';
    await interaction.editReply({ embeds: [errorEmbed(msg)] });
  }
}
