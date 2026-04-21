import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requirePermission } from '../../../utils/permissions';
import { logModAction } from '../../../services/modLogger';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a member from the server')
  .addUserOption((opt) => opt.setName('user').setDescription('User to ban').setRequired(true))
  .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the ban'))
  .addIntegerOption((opt) =>
    opt
      .setName('days')
      .setDescription('Number of days of messages to delete (0–7)')
      .setMinValue(0)
      .setMaxValue(7)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'BanMembers', 'Ban Members'))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';
  const days = interaction.options.getInteger('days') ?? 0;

  const member = interaction.guild?.members.cache.get(targetUser.id);

  if (member && !member.bannable) {
    await interaction.reply({ embeds: [errorEmbed('I cannot ban this member.')], flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    await interaction.guild?.bans.create(targetUser.id, {
      reason,
      deleteMessageSeconds: days * 86400,
    });

    await logModAction(interaction.client, {
      action: 'Ban',
      moderator: interaction.user.tag,
      target: targetUser.tag,
      reason,
    });

    await interaction.reply({
      embeds: [successEmbed('✅ Member Banned', `**${targetUser.tag}** has been banned.\n**Reason:** ${reason}`)],
    });
  } catch {
    await interaction.reply({ embeds: [errorEmbed('Failed to ban the member.')], flags: MessageFlags.Ephemeral });
  }
}
