const mongoose = require('mongoose');

const vcTimeSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  // Total time spent in VC (in milliseconds)
  timeInVC: {
    type: Number,
    default: 0,
  },
  // Timestamp when they joined (null if not in VC)
  joinTime: {
    type: Number,
    default: null,
  },
  // NEW: Track Voice Experience Points
  voiceXp: {
    type: Number,
    default: 0
  },
  // NEW: Track Voice Level
  voiceLevel: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('VcTime', vcTimeSchema);
