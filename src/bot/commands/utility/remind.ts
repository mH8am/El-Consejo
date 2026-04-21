import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../../utils/embeds';

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

  await interaction.reply({
    embeds: [successEmbed('⏰ Reminder Set', `I will remind you about: **${message}** in **${minutes} minute(s)**.`)],
    ephemeral: true,
  });

  setTimeout(async () => {
    try {
      await interaction.user.send(`⏰ **Reminder!**\n${message}`);
    } catch {
      // DMs closed — try the channel
      try {
        await interaction.followUp({
          content: `${interaction.user} ⏰ **Reminder:** ${message}`,
          ephemeral: true,
        });
      } catch {
        // Ignore if the interaction token is expired
      }
    }
  }, minutes * 60_000);
}
