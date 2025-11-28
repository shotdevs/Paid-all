const { AntiNuke } = require('../models');

const messageCache = new Map();

async function checkAntiSpam(message) {
    if (message.author.bot) return false;
    if (!message.guild) return false;

    const antiNuke = await AntiNuke.findOne({ guildId: message.guild.id });
    if (!antiNuke || !antiNuke.enabled || !antiNuke.antiSpam.enabled) return false;

    if (antiNuke.whitelistedUsers.includes(message.author.id)) return false;
    if (message.guild.ownerId === message.author.id) return false;

    const member = message.guild.members.cache.get(message.author.id);
    if (member && member.permissions.has('Administrator')) return false;

    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();

    if (!messageCache.has(key)) {
        messageCache.set(key, []);
    }

    const userMessages = messageCache.get(key);
    userMessages.push(now);

    const recentMessages = userMessages.filter(
        timestamp => now - timestamp < antiNuke.antiSpam.timeWindow
    );
    messageCache.set(key, recentMessages);

    if (recentMessages.length >= antiNuke.antiSpam.maxMessages) {
        messageCache.delete(key);

        try {
            if (antiNuke.antiSpam.action === 'timeout') {
                await member.timeout(antiNuke.antiSpam.duration, 'Anti-Spam: Message spam detected');
            } else if (antiNuke.antiSpam.action === 'kick') {
                await member.kick('Anti-Spam: Message spam detected');
            } else if (antiNuke.antiSpam.action === 'ban') {
                await member.ban({ reason: 'Anti-Spam: Message spam detected' });
            }

            if (antiNuke.logChannel) {
                const logChannel = message.guild.channels.cache.get(antiNuke.logChannel);
                if (logChannel) {
                    await logChannel.send({
                        content: `🛡️ **Anti-Spam Alert**\n\n**Action:** User ${antiNuke.antiSpam.action}ed\n**User:** ${message.author.tag} (${message.author.id})\n**Messages:** ${recentMessages.length} in ${antiNuke.antiSpam.timeWindow}ms\n**Duration:** ${antiNuke.antiSpam.action === 'timeout' ? `${antiNuke.antiSpam.duration / 1000}s` : 'Permanent'}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('Anti-Spam action error:', error);
        }
    }

    return false;
}

setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of messageCache.entries()) {
        const filtered = timestamps.filter(t => now - t < 60000);
        if (filtered.length === 0) {
            messageCache.delete(key);
        } else {
            messageCache.set(key, filtered);
        }
    }
}, 60000);

module.exports = { checkAntiSpam };
