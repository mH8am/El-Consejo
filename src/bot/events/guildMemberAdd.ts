import { EmbedBuilder, GuildMember, TextChannel } from 'discord.js';
import { client } from '../client';
import { log } from '../../utils/logger';

client.on('guildMemberAdd', async (member: GuildMember) => {
  const channelId = process.env.WELCOME_CHANNEL_ID;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const memberNumber = member.guild.memberCount;
  const createdAt = Math.floor(member.user.createdTimestamp / 1000);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() ?? undefined })
    .setTitle('👋 Welcome to the server!')
    .setDescription(`Hey ${member}, welcome to **${member.guild.name}**!\nWe're glad to have you here. Make yourself at home.`)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: '👤 Account Created', value: `<t:${createdAt}:R>`, inline: true },
      { name: '🎉 Member Count', value: `You are member **#${memberNumber}**`, inline: true }
    )
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    log('error', `Failed to send welcome message: ${(err as Error).message}`);
  }

  const autoRoleId = process.env.AUTO_ROLE_ID;
  if (autoRoleId) {
    try {
      await member.roles.add(autoRoleId);
    } catch (err) {
      log('error', `Failed to assign auto-role to ${member.user.tag}: ${(err as Error).message}`);
    }
  }
});
