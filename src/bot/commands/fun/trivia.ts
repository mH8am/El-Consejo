import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { awardXPToUser } from '../../../services/xpService';
import { XP_CONFIG } from '../../../config';

interface TriviaQuestion {
  question: string;
  correct: string;
  options: string[];
}

const QUESTIONS: TriviaQuestion[] = [
  {
    question: 'What was the first programming language?',
    correct: 'Fortran',
    options: ['COBOL', 'Fortran', 'Assembly', 'BASIC'],
  },
  {
    question: 'How many sides does a hexagon have?',
    correct: '6',
    options: ['5', '6', '7', '8'],
  },
  {
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
    question: "What year was Discord officially launched?",
    correct: '2015',
    options: ['2013', '2014', '2015', '2016'],
  },
  {
    question: 'Which planet is known as the Red Planet?',
    correct: 'Mars',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
  },
];

export const data = new SlashCommandBuilder()
  .setName('trivia')
  .setDescription('Answer a trivia question for XP');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);

  const buttons = shuffled.map((opt) =>
    new ButtonBuilder()
      .setCustomId(`trivia_${opt}`)
      .setLabel(opt)
      .setStyle(ButtonStyle.Secondary)
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧠 Trivia Time!')
    .setDescription(`**${q.question}**`)
    .setFooter({ text: 'You have 30 seconds to answer!' });

  await interaction.reply({ embeds: [embed], components: [row] });

  const msg = await interaction.fetchReply();
  const collector = msg.createMessageComponentCollector({ time: 30_000, max: 1 });

  collector.on('collect', async (btnInteraction) => {
    const chosen = btnInteraction.customId.replace('trivia_', '');
    const correct = chosen === q.correct;

    if (correct) {
      await awardXPToUser(btnInteraction.client, btnInteraction.user.id, btnInteraction.channelId, XP_CONFIG.triviaReward);
    }

    await btnInteraction.reply({
      content: correct
        ? `✅ Correct! The answer was **${q.correct}**.`
        : `❌ Wrong! The correct answer was **${q.correct}**.`,
      ephemeral: true,
    });

    const updated = EmbedBuilder.from(embed)
      .setColor(correct ? 0x57f287 : 0xed4245)
      .setFooter({ text: `Answered by ${btnInteraction.user.tag}` });

    await interaction.editReply({ embeds: [updated], components: [] });
  });

  collector.on('end', async (collected) => {
    if (collected.size === 0) {
      const expired = EmbedBuilder.from(embed)
        .setColor(0xffa500)
        .setFooter({ text: `Time's up! The answer was: ${q.correct}` });
      await interaction.editReply({ embeds: [expired], components: [] });
    }
  });
}
