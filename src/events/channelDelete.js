const { Events, AuditLogEvent } = require('discord.js');
const { GuildConfig } = require('../models');

// In-Memory Tracker (Self-contained)
const nukeTracker = new Map();

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!channel.guild) return;

    // 1. Check if Anti-Nuke is ON in DB
    const config = await GuildConfig.findOne({ guildId: channel.guild.id });
    // Note: Adjust 'security.antiNuke' path if your DB structure is different
    if (!config || !config.security || !config.security.antiNuke) return;

    try {
      // 2. Fetch Logs
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1,
      });

      const log = auditLogs.entries.first();
      if (!log) return;
      
      const { executor } = log;
      
      // Safety: Ignore Bot and Owner
      if (executor.id === channel.client.user.id) return;
      if (executor.id === channel.guild.ownerId) return;

      // 3. Logic: 3 Deletions in 10 Seconds
      const now = Date.now();
      const userData = nukeTracker.get(executor.id) || [];
      const recentActions = userData.filter(t => now - t < 10000);

      recentActions.push(now);
      nukeTracker.set(executor.id, recentActions);

      if (recentActions.length >= 3) {
          console.log(`[ANTI-NUKE] Banning ${executor.tag}`);
          
          // BAN
          await channel.guild.members.ban(executor.id, { reason: 'Anti-Nuke: Mass Channel Deletion' });
          
          // Clear tracker
          nukeTracker.delete(executor.id);
      }

    } catch (error) {
      console.error('Channel delete anti-nuke error:', error);
    }
  },
};
