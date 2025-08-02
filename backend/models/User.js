const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.twitterId // Password required only if not OAuth user
    },
    minlength: 8
  },
  avatar: {
    type: String,
    default: null
  },
  // OAuth fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  // Connected social accounts (managed in dashboard)
  connectedAccounts: {
    twitter: {
      connected: { type: Boolean, default: false },
      username: String,
      accessToken: String,
      refreshToken: String,
      connectedAt: Date
    },
    linkedin: {
      connected: { type: Boolean, default: false },
      username: String,
      accessToken: String,
      refreshToken: String,
      connectedAt: Date
    }
  },
  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'agency'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'active'
    },
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEnd: Date
  },
  // Usage tracking
  usage: {
    postsGenerated: {
      type: Number,
      default: 0
    },
    postsGeneratedToday: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  // Settings
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      trends: {
        type: Boolean,
        default: true
      },
      engagement: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  // Onboarding
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingStep: {
    type: Number,
    default: 0
  },
  // Metadata
  lastLoginAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ twitterId: 1 })
userSchema.index({ 'subscription.plan': 1 })

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Check if user can generate posts
userSchema.methods.canGeneratePost = function() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastReset = new Date(this.usage.lastResetDate)
  const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate())
  
  // Reset daily count if it's a new day
  if (today > lastResetDay) {
    this.usage.postsGeneratedToday = 0
    this.usage.lastResetDate = now
  }
  
  // Check limits based on plan
  const limits = {
    free: 5,
    pro: Infinity,
    agency: Infinity
  }
  
  return this.usage.postsGeneratedToday < limits[this.subscription.plan]
}

// Increment post generation count
userSchema.methods.incrementPostCount = function() {
  this.usage.postsGenerated += 1
  this.usage.postsGeneratedToday += 1
  return this.save()
}

// Get user's plan limits
userSchema.methods.getPlanLimits = function() {
  const limits = {
    free: {
      platforms: 1,
      roles: 1,
      postsPerDay: 5,
      trendsPerDay: 3,
      analytics: 'basic',
      scheduling: false,
      notifications: false
    },
    pro: {
      platforms: 5,
      roles: Infinity,
      postsPerDay: Infinity,
      trendsPerDay: Infinity,
      analytics: 'advanced',
      scheduling: true,
      notifications: true
    },
    agency: {
      platforms: Infinity,
      roles: Infinity,
      postsPerDay: Infinity,
      trendsPerDay: Infinity,
      analytics: 'premium',
      scheduling: true,
      notifications: true,
      teamCollaboration: true,
      whiteLabel: true
    }
  }
  
  return limits[this.subscription.plan] || limits.free
}

// Transform user object for API responses
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  delete user.twitterAccessToken
  delete user.twitterRefreshToken
  return user
}

module.exports = mongoose.model('User', userSchema)