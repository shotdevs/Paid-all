const mongoose = require('mongoose');

const antiNukeSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    whitelistedUsers: { type: [String], default: [] },
    antiBot: {
        enabled: { type: Boolean, default: true },
        action: { type: String, enum: ['kick', 'ban'], default: 'kick' }
    },
    antiSpam: {
        enabled: { type: Boolean, default: true },
        maxMessages: { type: Number, default: 4 },
        timeWindow: { type: Number, default: 2000 },
        action: { type: String, enum: ['timeout', 'kick', 'ban'], default: 'timeout' },
        duration: { type: Number, default: 86400000 }
    },
    antiRaid: {
        enabled: { type: Boolean, default: true },
        maxJoins: { type: Number, default: 10 },
        timeWindow: { type: Number, default: 10000 },
        action: { type: String, enum: ['kick', 'ban'], default: 'kick' }
    },
    antiChannelSpam: {
        enabled: { type: Boolean, default: true },
        maxActions: { type: Number, default: 5 },
        timeWindow: { type: Number, default: 10000 },
        action: { type: String, enum: ['timeout', 'kick', 'ban'], default: 'ban' }
    },
    antiRoleSpam: {
        enabled: { type: Boolean, default: true },
        maxActions: { type: Number, default: 5 },
        timeWindow: { type: Number, default: 10000 },
        action: { type: String, enum: ['timeout', 'kick', 'ban'], default: 'ban' }
    },
    antiMassBan: {
        enabled: { type: Boolean, default: true },
        maxBans: { type: Number, default: 3 },
        timeWindow: { type: Number, default: 10000 },
        action: { type: String, enum: ['removeperms', 'kick', 'ban'], default: 'ban' }
    },
    antiMassKick: {
        enabled: { type: Boolean, default: true },
        maxKicks: { type: Number, default: 3 },
        timeWindow: { type: Number, default: 10000 },
        action: { type: String, enum: ['removeperms', 'kick', 'ban'], default: 'ban' }
    },
    logChannel: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('AntiNuke', antiNukeSchema);
