import { EmbedBuilder, GuildMember, PartialGuildMember, TextChannel } from 'discord.js';
import { client } from '../client';
import { log } from '../../utils/logger';

client.on('guildMemberRemove', async (member: GuildMember | PartialGuildMember) => {
  const channelId = process.env.WELCOME_CHANNEL_ID;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('👋 Goodbye!')
    .setDescription(`**${member.user?.tag ?? 'A member'}** has left the server.`)
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    log('error', `Failed to send farewell message: ${(err as Error).message}`);
  }
});
