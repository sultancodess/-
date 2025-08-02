const express = require('express')
const Post = require('../models/Post')
const Role = require('../models/Role')
const auth = require('../middleware/auth')
const analyticsService = require('../services/analyticsService')

const router = express.Router()

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { period = '7d', roleId } = req.query
    
    // Calculate date range
    const now = new Date()
    let startDate
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const matchQuery = {
      user: req.user._id,
      status: 'published',
      publishedAt: { $gte: startDate }
    }

    if (roleId) {
      matchQuery.role = roleId
    }

    // Aggregate analytics data
    const analytics = await Post.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalLikes: { $sum: '$platforms.twitter.metrics.likes' },
          totalRetweets: { $sum: '$platforms.twitter.metrics.retweets' },
          totalReplies: { $sum: '$platforms.twitter.metrics.replies' },
          totalImpressions: { $sum: '$platforms.twitter.metrics.impressions' },
          avgEngagementRate: { $avg: '$performance.engagementRate' },
          avgPerformanceScore: { $avg: '$performance.score' }
        }
      }
    ])

    const stats = analytics[0] || {
      totalPosts: 0,
      totalLikes: 0,
      totalRetweets: 0,
      totalReplies: 0,
      totalImpressions: 0,
      avgEngagementRate: 0,
      avgPerformanceScore: 0
    }

    // Get engagement over time
    const engagementOverTime = await Post.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$publishedAt'
            }
          },
          likes: { $sum: '$platforms.twitter.metrics.likes' },
          retweets: { $sum: '$platforms.twitter.metrics.retweets' },
          replies: { $sum: '$platforms.twitter.metrics.replies' },
          posts: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Get top performing posts
    const topPosts = await Post.find(matchQuery)
      .populate('role', 'name')
      .sort({ 'performance.score': -1 })
      .limit(5)
      .select('content platforms.twitter.metrics performance publishedAt role')

    // Get best posting times
    const postingTimes = await Post.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $hour: '$publishedAt' },
          avgEngagement: { $avg: '$performance.engagementRate' },
          postCount: { $sum: 1 }
        }
      },
      { $sort: { avgEngagement: -1 } }
    ])

    res.json({
      stats,
      engagementOverTime,
      topPosts,
      postingTimes: postingTimes.slice(0, 24), // 24 hours
      period
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/analytics/posts/:id
// @desc    Get detailed post analytics
// @access  Private
router.get('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('role', 'name persona')

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Get similar posts for comparison
    const similarPosts = await post.getSimilarPosts()

    // Calculate performance insights
    const insights = {
      performanceRating: 'average',
      strengths: [],
      improvements: []
    }

    const score = post.performance.score
    if (score > 100) {
      insights.performanceRating = 'excellent'
      insights.strengths.push('High engagement rate')
    } else if (score > 50) {
      insights.performanceRating = 'good'
      insights.strengths.push('Above average performance')
    } else if (score < 10) {
      insights.performanceRating = 'poor'
      insights.improvements.push('Consider different posting times')
      insights.improvements.push('Try more engaging content formats')
    }

    res.json({
      post,
      similarPosts,
      insights
    })
  } catch (error) {
    console.error('Post analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
// @rout
e   GET /api/analytics/engagement
// @desc    Get detailed engagement analytics
// @access  Private
router.get('/engagement', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query
    const analytics = await analyticsService.getEngagementAnalytics(req.user._id, timeframe)
    
    res.json(analytics)
  } catch (error) {
    console.error('Engagement analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/analytics/roles
// @desc    Get role performance analytics
// @access  Private
router.get('/roles', auth, async (req, res) => {
  try {
    const { roleId } = req.query
    const analytics = await analyticsService.getRoleAnalytics(req.user._id, roleId)
    
    res.json(analytics)
  } catch (error) {
    console.error('Role analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/analytics/posting-times
// @desc    Get posting time analytics with heatmap
// @access  Private
router.get('/posting-times', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query
    const analytics = await analyticsService.getPostingTimeAnalytics(req.user._id, timeframe)
    
    res.json(analytics)
  } catch (error) {
    console.error('Posting time analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/analytics/overview
// @desc    Get comprehensive dashboard overview
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query
    const analytics = await analyticsService.getDashboardAnalytics(req.user._id, timeframe)
    
    res.json(analytics)
  } catch (error) {
    console.error('Overview analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/analytics/export
// @desc    Export analytics data
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'json', timeframe = '30d' } = req.query
    
    const [overview, engagement, roles] = await Promise.all([
      analyticsService.getDashboardAnalytics(req.user._id, timeframe),
      analyticsService.getEngagementAnalytics(req.user._id, timeframe),
      analyticsService.getRoleAnalytics(req.user._id)
    ])

    const exportData = {
      overview,
      engagement,
      roles,
      exportedAt: new Date().toISOString(),
      timeframe
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv')
      res.send(csv)
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.json')
      res.json(exportData)
    }
  } catch (error) {
    console.error('Export analytics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Helper function to convert data to CSV
function convertToCSV(data) {
  const headers = ['Date', 'Posts', 'Engagement', 'Impressions', 'Engagement Rate']
  const rows = data.engagement.dailyData.map(day => [
    day.date,
    day.posts,
    day.engagement,
    day.impressions,
    day.impressions > 0 ? ((day.engagement / day.impressions) * 100).toFixed(2) : 0
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}