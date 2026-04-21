import { EmbedBuilder, GuildMember, PartialGuildMember, TextChannel } from 'discord.js';
import { client } from '../client';
import { log } from '../../utils/logger';

client.on('guildMemberRemove', async (member: GuildMember | PartialGuildMember) => {
  const channelId = process.env.WELCOME_CHANNEL_ID;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const joinedAt = member.joinedTimestamp
    ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
    : 'Unknown';

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() ?? undefined })
    .setTitle('👋 A member has left')
    .setDescription(`**${member.user?.tag ?? 'A member'}** has left the server.\n${member.guild.memberCount} members remain.`)
    .setThumbnail(member.user?.displayAvatarURL({ size: 128 }) ?? null)
    .addFields({ name: '📅 Joined', value: joinedAt, inline: true })
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    log('error', `Failed to send farewell message: ${(err as Error).message}`);
  }
});
