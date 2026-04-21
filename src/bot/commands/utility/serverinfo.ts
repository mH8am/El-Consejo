import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Display server stats and information');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ embeds: [errorEmbed('This command must be used in a server.')], ephemeral: true });
    return;
  }

  const owner = await guild.fetchOwner().catch(() => null);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📋 ${guild.name}`)
    .setThumbnail(guild.iconURL())
    .addFields(
      { name: '🆔 Server ID', value: guild.id, inline: true },
      { name: '👑 Owner', value: owner?.user.tag ?? 'Unknown', inline: true },
      { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
      { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
      { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
      { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
