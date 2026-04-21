import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { requirePermission } from '../../../utils/permissions';
import { clearWarns, getWarns } from '../../../services/moderation';
import { errorEmbed, infoEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('View or clear warnings for a member')
  .addUserOption((opt) => opt.setName('user').setDescription('Member to check').setRequired(true))
  .addBooleanOption((opt) =>
    opt.setName('clear').setDescription('Clear all warnings for this member (moderator only)')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'ModerateMembers', 'Moderate Members'))) return;

  const targetUser = interaction.options.getUser('user', true);
  const shouldClear = interaction.options.getBoolean('clear') ?? false;

  if (shouldClear) {
    clearWarns(interaction.guildId!, targetUser.id);
    await interaction.reply({
      embeds: [infoEmbed('Warnings Cleared', `All warnings for **${targetUser.tag}** have been cleared.`)],
      ephemeral: true,
    });
    return;
  }

  const warns = getWarns(interaction.guildId!, targetUser.id);

  if (warns.length === 0) {
    await interaction.reply({
      embeds: [infoEmbed('No Warnings', `**${targetUser.tag}** has no warnings on record.`)],
      ephemeral: true,
    });
    return;
  }

  const fields = warns.map((w, i) => ({
    name: `Warning #${i + 1} — <t:${Math.floor(w.timestamp / 1000)}:R>`,
    value: `**Reason:** ${w.reason}\n**By:** ${w.moderatorTag}`,
  }));

  const embed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
    .setDescription(`**${warns.length}** warning${warns.length !== 1 ? 's' : ''} on record.`)
    .addFields(fields.slice(0, 25))
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}