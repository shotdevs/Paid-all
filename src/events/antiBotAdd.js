const { Events, AuditLogEvent } = require('discord.js');
const { AntiNuke } = require('../models');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (!member.user.bot) return;

    const antiNuke = await AntiNuke.findOne({ guildId: member.guild.id });
    if (!antiNuke || !antiNuke.enabled || !antiNuke.antiBot.enabled) return;

    try {
      const auditLogs = await member.guild.fetchAuditLogs({
        type: AuditLogEvent.BotAdd,
        limit: 1,
      });

      const botAddLog = auditLogs.entries.first();
      if (!botAddLog) return;

      const { executor } = botAddLog;
      if (!executor) return;

      if (antiNuke.whitelistedUsers.includes(executor.id)) {
        return;
      }

      if (member.guild.ownerId === executor.id) {
        return;
      }

      if (antiNuke.antiBot.action === 'kick') {
        await member.kick('Anti-Nuke: Bot added by non-whitelisted user');
      } else if (antiNuke.antiBot.action === 'ban') {
        await member.ban({ reason: 'Anti-Nuke: Bot added by non-whitelisted user' });
      }

      if (antiNuke.logChannel) {
        const logChannel = member.guild.channels.cache.get(antiNuke.logChannel);
        if (logChannel) {
          await logChannel.send({
            content: `🛡️ **Anti-Nuke Alert**\n\n**Action:** Bot ${antiNuke.antiBot.action}ed\n**Bot:** ${member.user.tag} (${member.id})\n**Added by:** ${executor.tag} (${executor.id})\n**Reason:** Non-whitelisted user added a bot\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
          });
        }
      }
    } catch (error) {
      console.error('Anti-Nuke bot check error:', error);
    }
  },
};
