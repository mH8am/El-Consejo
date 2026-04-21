import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { requirePermission } from '../../../utils/permissions';
import { logModAction } from '../../../services/modLogger';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Timeout a member for a set duration')
  .addUserOption((opt) => opt.setName('user').setDescription('User to mute').setRequired(true))
  .addIntegerOption((opt) =>
    opt.setName('duration').setDescription('Duration in minutes').setRequired(true).setMinValue(1).setMaxValue(40320)
  )
  .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the mute'));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'ModerateMembers', 'Moderate Members'))) return;

  const targetUser = interaction.options.getUser('user', true);
  const duration = interaction.options.getInteger('duration', true);
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  const member = interaction.guild?.members.cache.get(targetUser.id);
  if (!member) {
    await interaction.reply({ embeds: [errorEmbed('Could not find that member.')], ephemeral: true });
    return;
  }

  if (!member.moderatable) {
    await interaction.reply({ embeds: [errorEmbed('I cannot mute this member.')], ephemeral: true });
    return;
  }

  try {
    await member.timeout(duration * 60_000, reason);

    await logModAction(interaction.client, {
      action: 'Mute (Timeout)',
      moderator: interaction.user.tag,
      target: targetUser.tag,
      reason: `${reason} | Duration: ${duration}m`,
    });

    await interaction.reply({
      embeds: [
        successEmbed(
          '✅ Member Muted',
          `**${targetUser.tag}** has been timed out for **${duration} minute(s)**.\n**Reason:** ${reason}`
        ),
      ],
    });
  } catch {
    await interaction.reply({ embeds: [errorEmbed('Failed to mute the member.')], ephemeral: true });
  }
}
