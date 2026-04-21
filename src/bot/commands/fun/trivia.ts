import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { awardXPToUser } from '../../../services/xpService';
import { XP_CONFIG } from '../../../config';

interface TriviaQuestion {
  question: string;
  correct: string;
  options: string[];
  category: string;
}

const QUESTIONS: TriviaQuestion[] = [
  {
    category: '💻 Technology',
    question: 'What was the first high-level programming language?',
    correct: 'Fortran',
    options: ['COBOL', 'Fortran', 'Assembly', 'BASIC'],
  },
  {
    category: '📐 Math',
    question: 'How many sides does a hexagon have?',
    correct: '6',
    options: ['5', '6', '7', '8'],
  },
  {
    category: '🌐 Internet',
    question: 'What does HTTP stand for?',
    correct: 'HyperText Transfer Protocol',
    options: [
      'HyperText Transfer Protocol',
      'High Transfer Text Process',
      'Hyper Transport Text Protocol',
      'Host Transfer Text Protocol',
    ],
  },
  {
    category: '💬 Discord',
    question: 'What year was Discord officially launched?',
    correct: '2015',
    options: ['2013', '2014', '2015', '2016'],
  },
  {
    category: '🌌 Science',
    question: 'Which planet is known as the Red Planet?',
    correct: 'Mars',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
  },
  {
    category: '🌐 Internet',
    question: 'What does "WWW" stand for?',
    correct: 'World Wide Web',
    options: ['World Wide Web', 'Wide World Web', 'World Web Wide', 'Web World Wide'],
  },
  {
    category: '💻 Technology',
    question: 'How many bits are in a byte?',
    correct: '8',
    options: ['4', '8', '16', '32'],
  },
  {
    category: '🌍 Geography',
    question: 'What is the capital of Japan?',
    correct: 'Tokyo',
    options: ['Osaka', 'Tokyo', 'Kyoto', 'Hiroshima'],
  },
];

export const data = new SlashCommandBuilder()
  .setName('trivia')
  .setDescription('Answer a trivia question and earn XP');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);

  const buttons = shuffled.map((opt) =>
    new ButtonBuilder()
      .setCustomId(`trivia_${opt}`)
      .setLabel(opt.length > 80 ? opt.slice(0, 77) + '...' : opt)
      .setStyle(ButtonStyle.Secondary)
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: q.category })
    .setTitle('🧠 Trivia')
    .setDescription(`## ${q.question}`)
    .setFooter({ text: `30 seconds · Correct answer earns +${XP_CONFIG.triviaReward} XP` });

  await interaction.reply({ embeds: [embed], components: [row] });

  const msg = await interaction.fetchReply();
  const collector = msg.createMessageComponentCollector({ time: 30_000, max: 1 });

  collector.on('collect', async (btnInteraction) => {
    const chosen = btnInteraction.customId.replace('trivia_', '');
    const correct = chosen === q.correct;

    if (correct) {
      await awardXPToUser(btnInteraction.client, btnInteraction.user.id, btnInteraction.channelId, XP_CONFIG.triviaReward);
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(correct ? 0x57f287 : 0xed4245)
      .setTitle(correct ? '✅ Correct!' : '❌ Wrong!')
      .setDescription(
        correct
          ? `The answer was **${q.correct}**.\nYou earned **+${XP_CONFIG.triviaReward} XP**!`
          : `The correct answer was **${q.correct}**.`
      );

    await btnInteraction.reply({ embeds: [resultEmbed], flags: MessageFlags.Ephemeral });

    const updated = EmbedBuilder.from(embed)
      .setColor(correct ? 0x57f287 : 0xed4245)
      .setFooter({ text: `Answered by ${btnInteraction.user.tag}${correct ? ` · +${XP_CONFIG.triviaReward} XP awarded` : ''}` });

    await interaction.editReply({ embeds: [updated], components: [] });
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      const expired = EmbedBuilder.from(embed)
        .setColor(0x95a5a6)
        .setFooter({ text: `Time's up! The answer was: ${q.correct}` });
      await interaction.editReply({ embeds: [expired], components: [] });
    }
  });
}
