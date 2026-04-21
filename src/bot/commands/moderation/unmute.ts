import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { requirePermission } from '../../../utils/permissions';
import { logModAction } from '../../../services/modLogger';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Remove a timeout from a member')
  .addUserOption((opt) => opt.setName('user').setDescription('User to unmute').setRequired(true))
  .addStringOption((opt) => opt.setName('reason').setDescription('Reason for removing the timeout'));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'ModerateMembers', 'Moderate Members'))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  const member = interaction.guild?.members.cache.get(targetUser.id);
  if (!member) {
    await interaction.reply({ embeds: [errorEmbed('Could not find that member.')], flags: MessageFlags.Ephemeral });
    return;
  }

  if (!member.isCommunicationDisabled()) {
    await interaction.reply({
      embeds: [errorEmbed(`**${targetUser.tag}** is not currently timed out.`)],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await member.timeout(null, reason);

    await logModAction(interaction.client, {
      action: 'Unmute (Timeout Removed)',
      moderator: interaction.user.tag,
      target: targetUser.tag,
      reason,
    });

    await interaction.reply({
      embeds: [
        successEmbed(
          '✅ Member Unmuted',
          `**${targetUser.tag}**'s timeout has been removed.\n**Reason:** ${reason}`
        ),
      ],
    });
  } catch {
    await interaction.reply({ embeds: [errorEmbed('Failed to remove the timeout.')], flags: MessageFlags.Ephemeral });
  }
}
