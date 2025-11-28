const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { AntiNuke } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Configure anti-nuke security settings.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable anti-nuke protection.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable anti-nuke protection.')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('log-channel')
        .setDescription('Set the anti-nuke log channel.')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel for anti-nuke logs.')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('anti-bot')
        .setDescription('Configure bot auto-kick settings.')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable bot auto-kick.')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action to take on bot add.')
            .addChoices(
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('anti-spam')
        .setDescription('Configure anti-spam settings.')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable anti-spam.')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('max-messages')
            .setDescription('Max messages allowed in time window (default: 4).')
            .setMinValue(2)
            .setMaxValue(20)
        )
        .addIntegerOption(option =>
          option
            .setName('time-window')
            .setDescription('Time window in seconds (default: 2).')
            .setMinValue(1)
            .setMaxValue(60)
        )
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action to take on spam.')
            .addChoices(
              { name: 'Timeout (24h)', value: 'timeout' },
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('anti-raid')
        .setDescription('Configure anti-raid settings.')
        .addBooleanOption(option =>
          option
            .setName('enabled')
            .setDescription('Enable or disable anti-raid.')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('max-joins')
            .setDescription('Max joins allowed in time window (default: 10).')
            .setMinValue(3)
            .setMaxValue(50)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View current anti-nuke settings.')
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let antiNuke = await AntiNuke.findOne({ guildId });
    if (!antiNuke) {
      antiNuke = new AntiNuke({ guildId });
      await antiNuke.save();
    }

    if (subcommand === 'enable') {
      antiNuke.enabled = true;
      await antiNuke.save();
      await interaction.reply({
        content: '🛡️ Anti-nuke protection has been **enabled**.',
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'disable') {
      antiNuke.enabled = false;
      await antiNuke.save();
      await interaction.reply({
        content: '⚠️ Anti-nuke protection has been **disabled**.',
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'log-channel') {
      const channel = interaction.options.getChannel('channel');
      antiNuke.logChannel = channel.id;
      await antiNuke.save();
      await interaction.reply({
        content: `✅ Anti-nuke log channel set to ${channel}.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'anti-bot') {
      const enabled = interaction.options.getBoolean('enabled');
      const action = interaction.options.getString('action');
      
      antiNuke.antiBot.enabled = enabled;
      if (action) antiNuke.antiBot.action = action;
      await antiNuke.save();

      await interaction.reply({
        content: `✅ Anti-bot protection ${enabled ? 'enabled' : 'disabled'}${action ? ` with action: ${action}` : ''}.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'anti-spam') {
      const enabled = interaction.options.getBoolean('enabled');
      const maxMessages = interaction.options.getInteger('max-messages');
      const timeWindow = interaction.options.getInteger('time-window');
      const action = interaction.options.getString('action');

      antiNuke.antiSpam.enabled = enabled;
      if (maxMessages) antiNuke.antiSpam.maxMessages = maxMessages;
      if (timeWindow) antiNuke.antiSpam.timeWindow = timeWindow * 1000;
      if (action) antiNuke.antiSpam.action = action;
      await antiNuke.save();

      await interaction.reply({
        content: `✅ Anti-spam ${enabled ? 'enabled' : 'disabled'}. Settings updated.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'anti-raid') {
      const enabled = interaction.options.getBoolean('enabled');
      const maxJoins = interaction.options.getInteger('max-joins');

      antiNuke.antiRaid.enabled = enabled;
      if (maxJoins) antiNuke.antiRaid.maxJoins = maxJoins;
      await antiNuke.save();

      await interaction.reply({
        content: `✅ Anti-raid ${enabled ? 'enabled' : 'disabled'}${maxJoins ? ` with max joins: ${maxJoins}` : ''}.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommand === 'status') {
      const status = `**🛡️ Anti-Nuke Status**\n\n` +
        `**Enabled:** ${antiNuke.enabled ? '✅' : '❌'}\n` +
        `**Log Channel:** ${antiNuke.logChannel ? `<#${antiNuke.logChannel}>` : 'Not set'}\n` +
        `**Whitelisted Users:** ${antiNuke.whitelistedUsers.length}\n\n` +
        `**Anti-Bot:** ${antiNuke.antiBot.enabled ? '✅' : '❌'} (${antiNuke.antiBot.action})\n` +
        `**Anti-Spam:** ${antiNuke.antiSpam.enabled ? '✅' : '❌'} (${antiNuke.antiSpam.maxMessages} msgs/${antiNuke.antiSpam.timeWindow}ms)\n` +
        `**Anti-Raid:** ${antiNuke.antiRaid.enabled ? '✅' : '❌'} (${antiNuke.antiRaid.maxJoins} joins)\n` +
        `**Anti-Channel Spam:** ${antiNuke.antiChannelSpam.enabled ? '✅' : '❌'}\n` +
        `**Anti-Role Spam:** ${antiNuke.antiRoleSpam.enabled ? '✅' : '❌'}`;

      await interaction.reply({
        content: status,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
