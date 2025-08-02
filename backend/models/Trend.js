const mongoose = require('mongoose')

const trendSchema = new mongoose.Schema({
  // Basic trend info
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'technology', 'business', 'entertainment', 'sports', 'politics',
      'health', 'science', 'education', 'lifestyle', 'travel',
      'food', 'fashion', 'gaming', 'music', 'art', 'general'
    ]
  },
  keywords: [String],
  hashtags: [String],
  
  // Platform-specific data
  platforms: {
    twitter: {
      tweetVolume: Number,
      url: String,
      woeid: Number, // Where On Earth ID for location-based trends
      rank: Number
    }
  },
  
  // Trend metrics
  metrics: {
    trendScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    velocity: {
      type: Number,
      default: 0 // How fast the trend is growing
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    sentimentScore: {
      type: Number,
      default: 0,
      min: -1,
      max: 1
    },
    engagement: {
      type: Number,
      default: 0
    }
  },
  
  // Geographic data
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Temporal data
  peakTime: Date,
  duration: Number, // in hours
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Content suggestions
  contentSuggestions: [{
    type: {
      type: String,
      enum: ['question', 'opinion', 'news', 'tip', 'story', 'poll']
    },
    text: String,
    engagement: Number
  }],
  
  // Related trends
  relatedTrends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trend'
  }],
  
  // AI analysis
  aiAnalysis: {
    summary: String,
    opportunities: [String],
    risks: [String],
    targetAudience: [String],
    bestPostingTimes: [String],
    suggestedHashtags: [String],
    competitorActivity: Number,
    lastAnalyzed: Date
  },
  
  // Usage tracking
  usage: {
    postsGenerated: {
      type: Number,
      default: 0
    },
    usersEngaged: {
      type: Number,
      default: 0
    },
    avgPerformance: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
})

// Indexes
trendSchema.index({ category: 1, 'metrics.trendScore': -1 })
trendSchema.index({ keywords: 1 })
trendSchema.index({ hashtags: 1 })
trendSchema.index({ isActive: 1, createdAt: -1 })
trendSchema.index({ 'platforms.twitter.rank': 1 })
trendSchema.index({ 'location.country': 1 })

// Text search index
trendSchema.index({
  title: 'text',
  description: 'text',
  keywords: 'text'
})

// Calculate trend score based on various factors
trendSchema.methods.calculateTrendScore = function() {
  let score = 0
  
  // Base score from tweet volume
  if (this.platforms.twitter.tweetVolume) {
    score += Math.min(this.platforms.twitter.tweetVolume / 10000, 40)
  }
  
  // Velocity bonus
  score += Math.min(this.metrics.velocity * 10, 20)
  
  // Engagement bonus
  score += Math.min(this.metrics.engagement / 1000, 15)
  
  // Recency bonus (newer trends get higher scores)
  const hoursOld = (Date.now() - this.createdAt) / (1000 * 60 * 60)
  const recencyBonus = Math.max(25 - hoursOld, 0)
  score += recencyBonus
  
  // Sentiment adjustment
  if (this.metrics.sentiment === 'positive') {
    score *= 1.1
  } else if (this.metrics.sentiment === 'negative') {
    score *= 0.9
  }
  
  this.metrics.trendScore = Math.min(Math.round(score), 100)
  return this.metrics.trendScore
}

// Get trends for specific role/persona
trendSchema.statics.getForRole = async function(role, limit = 10) {
  const query = {
    isActive: true,
    $or: [
      { category: role.persona.industry },
      { keywords: { $in: role.persona.keywords } },
      { hashtags: { $in: role.persona.hashtags } }
    ]
  }
  
  return await this.find(query)
    .sort({ 'metrics.trendScore': -1, createdAt: -1 })
    .limit(limit)
    .lean()
}

// Get trending hashtags
trendSchema.statics.getTrendingHashtags = async function(category, limit = 20) {
  const pipeline = [
    {
      $match: {
        isActive: true,
        ...(category && { category })
      }
    },
    { $unwind: '$hashtags' },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
        avgScore: { $avg: '$metrics.trendScore' },
        categories: { $addToSet: '$category' }
      }
    },
    {
      $sort: { count: -1, avgScore: -1 }
    },
    { $limit: limit }
  ]
  
  return await this.aggregate(pipeline)
}

// Analyze trend for content opportunities
trendSchema.methods.analyzeForContent = async function() {
  const analysis = {
    contentTypes: [],
    angles: [],
    hashtags: this.hashtags.slice(0, 5),
    timing: {
      optimal: this.peakTime || new Date(),
      urgency: this.metrics.velocity > 5 ? 'high' : 'medium'
    }
  }
  
  // Suggest content types based on category
  const contentTypeMap = {
    technology: ['educational', 'news', 'opinion'],
    business: ['tip', 'news', 'opinion'],
    entertainment: ['opinion', 'story', 'poll'],
    sports: ['news', 'opinion', 'poll'],
    lifestyle: ['tip', 'story', 'poll']
  }
  
  analysis.contentTypes = contentTypeMap[this.category] || ['news', 'opinion']
  
  // Generate content angles
  if (this.metrics.sentiment === 'positive') {
    analysis.angles.push('celebrate', 'share excitement', 'join conversation')
  } else if (this.metrics.sentiment === 'negative') {
    analysis.angles.push('provide solution', 'offer perspective', 'show empathy')
  } else {
    analysis.angles.push('ask question', 'share opinion', 'provide insight')
  }
  
  return analysis
}

// Pre-save middleware
trendSchema.pre('save', function(next) {
  // Recalculate trend score if metrics changed
  if (this.isModified('metrics') || this.isModified('platforms')) {
    this.calculateTrendScore()
  }
  
  // Deactivate old trends
  const hoursOld = (Date.now() - this.createdAt) / (1000 * 60 * 60)
  if (hoursOld > 48 && this.metrics.trendScore < 10) {
    this.isActive = false
  }
  
  next()
})

module.exports = mongoose.model('Trend', trendSchema)