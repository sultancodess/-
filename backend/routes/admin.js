const express = require('express')
const User = require('../models/User')
const Post = require('../models/Post')
const Role = require('../models/Role')
const Trend = require('../models/Trend')
const auth = require('../middleware/auth')
const analyticsService = require('../services/analyticsService')

const router = express.Router()

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (Admin only)
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      totalPosts,
      publishedPosts,
      totalRoles,
      activeTrends
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ 'subscription.plan': { $ne: 'free' } }),
      Post.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Role.countDocuments(),
      Trend.countDocuments({ isActive: true })
    ])

    // Get user growth over last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Get subscription distribution
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ])

    // Get top performing posts
    const topPosts = await Post.find({ status: 'published' })
      .populate('user', 'name email')
      .populate('role', 'name')
      .sort({ 'performance.score': -1 })
      .limit(10)
      .select('content platforms.twitter.metrics performance publishedAt user role')

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email subscription createdAt lastLoginAt')

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        premiumUsers,
        totalPosts,
        publishedPosts,
        totalRoles,
        activeTrends,
        conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(2) : 0
      },
      userGrowth,
      subscriptionStats,
      topPosts,
      recentUsers
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan, status } = req.query
    
    const query = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (plan && plan !== 'all') {
      query['subscription.plan'] = plan
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        query.lastLoginAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      } else if (status === 'inactive') {
        query.$or = [
          { lastLoginAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          { lastLoginAt: { $exists: false } }
        ]
      }
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    })
  } catch (error) {
    console.error('Admin users error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin actions)
// @access  Private (Admin only)
router.put('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const { subscription, isActive, role } = req.body
    const user = await User.findById(req.params.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (subscription) {
      user.subscription = { ...user.subscription, ...subscription }
    }
    
    if (typeof isActive === 'boolean') {
      user.isActive = isActive
    }
    
    if (role) {
      user.role = role
    }

    await user.save()

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Admin update user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/posts
// @desc    Get all posts with moderation info
// @access  Private (Admin only)
router.get('/posts', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, flagged } = req.query
    
    const query = {}
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (flagged === 'true') {
      query.flagged = true
    }

    const posts = await Post.find(query)
      .populate('user', 'name email')
      .populate('role', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await Post.countDocuments(query)

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    })
  } catch (error) {
    console.error('Admin posts error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/admin/posts/:id/moderate
// @desc    Moderate a post (approve/reject/flag)
// @access  Private (Admin only)
router.put('/posts/:id/moderate', auth, adminAuth, async (req, res) => {
  try {
    const { action, reason } = req.body // action: 'approve', 'reject', 'flag'
    const post = await Post.findById(req.params.id)
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    switch (action) {
      case 'approve':
        post.moderation = {
          status: 'approved',
          moderatedBy: req.user._id,
          moderatedAt: new Date()
        }
        break
      case 'reject':
        post.moderation = {
          status: 'rejected',
          reason,
          moderatedBy: req.user._id,
          moderatedAt: new Date()
        }
        post.status = 'rejected'
        break
      case 'flag':
        post.flagged = true
        post.moderation = {
          status: 'flagged',
          reason,
          moderatedBy: req.user._id,
          moderatedAt: new Date()
        }
        break
    }

    await post.save()

    res.json({
      message: `Post ${action}ed successfully`,
      post
    })
  } catch (error) {
    console.error('Admin moderate post error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/analytics
// @desc    Get system-wide analytics
// @access  Private (Admin only)
router.get('/analytics', auth, adminAuth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query
    
    // Get date range
    const now = new Date()
    let startDate
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // User analytics
    const userAnalytics = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          newUsers: { $sum: 1 },
          premiumUsers: {
            $sum: {
              $cond: [{ $ne: ['$subscription.plan', 'free'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Post analytics
    const postAnalytics = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          totalPosts: { $sum: 1 },
          publishedPosts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'published'] }, 1, 0]
            }
          },
          aiGeneratedPosts: {
            $sum: {
              $cond: ['$aiGenerated', 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Revenue analytics (mock data - would integrate with payment provider)
    const revenueAnalytics = await User.aggregate([
      {
        $match: {
          'subscription.plan': { $ne: 'free' },
          'subscription.currentPeriodStart': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$subscription.currentPeriodStart'
            }
          },
          revenue: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$subscription.plan', 'pro'] }, then: 19 },
                  { case: { $eq: ['$subscription.plan', 'agency'] }, then: 49 }
                ],
                default: 0
              }
            }
          },
          subscriptions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({
      userAnalytics,
      postAnalytics,
      revenueAnalytics,
      timeframe
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/admin/system-health
// @desc    Get system health metrics
// @access  Private (Admin only)
router.get('/system-health', auth, adminAuth, async (req, res) => {
  try {
    // Database health
    const dbHealth = {
      status: 'healthy',
      collections: {
        users: await User.countDocuments(),
        posts: await Post.countDocuments(),
        roles: await Role.countDocuments(),
        trends: await Trend.countDocuments()
      }
    }

    // API health (mock data - would check actual API status)
    const apiHealth = {
      twitter: { status: 'healthy', lastCheck: new Date() },
      linkedin: { status: 'healthy', lastCheck: new Date() },
      gemini: { status: 'healthy', lastCheck: new Date() },
      razorpay: { status: 'healthy', lastCheck: new Date() }
    }

    // System metrics (mock data - would get from monitoring service)
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: { usage: Math.random() * 100 }, // Mock CPU usage
      activeConnections: Math.floor(Math.random() * 1000),
      requestsPerMinute: Math.floor(Math.random() * 500)
    }

    res.json({
      overall: 'healthy',
      database: dbHealth,
      apis: apiHealth,
      system: systemMetrics,
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error('System health error:', error)
    res.status(500).json({ 
      overall: 'unhealthy',
      error: error.message,
      lastUpdated: new Date()
    })
  }
})

// @route   POST /api/admin/broadcast
// @desc    Send broadcast notification to users
// @access  Private (Admin only)
router.post('/broadcast', auth, adminAuth, async (req, res) => {
  try {
    const { subject, message, targetUsers = 'all', userIds = [] } = req.body
    
    let users
    
    if (targetUsers === 'all') {
      users = await User.find({ 'settings.notifications.email': true })
    } else if (targetUsers === 'premium') {
      users = await User.find({ 
        'subscription.plan': { $ne: 'free' },
        'settings.notifications.email': true 
      })
    } else if (targetUsers === 'specific' && userIds.length > 0) {
      users = await User.find({ 
        _id: { $in: userIds },
        'settings.notifications.email': true 
      })
    } else {
      return res.status(400).json({ message: 'Invalid target users' })
    }

    const notificationService = require('../services/notificationService')
    const results = await notificationService.sendBulkNotification(
      users.map(u => u._id),
      subject,
      message
    )

    res.json({
      message: 'Broadcast sent successfully',
      targetCount: users.length,
      results: results.length
    })
  } catch (error) {
    console.error('Admin broadcast error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router