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
    opt.setName('winners').setDescription('Number of winners (default 1)').setMinValue(1).setMaxValue(10)
  );

function buildGiveawayEmbed(prize: string, endsAt: number, winnersCount: number, entryCount: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle(`🎉 Giveaway`)
    .setDescription(`## ${prize}`)
    .addFields(
      { name: '⏰ Ends', value: `<t:${Math.floor(endsAt / 1000)}:R>`, inline: true },
      { name: '🏆 Winners', value: `${winnersCount}`, inline: true },
      { name: '🎫 Entries', value: `${entryCount}`, inline: true }
    )
    .setFooter({ text: 'Click the button below to enter' })
    .setTimestamp(endsAt);
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requirePermission(interaction, 'ManageGuild', 'Manage Server'))) return;

  const prize = interaction.options.getString('prize', true);
  const durationMin = interaction.options.getInteger('duration', true);
  const winnersCount = interaction.options.getInteger('winners') ?? 1;
  const endsAt = Date.now() + durationMin * 60_000;

  const button = new ButtonBuilder()
    .setCustomId('giveaway_enter')
    .setLabel('Enter Giveaway')
    .setEmoji('🎉')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  const embed = buildGiveawayEmbed(prize, endsAt, winnersCount, 0);
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

      await btnInteraction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('✅ You\'re in!')
            .setDescription(`You've entered the **${prize}** giveaway. Good luck!`)
        ],
        ephemeral: true,
      });

      // Update live entry count
      await interaction.editReply({
        embeds: [buildGiveawayEmbed(prize, endsAt, winnersCount, g.entries.length)],
        components: [row],
      });
    } else {
      await btnInteraction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('⚠️ Already Entered')
            .setDescription(`You already have an entry in the **${prize}** giveaway.`)
        ],
        ephemeral: true,
      });
    }
  });

  collector.on('end', async () => {
    const g = activeGiveaways.get(msg.id);
    if (!g) return;
    activeGiveaways.delete(msg.id);

    const channel = interaction.client.channels.cache.get(g.channelId) as TextChannel | undefined;
    if (!channel) return;

    if (g.entries.length === 0) {
      const noEntries = new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle('🎉 Giveaway Ended')
        .setDescription(`**${prize}**\n\nNo one entered. Better luck next time!`)
        .setTimestamp();
      await channel.send({ embeds: [noEntries] });

      await interaction.editReply({
        embeds: [buildGiveawayEmbed(prize, endsAt, winnersCount, 0).setColor(0x95a5a6).setFooter({ text: 'Giveaway ended — no entries' })],
        components: [],
      });
      return;
    }

    const shuffled = [...g.entries].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, Math.min(g.winners, shuffled.length));
    const mentions = drawn.map((id) => `<@${id}>`).join(', ');

    const winnerEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎉 Giveaway — Winners Announced!')
      .setDescription(`**${prize}**`)
      .addFields(
        { name: `🏆 Winner${drawn.length > 1 ? 's' : ''}`, value: mentions },
        { name: '🎫 Total Entries', value: `${g.entries.length}` }
      )
      .setTimestamp();

    await channel.send({ embeds: [winnerEmbed] });

    // Update original embed to closed state
    await interaction.editReply({
      embeds: [
        buildGiveawayEmbed(prize, endsAt, winnersCount, g.entries.length)
          .setColor(0x95a5a6)
          .setFooter({ text: `Ended · Winner${drawn.length > 1 ? 's' : ''}: ${drawn.map(id => `<@${id}>`).join(', ')}` }),
      ],
      components: [],
    }).catch(() => { /* interaction may be expired */ });

    try {
      for (const winnerId of drawn) {
        const user = await interaction.client.users.fetch(winnerId);
        await user.send(`🎉 Congratulations! You won **${prize}** in **${interaction.guild?.name}**!`).catch(() => {});
      }
    } catch (err) {
      log('error', `Failed to DM giveaway winner: ${(err as Error).message}`);
    }
  });
}
