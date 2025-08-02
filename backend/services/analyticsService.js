const Post = require('../models/Post')
const User = require('../models/User')
const Role = require('../models/Role')
const twitterService = require('./twitterService')

class AnalyticsService {
  // Get dashboard analytics
  async getDashboardAnalytics(userId, timeframe = '7d') {
    try {
      const user = await User.findById(userId)
      const dateRange = this.getDateRange(timeframe)

      // Get posts in timeframe
      const posts = await Post.find({
        user: userId,
        status: 'published',
        publishedAt: { $gte: dateRange.start, $lte: dateRange.end }
      }).populate('role', 'name')

      // Calculate metrics
      const totalPosts = posts.length
      const totalEngagement = posts.reduce((sum, post) => {
        const twitter = post.platforms.twitter.metrics
        return sum + (twitter.likes + twitter.retweets + twitter.replies + twitter.quotes)
      }, 0)

      const totalImpressions = posts.reduce((sum, post) => {
        return sum + (post.platforms.twitter.metrics.impressions || 0)
      }, 0)

      const avgEngagementRate = totalImpressions > 0 ? 
        ((totalEngagement / totalImpressions) * 100).toFixed(2) : 0

      // Get follower count (would need Twitter API integration)
      const followerCount = user.twitterUsername ? await this.getFollowerCount(user.twitterUsername) : 0

      // Find best performing post
      const bestPost = posts.reduce((best, current) => {
        const currentScore = current.performance.score || 0
        const bestScore = best?.performance?.score || 0
        return currentScore > bestScore ? current : best
      }, null)

      // Calculate best posting times
      const bestPostingTimes = this.calculateBestPostingTimes(posts)

      return {
        overview: {
          totalPosts,
          totalEngagement,
          avgEngagementRate: parseFloat(avgEngagementRate),
          followerCount,
          personaScore: this.calculatePersonaScore(posts)
        },
        bestPost: bestPost ? {
          content: bestPost.content.substring(0, 100) + '...',
          engagement: bestPost.platforms.twitter.metrics.likes + 
                    bestPost.platforms.twitter.metrics.retweets,
          publishedAt: bestPost.publishedAt
        } : null,
        bestPostingTimes,
        timeframe
      }
    } catch (error) {
      console.error('Dashboard analytics error:', error)
      throw new Error('Failed to get dashboard analytics')
    }
  }

  // Get detailed engagement analytics
  async getEngagementAnalytics(userId, timeframe = '30d') {
    try {
      const dateRange = this.getDateRange(timeframe)
      
      const posts = await Post.find({
        user: userId,
        status: 'published',
        publishedAt: { $gte: dateRange.start, $lte: dateRange.end }
      }).sort({ publishedAt: 1 })

      // Group by day for chart data
      const dailyData = this.groupPostsByDay(posts, dateRange)
      
      // Calculate engagement trends
      const engagementTrend = this.calculateEngagementTrend(posts)
      
      // Top performing posts
      const topPosts = posts
        .sort((a, b) => (b.performance.score || 0) - (a.performance.score || 0))
        .slice(0, 10)
        .map(post => ({
          id: post._id,
          content: post.content.substring(0, 100) + '...',
          metrics: post.platforms.twitter.metrics,
          publishedAt: post.publishedAt,
          engagementRate: this.calculateEngagementRate(post)
        }))

      return {
        dailyData,
        engagementTrend,
        topPosts,
        summary: {
          totalPosts: posts.length,
          avgEngagementRate: this.calculateAverageEngagementRate(posts),
          bestDay: this.findBestPerformingDay(dailyData),
          growthRate: this.calculateGrowthRate(dailyData)
        }
      }
    } catch (error) {
      console.error('Engagement analytics error:', error)
      throw new Error('Failed to get engagement analytics')
    }
  }

  // Get role performance analytics
  async getRoleAnalytics(userId, roleId = null) {
    try {
      const query = { user: userId, status: 'published' }
      if (roleId) query.role = roleId

      const posts = await Post.find(query)
        .populate('role', 'name persona')
        .sort({ publishedAt: -1 })

      // Group by role
      const rolePerformance = {}
      
      posts.forEach(post => {
        const roleName = post.role.name
        if (!rolePerformance[roleName]) {
          rolePerformance[roleName] = {
            name: roleName,
            posts: 0,
            totalEngagement: 0,
            totalImpressions: 0,
            avgScore: 0,
            bestPost: null
          }
        }

        const role = rolePerformance[roleName]
        const metrics = post.platforms.twitter.metrics
        
        role.posts++
        role.totalEngagement += metrics.likes + metrics.retweets + metrics.replies
        role.totalImpressions += metrics.impressions || 0
        role.avgScore += post.performance.score || 0

        if (!role.bestPost || (post.performance.score || 0) > (role.bestPost.performance.score || 0)) {
          role.bestPost = post
        }
      })

      // Calculate averages
      Object.values(rolePerformance).forEach(role => {
        role.avgScore = role.posts > 0 ? role.avgScore / role.posts : 0
        role.engagementRate = role.totalImpressions > 0 ? 
          ((role.totalEngagement / role.totalImpressions) * 100).toFixed(2) : 0
      })

      return {
        rolePerformance: Object.values(rolePerformance),
        totalRoles: Object.keys(rolePerformance).length,
        bestPerformingRole: this.findBestPerformingRole(rolePerformance)
      }
    } catch (error) {
      console.error('Role analytics error:', error)
      throw new Error('Failed to get role analytics')
    }
  }

