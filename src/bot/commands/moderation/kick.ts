import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { requirePermission } from '../../../utils/permissions';
import { logModAction } from '../../../services/modLogger';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a member from the server')
  .addUserOption((opt) => opt.setName('user').setDescription('User to kick').setRequired(true))
  .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the kick'));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'KickMembers', 'Kick Members'))) return;

  const target = interaction.options.getMember('user');
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  if (!target || typeof target === 'string') {
    await interaction.reply({ embeds: [errorEmbed('Could not find that member.')], ephemeral: true });
    return;
  }

  if (!('kickable' in target) || !target.kickable) {
    await interaction.reply({ embeds: [errorEmbed('I cannot kick this member.')], ephemeral: true });
    return;
  }

  try {
    await target.kick(reason);
    await logModAction(interaction.client, {
      action: 'Kick',
      moderator: interaction.user.tag,
      target: target.user.tag,
      reason,
    });
    await interaction.reply({
      embeds: [successEmbed('✅ Member Kicked', `**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`)],
    });
  } catch {
    await interaction.reply({ embeds: [errorEmbed('Failed to kick the member.')], ephemeral: true });
  }
}
