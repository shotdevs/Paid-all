const { Events, AuditLogEvent } = require('discord.js');
const { AntiNuke } = require('../models');

const channelActions = new Map();
const roleActions = new Map();

async function checkChannelSpam(guild, executor) {
    const antiNuke = await AntiNuke.findOne({ guildId: guild.id });
    if (!antiNuke || !antiNuke.enabled || !antiNuke.antiChannelSpam.enabled) return false;

    if (antiNuke.whitelistedUsers.includes(executor.id)) return false;
    if (guild.ownerId === executor.id) return false;

    const now = Date.now();
    const key = `${guild.id}-${executor.id}`;

    if (!channelActions.has(key)) {
        channelActions.set(key, []);
    }

    const actions = channelActions.get(key);
    actions.push(now);

    const recentActions = actions.filter(
        timestamp => now - timestamp < antiNuke.antiChannelSpam.timeWindow
    );
    channelActions.set(key, recentActions);

    if (recentActions.length >= antiNuke.antiChannelSpam.maxActions) {
        channelActions.delete(key);

        try {
            const member = guild.members.cache.get(executor.id);
            if (!member) return false;

            if (antiNuke.antiChannelSpam.action === 'timeout') {
                await member.timeout(86400000, 'Anti-Nuke: Channel spam detected');
            } else if (antiNuke.antiChannelSpam.action === 'kick') {
                await member.kick('Anti-Nuke: Channel spam detected');
            } else if (antiNuke.antiChannelSpam.action === 'ban') {
                await member.ban({ reason: 'Anti-Nuke: Channel spam detected' });
            }

            if (antiNuke.logChannel) {
                const logChannel = guild.channels.cache.get(antiNuke.logChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `🛡️ **Anti-Channel Spam Alert**\n\n**Action:** User ${antiNuke.antiChannelSpam.action}ed\n**User:** ${executor.tag} (${executor.id})\n**Channel Actions:** ${recentActions.length} in ${antiNuke.antiChannelSpam.timeWindow}ms\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('Anti-Channel Spam action error:', error);
        }
    }

    return false;
}

async function checkRoleSpam(guild, executor) {
    const antiNuke = await AntiNuke.findOne({ guildId: guild.id });
    if (!antiNuke || !antiNuke.enabled || !antiNuke.antiRoleSpam.enabled) return false;

    if (antiNuke.whitelistedUsers.includes(executor.id)) return false;
    if (guild.ownerId === executor.id) return false;

    const now = Date.now();
    const key = `${guild.id}-${executor.id}`;

    if (!roleActions.has(key)) {
        roleActions.set(key, []);
    }

    const actions = roleActions.get(key);
    actions.push(now);

    const recentActions = actions.filter(
        timestamp => now - timestamp < antiNuke.antiRoleSpam.timeWindow
    );
    roleActions.set(key, recentActions);

    if (recentActions.length >= antiNuke.antiRoleSpam.maxActions) {
        roleActions.delete(key);

        try {
            const member = guild.members.cache.get(executor.id);
            if (!member) return false;

            if (antiNuke.antiRoleSpam.action === 'timeout') {
                await member.timeout(86400000, 'Anti-Nuke: Role spam detected');
            } else if (antiNuke.antiRoleSpam.action === 'kick') {
                await member.kick('Anti-Nuke: Role spam detected');
            } else if (antiNuke.antiRoleSpam.action === 'ban') {
                await member.ban({ reason: 'Anti-Nuke: Role spam detected' });
            }

            if (antiNuke.logChannel) {
                const logChannel = guild.channels.cache.get(antiNuke.logChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `🛡️ **Anti-Role Spam Alert**\n\n**Action:** User ${antiNuke.antiRoleSpam.action}ed\n**User:** ${executor.tag} (${executor.id})\n**Role Actions:** ${recentActions.length} in ${antiNuke.antiRoleSpam.timeWindow}ms\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('Anti-Role Spam action error:', error);
        }
    }

    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of channelActions.entries()) {
        const filtered = timestamps.filter(t => now - t < 60000);
        if (filtered.length === 0) {
            channelActions.delete(key);
        } else {
            channelActions.set(key, filtered);
        }
    }
    for (const [key, timestamps] of roleActions.entries()) {
        const filtered = timestamps.filter(t => now - t < 60000);
        if (filtered.length === 0) {
            roleActions.delete(key);
        } else {
            roleActions.set(key, filtered);
        }
    }
}, 60000);

module.exports = { checkChannelSpam, checkRoleSpam };
