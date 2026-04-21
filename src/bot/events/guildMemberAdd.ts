import { EmbedBuilder, GuildMember, TextChannel } from 'discord.js';
import { client } from '../client';
import { log } from '../../utils/logger';

client.on('guildMemberAdd', async (member: GuildMember) => {
  const channelId = process.env.WELCOME_CHANNEL_ID;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('👋 Welcome!')
    .setDescription(`Welcome to **${member.guild.name}**, ${member}! We're glad to have you here.`)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields({ name: 'Member #', value: `${member.guild.memberCount}`, inline: true })
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
