const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, AttachmentBuilder } = require('discord.js');
const { WelcomeSettings } = require('../models');
const { NewWelcomeCard } = require('pixel-cards');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Test the welcome message configuration.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const settings = await WelcomeSettings.findOne({ guildId });

    if (!settings || !settings.welcomeChannelId) {
      return interaction.reply({
        content: 'Welcome system is not configured. Use `/setup-welcome` first.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.guild.channels.cache.get(settings.welcomeChannelId);
    if (!channel) {
      return interaction.reply({
        content: 'Welcome channel not found. Please reconfigure using `/setup-welcome`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const message = settings.welcomeMessage || 'Welcome {{user}} to the server!';
    const formattedMessage = message.replace(/{{user}}/g, interaction.user.toString());

    try {
      const card = await NewWelcomeCard({
        username: interaction.user.username,
        userPosition: 'New Member',
        avatar: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
        backgroundImage: settings.welcomeBackgroundImage,
      });

      const attachment = new AttachmentBuilder(card, { name: 'welcome.png' });

      await channel.send({
        content: formattedMessage,
        files: [attachment],
      });

      await interaction.reply({
        content: `Test welcome message sent to ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await interaction.reply({
        content: 'Failed to send test welcome message. Check bot permissions.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};