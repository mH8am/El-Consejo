import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, MessageFlags } from 'discord.js';
import { Track } from 'lavalink-client';
import { lavalink, formatDuration } from '../../../services/lavalinkManager';
import { errorEmbed, successEmbed, infoEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song from YouTube or SoundCloud')
  .addStringOption(opt =>
    opt.setName('query')
      .setDescription('Song name or URL (YouTube, SoundCloud)')
      .setRequired(true)
  );

export const category = 'Music';

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({ embeds: [errorEmbed('You must be in a voice channel.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const botMember = interaction.guild!.members.me!;
  if (!voiceChannel.permissionsFor(botMember)?.has(['Connect', 'Speak'])) {
    await interaction.reply({ embeds: [errorEmbed('I need **Connect** and **Speak** permissions in that channel.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const query = interaction.options.getString('query', true);
  await interaction.deferReply();

  const hasNode = [...lavalink.nodeManager.nodes.values()].some(n => n.connected);
  if (!hasNode) {
    await interaction.editReply({ embeds: [errorEmbed('Music service is temporarily unavailable. The audio server is not connected.')] });
    return;
  }

  try {
    const player = lavalink.createPlayer({
      guildId: interaction.guildId!,
      voiceChannelId: voiceChannel.id,
      textChannelId: interaction.channelId,
      selfDeaf: true,
      volume: 80,
    });

    await player.connect();

    const result = await player.search({ query }, interaction.user);

    if (!result.tracks.length) {
      await interaction.editReply({ embeds: [errorEmbed(`No results found for \`${query}\`.`)] });
      return;
    }

    // search() returns resolved Track objects; cast away the union with UnresolvedTrack
    const tracks = result.tracks as Track[];
    const wasPlaying = player.playing || player.paused;

    if (result.loadType === 'playlist') {
      await player.queue.add(tracks);
      if (!wasPlaying) await player.play({ paused: false });
      const totalDur = tracks.reduce((acc, t) => acc + (t.info.duration ?? 0), 0);
      await interaction.editReply({
        embeds: [successEmbed(
          'Playlist Added',
          `Added **${tracks.length} tracks** from **${result.playlist?.name ?? 'playlist'}**\nTotal duration: \`${formatDuration(totalDur)}\``,
        )],
      });
    } else {
      const track = tracks[0];
      await player.queue.add(track);
      if (!wasPlaying) await player.play({ paused: false });
      const dur = formatDuration(track.info.duration ?? 0);
      const embed = wasPlaying
        ? successEmbed('Added to Queue', `[${track.info.title}](${track.info.uri})\nby **${track.info.author}** • \`${dur}\``)
        : infoEmbed('Now Playing', `[${track.info.title}](${track.info.uri})\nby **${track.info.author}** • \`${dur}\``);
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (err: any) {
    await interaction.editReply({ embeds: [errorEmbed(err?.message ?? 'Could not play that track.')] });
  }
}
