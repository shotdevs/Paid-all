const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Leveling, VcTime } = require('../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('See the top users on the server.')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Choose leaderboard type')
        .setRequired(true)
        .addChoices(
          { name: 'Text Levels', value: 'text' },
          { name: 'Voice Stats', value: 'voice' }
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const type = interaction.options.getString('type');
    const isVoice = type === 'voice';

    // 1. Fetch Data
    let leaderboard;
    if (isVoice) {
        // Sort by Voice Level first, then Voice XP
        leaderboard = await VcTime.find({ guildId: interaction.guild.id })
            .sort({ voiceLevel: -1, voiceXp: -1 })
            .limit(50); // Get top 50 for pagination
    } else {
        // Sort by Text Level first, then XP
        leaderboard = await Leveling.find({ guildId: interaction.guild.id })
            .sort({ level: -1, xp: -1 })
            .limit(50);
    }

    if (!leaderboard.length) {
      return interaction.editReply({ content: `No one is on the **${type}** leaderboard yet.` });
    }

    // 2. Pagination Helper
    const generateEmbed = (start) => {
        const current = leaderboard.slice(start, start + 10);
        
        const stringMap = current.map((user, index) => {
            const pos = start + index + 1;
            if (isVoice) {
                // Convert ms to hours
                const hours = (user.timeInVC / (1000 * 60 * 60)).toFixed(1);
                return `**${pos}.** <@${user.userId}>\n> 🎙️ Lvl ${user.voiceLevel || 0} • ${hours} Hours`;
            } else {
                return `**${pos}.** <@${user.userId}>\n> 📝 Lvl ${user.level} • ${user.xp} XP`;
            }
        }).join('\n\n');

        return new EmbedBuilder()
            .setTitle(`🏆 Server Leaderboard (${isVoice ? 'Voice' : 'Text'})`)
            .setDescription(stringMap)
            .setColor(isVoice ? '#FF5555' : '#5555FF')
            .setFooter({ text: `Page ${Math.floor(start / 10) + 1}` });
    };

    // 3. Create Buttons
    const getRow = (currentIndex) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('◀')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex + 10 >= leaderboard.length)
        );
    };

    let currentIndex = 0;
    const msg = await interaction.editReply({
        embeds: [generateEmbed(0)],
        components: leaderboard.length > 10 ? [getRow(0)] : []
    });

    if (leaderboard.length <= 10) return;

    // 4. Handle Button Clicks
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: 'Not your command.', ephemeral: true });

        if (i.customId === 'prev') currentIndex -= 10;
        else currentIndex += 10;

        await i.update({
            embeds: [generateEmbed(currentIndex)],
            components: [getRow(currentIndex)]
        });
    });

    collector.on('end', () => interaction.editReply({ components: [] }));
  },
};
