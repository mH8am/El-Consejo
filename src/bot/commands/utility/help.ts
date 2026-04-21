import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { client } from '../../client';
import { errorEmbed } from '../../../utils/embeds';

// Infer display category from command name when no explicit category is set
const CATEGORY_MAP: Record<string, string> = {
  lol: 'League of Legends',
  addplayer: 'League of Legends',
  removeplayer: 'League of Legends',
  profile: 'League of Legends',
  tracked: 'League of Legends',
  ban: 'Moderation',
  kick: 'Moderation',
  mute: 'Moderation',
  unmute: 'Moderation',
  warn: 'Moderation',
  warnings: 'Moderation',
  giveaway: 'Fun',
  leaderboard: 'Fun',
  trivia: 'Fun',
  poll: 'Utility',
  remind: 'Utility',
  serverinfo: 'Utility',
  userinfo: 'Utility',
  help: 'Utility',
};

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('List all commands or get details on a specific one')
  .addStringOption((opt) =>
    opt.setName('command').setDescription('Command name for detailed info')
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const commandName = interaction.options.getString('command');

  if (commandName) {
    const cmd = client.commands.get(commandName);
    if (!cmd) {
      await interaction.reply({ embeds: [errorEmbed(`No command named \`${commandName}\` found.`)], flags: MessageFlags.Ephemeral });
      return;
    }
    const desc = (cmd.data as { description?: string }).description ?? 'No description.';
    const cooldown = cmd.cooldown ? `${cmd.cooldown}s` : 'None';
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`/${commandName}`)
      .setDescription(desc)
      .addFields({ name: 'Cooldown', value: cooldown, inline: true })
      .setTimestamp();
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  // Group commands by category
  const groups = new Map<string, string[]>();
  for (const [name, cmd] of client.commands) {
    const category = cmd.category ?? CATEGORY_MAP[name] ?? 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(`\`/${name}\``);
  }

  const categoryOrder = ['League of Legends', 'Moderation', 'Utility', 'Fun', 'Other'];
  const fields = categoryOrder
    .filter((cat) => groups.has(cat))
    .map((cat) => ({ name: cat, value: groups.get(cat)!.sort().join('  '), inline: false }));

  // Any remaining categories not in the order list
  for (const [cat, cmds] of groups) {
    if (!categoryOrder.includes(cat)) {
      fields.push({ name: cat, value: cmds.sort().join('  '), inline: false });
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('El Consejo — Command List')
    .setDescription(`Use \`/help <command>\` for details on a specific command.\n\`${client.commands.size}\` commands available.`)
    .addFields(fields)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
