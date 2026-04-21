import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Display a user\'s profile, roles, and join date')
  .addUserOption((opt) => opt.setName('user').setDescription('User to look up (defaults to yourself)'));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser('user') ?? interaction.user;
  const member = interaction.guild?.members.cache.get(target.id);

  const roles = member?.roles.cache
    .filter((r) => r.id !== interaction.guild?.id)
    .sort((a, b) => b.position - a.position)
    .map((r) => r.toString())
    .slice(0, 10)
    .join(', ') || 'None';

  const embed = new EmbedBuilder()
    .setColor(member?.displayHexColor ?? 0x5865f2)
    .setTitle(`👤 ${target.tag}`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: '🆔 User ID', value: target.id, inline: true },
      { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
      {
        name: '📥 Joined Server',
        value: member?.joinedTimestamp
          ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`
          : 'Unknown',
        inline: true,
      },
      { name: '🎭 Roles', value: roles }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
