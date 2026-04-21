import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { errorEmbed } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a poll with live vote tallying')
  .addStringOption((opt) => opt.setName('question').setDescription('Poll question').setRequired(true))
  .addStringOption((opt) =>
    opt
      .setName('options')
      .setDescription('Comma-separated options (2–5), e.g. Yes,No,Maybe')
      .setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt
      .setName('duration')
      .setDescription('Poll duration in minutes (1–60, default 5)')
      .setMinValue(1)
      .setMaxValue(60)
  );

function buildEmbed(
  question: string,
  options: string[],
  votes: Map<number, Set<string>>,
  author: string,
  closed = false
): EmbedBuilder {
  const totalVotes = Array.from(votes.values()).reduce((sum, set) => sum + set.size, 0);
  const description = options
    .map((opt, i) => {
      const count = votes.get(i)?.size ?? 0;
      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
      return `**${opt}**\n${bar} ${count} vote${count !== 1 ? 's' : ''} (${pct}%)`;
    })
    .join('\n\n');

  return new EmbedBuilder()
    .setColor(closed ? 0x95a5a6 : 0x5865f2)
    .setTitle(`📊 ${question}`)
    .setDescription(description)
    .setFooter({ text: `Poll by ${author} • ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}${closed ? ' • Closed' : ''}` })
    .setTimestamp();
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const question = interaction.options.getString('question', true);
  const rawOptions = interaction.options.getString('options', true);
  const durationMin = interaction.options.getInteger('duration') ?? 5;
  const options = rawOptions.split(',').map((o) => o.trim()).filter(Boolean).slice(0, 5);

  if (options.length < 2) {
    await interaction.reply({
      embeds: [errorEmbed('Please provide at least 2 comma-separated options.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // votes[optionIndex] = Set of userIds who voted for that option
  const votes = new Map<number, Set<string>>(options.map((_, i) => [i, new Set()]));
  // userVote[userId] = optionIndex they last voted for
  const userVote = new Map<string, number>();

  const pollId = interaction.id;
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const buttonsPerRow = 5;

  for (let i = 0; i < options.length; i += buttonsPerRow) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      options.slice(i, i + buttonsPerRow).map((opt, j) =>
        new ButtonBuilder()
          .setCustomId(`poll_${pollId}_${i + j}`)
          .setLabel(opt.length > 80 ? opt.slice(0, 77) + '...' : opt)
          .setStyle(ButtonStyle.Primary)
      )
    );
    rows.push(row);
  }

  const embed = buildEmbed(question, options, votes, interaction.user.tag);
  await interaction.reply({ embeds: [embed], components: rows });

  const msg = await interaction.fetchReply();
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (btn) => btn.customId.startsWith(`poll_${pollId}_`),
    time: durationMin * 60_000,
  });

  collector.on('collect', async (btn) => {
    const optionIndex = parseInt(btn.customId.split('_').pop()!, 10);
    const userId = btn.user.id;
    const prev = userVote.get(userId);

    if (prev === optionIndex) {
      // Toggle off — remove vote
      votes.get(optionIndex)?.delete(userId);
      userVote.delete(userId);
    } else {
      // Move vote (or cast new vote)
      if (prev !== undefined) votes.get(prev)?.delete(userId);
      votes.get(optionIndex)?.add(userId);
      userVote.set(userId, optionIndex);
    }

    await btn.update({
      embeds: [buildEmbed(question, options, votes, interaction.user.tag)],
      components: rows,
    });
  });

  collector.on('end', async () => {
    await interaction.editReply({
      embeds: [buildEmbed(question, options, votes, interaction.user.tag, true)],
      components: [],
    });
  });
}
