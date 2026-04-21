import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { requirePermission } from '../../../utils/permissions';
import { logModAction } from '../../../services/modLogger';
import { addWarn } from '../../../services/moderation';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Issue a formal warning to a member')
  .addUserOption((opt) => opt.setName('user').setDescription('User to warn').setRequired(true))
  .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the warning').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'ModerateMembers', 'Moderate Members'))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  try {
    const warns = addWarn(interaction.guildId!, targetUser.id, {
      moderatorTag: interaction.user.tag,
      reason,
      timestamp: Date.now(),
    });

    await logModAction(interaction.client, {
      action: 'Warn',
      moderator: interaction.user.tag,
      target: targetUser.tag,
      reason: `${reason} (warn #${warns.length})`,
    });

    try {
      await targetUser.send(
        `⚠️ You have received a warning in **${interaction.guild?.name}**.\n**Reason:** ${reason}\nThis is warning **#${warns.length}**.`
      );
    } catch {
      // DMs may be closed — proceed silently
    }

    await interaction.reply({
      embeds: [
        successEmbed(
          '⚠️ Warning Issued',
          `**${targetUser.tag}** has been warned. This is their **#${warns.length}** warning.\n**Reason:** ${reason}`
        ),
      ],
    });
  } catch {
    await interaction.reply({ embeds: [errorEmbed('Failed to issue the warning.')], ephemeral: true });
  }
}
