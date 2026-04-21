import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { errorEmbed, formatMinutes } from '../../../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('remind')
  .setDescription('Set a personal reminder')
  .addIntegerOption((opt) =>
    opt.setName('minutes').setDescription('How many minutes until the reminder').setRequired(true).setMinValue(1).setMaxValue(10080)
  )
  .addStringOption((opt) =>
    opt.setName('message').setDescription('What to remind you about').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const minutes = interaction.options.getInteger('minutes', true);
  const message = interaction.options.getString('message', true);

  if (message.length > 500) {
    await interaction.reply({ embeds: [errorEmbed('Reminder message must be 500 characters or fewer.')], flags: MessageFlags.Ephemeral });
    return;
  }

  const firesAt = Math.floor((Date.now() + minutes * 60_000) / 1000);
  const humanTime = formatMinutes(minutes);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('⏰ Reminder Set')
        .setDescription(`I'll remind you in **${humanTime}**.\n\n> ${message}`)
        .addFields({ name: 'Fires at', value: `<t:${firesAt}:t> · <t:${firesAt}:R>`, inline: true })
        .setTimestamp()
    ],
    flags: MessageFlags.Ephemeral,
  });

  setTimeout(async () => {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('⏰ Reminder!')
      .setDescription(`> ${message}`)
      .setFooter({ text: 'Set via /remind' })
      .setTimestamp();

    try {
      await interaction.user.send({ embeds: [dmEmbed] });
    } catch {
      // DMs closed — try the channel
      try {
        await interaction.followUp({
          content: `${interaction.user}`,
          embeds: [dmEmbed],
          flags: MessageFlags.Ephemeral,
        });
      } catch {
        // Interaction token expired — silently ignore
      }
    }
  }, minutes * 60_000);
}
