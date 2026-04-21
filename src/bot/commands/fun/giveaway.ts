import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { GiveawayEntry } from '../../../typings/index';
import { log } from '../../../utils/logger';
import { requirePermission } from '../../../utils/permissions';
import { errorEmbed } from '../../../utils/embeds';

const activeGiveaways = new Map<string, GiveawayEntry>();

export const data = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Start a giveaway')
  .addStringOption((opt) => opt.setName('prize').setDescription('The prize to give away').setRequired(true))
  .addIntegerOption((opt) =>
    opt
      .setName('duration')
      .setDescription('Duration in minutes')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10080)
  )
  .addIntegerOption((opt) =>
    opt.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(10)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'ManageGuild', 'Manage Server'))) return;

  const prize = interaction.options.getString('prize', true);
  const durationMin = interaction.options.getInteger('duration', true);
  const winnersCount = interaction.options.getInteger('winners') ?? 1;
  const endsAt = Date.now() + durationMin * 60_000;

  const button = new ButtonBuilder()
    .setCustomId('giveaway_enter')
    .setLabel('🎉 Enter')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle(`🎉 Giveaway — ${prize}`)
    .setDescription(`Click the button below to enter!\n\n⏰ Ends: <t:${Math.floor(endsAt / 1000)}:R>\n🏆 Winners: **${winnersCount}**`)
    .setTimestamp(endsAt);

  const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

  const giveaway: GiveawayEntry = {
    messageId: msg.id,
    channelId: interaction.channelId,
    prize,
    winners: winnersCount,
    endsAt,
    entries: [],
  };

  activeGiveaways.set(msg.id, giveaway);

  const collector = msg.createMessageComponentCollector({ time: durationMin * 60_000 });

  collector.on('collect', async (btnInteraction) => {
    if (btnInteraction.customId !== 'giveaway_enter') return;
    const g = activeGiveaways.get(msg.id)!;
    if (!g.entries.includes(btnInteraction.user.id)) {
      g.entries.push(btnInteraction.user.id);
      await btnInteraction.reply({ content: '✅ You have entered the giveaway!', ephemeral: true });
    } else {
      await btnInteraction.reply({ content: '⚠️ You have already entered.', ephemeral: true });
    }
  });

  collector.on('end', async () => {
    const g = activeGiveaways.get(msg.id);
    if (!g) return;
    activeGiveaways.delete(msg.id);

    const channel = interaction.client.channels.cache.get(g.channelId) as TextChannel | undefined;
    if (!channel) return;

    if (g.entries.length === 0) {
      await channel.send('🎉 The giveaway ended with no entries.');
      return;
    }

    const shuffled = [...g.entries].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, Math.min(g.winners, shuffled.length));
    const mentions = drawn.map((id) => `<@${id}>`).join(', ');

    await channel.send(`🎉 Congratulations ${mentions}! You won **${g.prize}**!`);
  });
}
