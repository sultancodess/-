const mongoose = require('mongoose')

const roleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Persona characteristics
  persona: {
    industry: {
      type: String,
      required: true
    },
    targetAudience: {
      type: String,
      required: true
    },
    toneOfVoice: {
      type: String,
      enum: ['professional', 'casual', 'friendly', 'authoritative', 'humorous', 'inspirational'],
      default: 'professional'
    },
    contentTypes: [{
      type: String,
      enum: ['educational', 'promotional', 'entertaining', 'news', 'personal', 'behind-the-scenes']
    }],
    keywords: [String],
    hashtags: [String]
  },
  // Platform-specific settings
  platforms: {
    twitter: {
      enabled: {
        type: Boolean,
        default: true
      },
      username: String,
      bio: String,
      postingSchedule: {
        frequency: {
          type: String,
          enum: ['daily', 'twice-daily', 'weekly', 'custom'],
          default: 'daily'
        },
        times: [String], // Array of time strings like "09:00", "15:00"
        timezone: {
          type: String,
          default: 'UTC'
        }
      }
    }
  },
  // AI preferences
  aiSettings: {
    creativity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7
    },
    maxLength: {
      type: Number,
      default: 280 // Twitter character limit
    },
    includeEmojis: {
      type: Boolean,
      default: true
    },
    includeHashtags: {
      type: Boolean,
      default: true
    },
    avoidTopics: [String]
  },
  // Analytics
  performance: {
    totalPosts: {
      type: Number,
      default: 0
    },
    avgEngagement: {
      type: Number,
      default: 0
    },
    bestPostingTime: String,
    topHashtags: [String],
    lastAnalyzed: Date
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
roleSchema.index({ user: 1 })
roleSchema.index({ user: 1, isDefault: 1 })
roleSchema.index({ 'persona.industry': 1 })

// Ensure only one default role per user
roleSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    )
  }
  next()
})

// Get trending topics for this role
roleSchema.methods.getTrendingTopics = async function() {
  const Trend = require('./Trend')
  
  return await Trend.find({
    $or: [
      { category: this.persona.industry },
      { keywords: { $in: this.persona.keywords } }
    ],
    isActive: true
  })
  .sort({ trendScore: -1 })
  .limit(10)
}

// Generate content prompt for AI
roleSchema.methods.generateContentPrompt = function(trend, contentType = 'general') {
  const { persona, aiSettings } = this
  
  let prompt = `You are a ${persona.toneOfVoice} content creator in the ${persona.industry} industry. `
  prompt += `Your target audience is ${persona.targetAudience}. `
  
  if (trend) {
    prompt += `Create a ${contentType} post about the trending topic: "${trend.title}". `
    if (trend.description) {
      prompt += `Context: ${trend.description}. `
    }
  }
  
  prompt += `The post should be engaging, authentic, and match your brand voice. `
  
  if (aiSettings.includeHashtags && persona.hashtags.length > 0) {
    prompt += `Consider using relevant hashtags from: ${persona.hashtags.join(', ')}. `
  }
  
  if (aiSettings.includeEmojis) {
    prompt += `Use appropriate emojis to enhance engagement. `
  }
  
  if (aiSettings.avoidTopics.length > 0) {
    prompt += `Avoid mentioning: ${aiSettings.avoidTopics.join(', ')}. `
  }
  
  prompt += `Keep it under ${aiSettings.maxLength} characters for Twitter.`
  
  return prompt
}

module.exports = mongoose.model('Role', roleSchema)