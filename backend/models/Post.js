const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  // Content
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  hashtags: [String],
  mentions: [String],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif']
    },
    url: String,
    altText: String
  }],
  // AI Generation details
  aiGenerated: {
    type: Boolean,
    default: false
  },
  prompt: String,
  trend: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trend'
  },
  // Scheduling
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  scheduledFor: Date,
  publishedAt: Date,
  // Platform-specific data
  platforms: {
    twitter: {
      tweetId: String,
      url: String,
      metrics: {
        impressions: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        retweets: { type: Number, default: 0 },
        replies: { type: Number, default: 0 },
        quotes: { type: Number, default: 0 },
        bookmarks: { type: Number, default: 0 },
        lastUpdated: Date
      }
    }
  },
  // Analytics
  performance: {
    engagementRate: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    score: { type: Number, default: 0 } // Overall performance score
  },
  // Metadata
  version: {
    type: Number,
    default: 1
  },
  parentPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }, // For post variations/edits
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
postSchema.index({ user: 1, createdAt: -1 })
postSchema.index({ role: 1, createdAt: -1 })
postSchema.index({ status: 1, scheduledFor: 1 })
postSchema.index({ 'platforms.twitter.tweetId': 1 })
postSchema.index({ trend: 1 })

// Virtual for engagement rate calculation
postSchema.virtual('engagementRate').get(function() {
  const twitter = this.platforms.twitter
  if (!twitter.metrics || !twitter.metrics.impressions) return 0
  
  const engagements = twitter.metrics.likes + twitter.metrics.retweets + 
                     twitter.metrics.replies + twitter.metrics.quotes
  
  return twitter.metrics.impressions > 0 ? 
    (engagements / twitter.metrics.impressions) * 100 : 0
})

// Calculate performance score
postSchema.methods.calculatePerformanceScore = function() {
  const twitter = this.platforms.twitter
  if (!twitter.metrics) return 0
  
  const weights = {
    likes: 1,
    retweets: 3,
    replies: 2,
    quotes: 2,
    bookmarks: 1.5
  }
  
  const score = (
    (twitter.metrics.likes * weights.likes) +
    (twitter.metrics.retweets * weights.retweets) +
    (twitter.metrics.replies * weights.replies) +
    (twitter.metrics.quotes * weights.quotes) +
    (twitter.metrics.bookmarks * weights.bookmarks)
  )
  
  this.performance.score = score
  return score
}

// Get similar posts for comparison
postSchema.methods.getSimilarPosts = async function() {
  const hashtags = this.hashtags
  if (!hashtags.length) return []
  
  return await this.constructor.find({
    _id: { $ne: this._id },
    user: this.user,
    hashtags: { $in: hashtags },
    status: 'published'
  })
  .sort({ createdAt: -1 })
  .limit(5)
  .populate('role', 'name')
}

// Format content for specific platform
postSchema.methods.formatForPlatform = function(platform) {
  let content = this.content
  
  switch (platform) {
    case 'twitter':
      // Ensure Twitter character limit
      if (content.length > 280) {
        content = content.substring(0, 277) + '...'
      }
      
      // Add hashtags if they fit
      const hashtagString = this.hashtags.map(tag => `#${tag}`).join(' ')
      if (content.length + hashtagString.length + 1 <= 280) {
        content += ' ' + hashtagString
      }
      break
      
    default:
      break
  }
  
  return content
}

// Pre-save middleware
postSchema.pre('save', function(next) {
  // Update performance score if metrics changed
  if (this.isModified('platforms.twitter.metrics')) {
    this.calculatePerformanceScore()
  }
  
  // Set published timestamp
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  
  next()
})

module.exports = mongoose.model('Post', postSchema)