import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { errorEmbed } from '../../../utils/embeds';

const BOOST_LABEL = ['No Boost', 'Level 1', 'Level 2', 'Level 3'];

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Display server stats and information');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ embeds: [errorEmbed('This command must be used in a server.')], flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply();
  const owner = await guild.fetchOwner().catch(() => null);

  const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
  const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased()).size;
  const boostLevel = guild.premiumTier;
  const boostCount = guild.premiumSubscriptionCount ?? 0;
  const createdAt = Math.floor(guild.createdTimestamp / 1000);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
    .setTitle('📋 Server Information')
    .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
    .addFields(
      { name: '🆔 Server ID',    value: `\`${guild.id}\``,                     inline: true },
      { name: '👑 Owner',         value: owner ? `<@${owner.id}>` : 'Unknown', inline: true },
      { name: '📅 Created',       value: `<t:${createdAt}:D>`,                 inline: true },
      { name: '👥 Members',       value: `${guild.memberCount}`,                inline: true },
      { name: '💬 Text Channels', value: `${textChannels}`,                     inline: true },
      { name: '🔊 Voice Channels',value: `${voiceChannels}`,                    inline: true },
      { name: '🎭 Roles',         value: `${guild.roles.cache.size}`,           inline: true },
      { name: '✨ Boost Level',   value: `${BOOST_LABEL[boostLevel] ?? `Level ${boostLevel}`} (${boostCount} boosts)`, inline: true },
      { name: '😀 Emojis',        value: `${guild.emojis.cache.size}`,          inline: true }
    )
    .setImage(guild.bannerURL({ size: 1024 }) ?? null)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
