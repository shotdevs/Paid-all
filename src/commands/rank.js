const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { Leveling } = require('../models');
const canvacord = require('canvacord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your current level and XP card.')
    .addUserOption(option => option.setName('user').setDescription('The user to check')),
  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('user') || interaction.user;

    const userLevel = await Leveling.findOne({
      guildId: interaction.guild.id,
      userId: target.id,
    });

    if (!userLevel) {
      return interaction.editReply({ content: 'This user has not earned any XP yet.' });
    }

    // Your Custom Formula
    const xpToNextLevel = 5 * (userLevel.level ** 2) + 50 * userLevel.level + 100;

    // Get user rank position
    const allUsers = await Leveling.find({ guildId: interaction.guild.id }).sort({ level: -1, xp: -1 });
    const rankPos = allUsers.findIndex(u => u.userId === target.id) + 1;

    // Build the Card
    const rank = new canvacord.Rank()
        .setAvatar(target.displayAvatarURL({ extension: 'png', forceStatic: true }))
        .setCurrentXP(userLevel.xp)
        .setRequiredXP(xpToNextLevel)
        .setLevel(userLevel.level)
        .setRank(rankPos, "RANK")
        .setStatus(interaction.guild.members.cache.get(target.id)?.presence?.status || 'offline')
        .setUsername(target.username)
        .setProgressBar("#00BFFF", "COLOR");

    const data = await rank.build();
    const attachment = new AttachmentBuilder(data, { name: 'rank.png' });

    await interaction.editReply({ files: [attachment] });
  },
};