  // Get posting time analytics
  async getPostingTimeAnalytics(userId, timeframe = '30d') {
    try {
      const dateRange = this.getDateRange(timeframe)
      
      const posts = await Post.find({
        user: userId,
        status: 'published',
        publishedAt: { $gte: dateRange.start, $lte: dateRange.end }
      })

      // Create heatmap data (24 hours x 7 days)
      const heatmapData = Array(7).fill().map(() => Array(24).fill(0))
      const engagementData = Array(7).fill().map(() => Array(24).fill(0))
      const postCounts = Array(7).fill().map(() => Array(24).fill(0))

      posts.forEach(post => {
        const date = new Date(post.publishedAt)
        const hour = date.getHours()
        const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.
        
        const engagement = post.platforms.twitter.metrics.likes + 
                          post.platforms.twitter.metrics.retweets +
                          post.platforms.twitter.metrics.replies

        postCounts[day][hour]++
        engagementData[day][hour] += engagement
      })

      // Calculate average engagement per post for each time slot
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          if (postCounts[day][hour] > 0) {
            heatmapData[day][hour] = engagementData[day][hour] / postCounts[day][hour]
          }
        }
      }

      // Find best times
      const bestTimes = this.findBestPostingTimes(heatmapData)

      return {
        heatmapData,
        bestTimes,
        dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        hourLabels: Array.from({ length: 24 }, (_, i) => `${i}:00`)
      }
    } catch (error) {
      console.error('Posting time analytics error:', error)
      throw new Error('Failed to get posting time analytics')
    }
  }

  // Helper methods
  getDateRange(timeframe) {
    const end = new Date()
    const start = new Date()

    switch (timeframe) {
      case '7d':
        start.setDate(end.getDate() - 7)
        break
      case '30d':
        start.setDate(end.getDate() - 30)
        break
      case '90d':
        start.setDate(end.getDate() - 90)
        break
      default:
        start.setDate(end.getDate() - 7)
    }

    return { start, end }
  }

  groupPostsByDay(posts, dateRange) {
    const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24))
    const dailyData = []

    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start)
      date.setDate(date.getDate() + i)
      
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.publishedAt)
        return postDate.toDateString() === date.toDateString()
      })

      const totalEngagement = dayPosts.reduce((sum, post) => {
        const metrics = post.platforms.twitter.metrics
        return sum + (metrics.likes + metrics.retweets + metrics.replies)
      }, 0)

      dailyData.push({
        date: date.toISOString().split('T')[0],
        posts: dayPosts.length,
        engagement: totalEngagement,
        impressions: dayPosts.reduce((sum, post) => 
          sum + (post.platforms.twitter.metrics.impressions || 0), 0)
      })
    }

    return dailyData
  }

  calculateEngagementRate(post) {
    const metrics = post.platforms.twitter.metrics
    const engagement = metrics.likes + metrics.retweets + metrics.replies
    const impressions = metrics.impressions || 0
    
    return impressions > 0 ? ((engagement / impressions) * 100).toFixed(2) : 0
  }

  calculateAverageEngagementRate(posts) {
    if (posts.length === 0) return 0
    
    const totalRate = posts.reduce((sum, post) => {
      return sum + parseFloat(this.calculateEngagementRate(post))
    }, 0)
    
    return (totalRate / posts.length).toFixed(2)
  }

  calculatePersonaScore(posts) {
    if (posts.length === 0) return 0
    
    const avgScore = posts.reduce((sum, post) => 
      sum + (post.performance.score || 0), 0) / posts.length
    
    return Math.min(Math.round(avgScore / 10), 100) // Scale to 0-100
  }

  calculateBestPostingTimes(posts) {
    const hourCounts = {}
    const hourEngagement = {}

    posts.forEach(post => {
      const hour = new Date(post.publishedAt).getHours()
      const engagement = post.platforms.twitter.metrics.likes + 
                        post.platforms.twitter.metrics.retweets

      if (!hourCounts[hour]) {
        hourCounts[hour] = 0
        hourEngagement[hour] = 0
      }

      hourCounts[hour]++
      hourEngagement[hour] += engagement
    })

    // Calculate average engagement per hour
    const hourAverages = Object.keys(hourCounts).map(hour => ({
      hour: parseInt(hour),
      avgEngagement: hourEngagement[hour] / hourCounts[hour],
      postCount: hourCounts[hour]
    }))

    // Sort by average engagement and return top 3
    return hourAverages
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(item => `${item.hour}:00`)
  }

  findBestPostingTimes(heatmapData) {
    const bestTimes = []
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (heatmapData[day][hour] > 0) {
          bestTimes.push({
            day,
            hour,
            engagement: heatmapData[day][hour]
          })
        }
      }
    }

    return bestTimes
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)
  }

  async getFollowerCount(username) {
    // This would integrate with Twitter API to get follower count
    // For now, return a mock value
    return Math.floor(Math.random() * 10000) + 1000
  }
}

module.exports = new AnalyticsService()