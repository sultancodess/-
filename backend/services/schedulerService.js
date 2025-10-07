const cron = require('node-cron')
const Post = require('../models/Post')
const User = require('../models/User')
const twitterService = require('./twitterService')
const linkedinService = require('./linkedinService')
const notificationService = require('./notificationService')
const analyticsService = require('./analyticsService')
const trendCollectionService = require('./trendCollectionService')

class SchedulerService {
  constructor() {
    this.jobs = new Map()
    this.initializeScheduledJobs()
  }

  initializeScheduledJobs() {
    // Check for scheduled posts every minute
    cron.schedule('* * * * *', () => {
      this.processScheduledPosts()
    })

    // Update analytics every hour
    cron.schedule('0 * * * *', () => {
      this.updateAnalytics()
    })

    // Send daily trend alerts at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.sendTrendAlerts()
    })

    // Check subscription renewals daily at midnight
    cron.schedule('0 0 * * *', () => {
      this.checkSubscriptionRenewals()
    })

    // Weekly performance reports on Mondays at 10 AM
    cron.schedule('0 10 * * 1', () => {
      this.sendWeeklyReports()
    })

    // Collect trends every 4 hours
    cron.schedule('0 */4 * * *', () => {
      this.collectTrends()
    })

    // Clean up old trends daily at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.cleanupTrends()
    })

    console.log('✅ Scheduler service initialized with cron jobs')
  }

  // Process scheduled posts
  async processScheduledPosts() {
    try {
      const now = new Date()
      const scheduledPosts = await Post.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).populate('user', 'connectedAccounts settings')

      for (const post of scheduledPosts) {
        await this.publishPost(post)
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error)
    }
  }

  // Publish a single post
  async publishPost(post) {
    try {
      const results = []

      // Publish to Twitter if enabled
      if (post.platforms?.twitter?.enabled && post.user.connectedAccounts?.twitter?.connected) {
        try {
          const twitterResult = await twitterService.postTweet(
            post.user._id, 
            post.formatForPlatform('twitter')
          )
          
          post.platforms.twitter.tweetId = twitterResult.tweetId
          post.platforms.twitter.url = twitterResult.url
          results.push({ platform: 'twitter', success: true, result: twitterResult })
        } catch (error) {
          console.error('Twitter publishing error:', error)
          results.push({ platform: 'twitter', success: false, error: error.message })
        }
      }

      // Publish to LinkedIn if enabled
      if (post.platforms?.linkedin?.enabled && post.user.connectedAccounts?.linkedin?.connected) {
        try {
          const linkedinResult = await linkedinService.createPost(
            post.user._id,
            post.content
          )
          
          post.platforms.linkedin.postId = linkedinResult.postId
          post.platforms.linkedin.url = linkedinResult.url
          results.push({ platform: 'linkedin', success: true, result: linkedinResult })
        } catch (error) {
          console.error('LinkedIn publishing error:', error)
          results.push({ platform: 'linkedin', success: false, error: error.message })
        }
      }

      // Update post status
      const hasSuccessfulPublish = results.some(r => r.success)
      post.status = hasSuccessfulPublish ? 'published' : 'failed'
      post.publishedAt = hasSuccessfulPublish ? new Date() : null
      
      await post.save()

      // Send notification if enabled
      if (hasSuccessfulPublish && post.user.settings?.notifications?.email) {
        await this.sendPublishNotification(post.user, post, results)
      }

      console.log(`Post ${post._id} processed:`, results)
    } catch (error) {
      console.error('Error publishing post:', error)
      post.status = 'failed'
      await post.save()
    }
  }

  // Update analytics for all published posts
  async updateAnalytics() {
    try {
      const recentPosts = await Post.find({
        status: 'published',
        publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).populate('user')

      for (const post of recentPosts) {
        await this.updatePostMetrics(post)
      }

      console.log(`Updated analytics for ${recentPosts.length} posts`)
    } catch (error) {
      console.error('Error updating analytics:', error)
    }
  }

  // Update metrics for a single post
  async updatePostMetrics(post) {
    try {
      // Update Twitter metrics
      if (post.platforms?.twitter?.tweetId) {
        try {
          const metrics = await twitterService.getTweetMetrics(post.platforms.twitter.tweetId)
          if (metrics) {
            post.platforms.twitter.metrics = {
              ...post.platforms.twitter.metrics,
              ...metrics,
              lastUpdated: new Date()
            }
          }
        } catch (error) {
          console.error('Twitter metrics error:', error)
        }
      }

      // Update LinkedIn metrics
      if (post.platforms?.linkedin?.postId) {
        try {
          const metrics = await linkedinService.getPostAnalytics(post.user._id, post.platforms.linkedin.postId)
          if (metrics) {
            post.platforms.linkedin.metrics = {
              ...post.platforms.linkedin.metrics,
              ...metrics,
              lastUpdated: new Date()
            }
          }
        } catch (error) {
          console.error('LinkedIn metrics error:', error)
        }
      }

      // Recalculate performance score
      post.calculatePerformanceScore()
      await post.save()

      // Check for high engagement and send alert
      await this.checkEngagementAlert(post)
    } catch (error) {
      console.error('Error updating post metrics:', error)
    }
  }

  // Check for high engagement and send alerts
  async checkEngagementAlert(post) {
    try {
      const twitterMetrics = post.platforms?.twitter?.metrics
      if (!twitterMetrics) return

      const totalEngagement = twitterMetrics.likes + twitterMetrics.retweets + twitterMetrics.replies
      const engagementRate = twitterMetrics.impressions > 0 
        ? (totalEngagement / twitterMetrics.impressions) * 100 
        : 0

      // Send alert if engagement rate is above 5% and post has significant reach
      if (engagementRate > 5 && twitterMetrics.impressions > 1000) {
        await notificationService.sendEngagementAlert(
          post.user,
          post,
          twitterMetrics
        )
      }
    } catch (error) {
      console.error('Error checking engagement alert:', error)
    }
  }

  // Send daily trend alerts
  async sendTrendAlerts() {
    try {
      const users = await User.find({
        'settings.notifications.trends': true,
        onboardingCompleted: true
      }).populate('roles')

      for (const user of users) {
        // Get personalized trends for user
        const trends = await this.getPersonalizedTrends(user)
        
        if (trends.length > 0) {
          await notificationService.sendTrendAlert(user, trends)
        }
      }

      console.log(`Sent trend alerts to ${users.length} users`)
    } catch (error) {
      console.error('Error sending trend alerts:', error)
    }
  }

  // Get personalized trends for a user
  async getPersonalizedTrends(user) {
    // This would integrate with the trends service
    // For now, return mock trends
    return [
      { title: 'AI in Content Creation', category: 'technology' },
      { title: 'Remote Work Productivity', category: 'business' }
    ]
  }

  // Check subscription renewals
  async checkSubscriptionRenewals() {
    try {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Find subscriptions expiring in 3 days
      const expiringSoon = await User.find({
        'subscription.currentPeriodEnd': {
          $gte: new Date(),
          $lte: threeDaysFromNow
        },
        'subscription.status': 'active'
      })

      // Find subscriptions expiring in 7 days
      const expiringWeek = await User.find({
        'subscription.currentPeriodEnd': {
          $gte: threeDaysFromNow,
          $lte: sevenDaysFromNow
        },
        'subscription.status': 'active'
      })

      // Send reminders
      for (const user of expiringSoon) {
        await notificationService.sendSubscriptionReminder(user, 3)
      }

      for (const user of expiringWeek) {
        await notificationService.sendSubscriptionReminder(user, 7)
      }

      console.log(`Sent renewal reminders: ${expiringSoon.length} (3 days), ${expiringWeek.length} (7 days)`)
    } catch (error) {
      console.error('Error checking subscription renewals:', error)
    }
  }

  // Send weekly performance reports
  async sendWeeklyReports() {
    try {
      const users = await User.find({
        'settings.notifications.weeklyReport': true,
        onboardingCompleted: true
      })

      for (const user of users) {
        const analytics = await analyticsService.getDashboardAnalytics(user._id, '7d')
        await this.sendWeeklyReport(user, analytics)
      }

      console.log(`Sent weekly reports to ${users.length} users`)
    } catch (error) {
      console.error('Error sending weekly reports:', error)
    }
  }

  // Send weekly report email
  async sendWeeklyReport(user, analytics) {
    const subject = '📊 Your Weekly PersonaPilot Report'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #06B6D4); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">📊 Weekly Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your PersonaPilot performance summary</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hi ${user.name}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Here's how your personal brand performed this week:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; text-align: center;">
              <div>
                <strong style="color: #4F46E5; font-size: 24px;">${analytics.overview.totalPosts}</strong>
                <p style="color: #666; margin: 5px 0;">Posts Published</p>
              </div>
              <div>
                <strong style="color: #4F46E5; font-size: 24px;">${analytics.overview.totalEngagement}</strong>
                <p style="color: #666; margin: 5px 0;">Total Engagement</p>
              </div>
              <div>
                <strong style="color: #4F46E5; font-size: 24px;">${analytics.overview.avgEngagementRate}%</strong>
                <p style="color: #666; margin: 5px 0;">Avg Engagement Rate</p>
              </div>
              <div>
                <strong style="color: #4F46E5; font-size: 24px;">${analytics.overview.personaScore}</strong>
                <p style="color: #666; margin: 5px 0;">Persona Score</p>
              </div>
            </div>
          </div>
          
          ${analytics.bestPost ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-bottom: 10px;">🏆 Best Performing Post</h3>
            <p style="color: #333; font-style: italic;">"${analytics.bestPost.content}"</p>
            <p style="color: #666; font-size: 14px;">Engagement: ${analytics.bestPost.engagement}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/analytics" 
               style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Full Analytics
            </a>
          </div>
        </div>
      </div>
    `

    return await notificationService.sendEmail(user.email, subject, html)
  }

  // Send publish notification
  async sendPublishNotification(user, post, results) {
    const successfulPlatforms = results.filter(r => r.success).map(r => r.platform)
    
    if (successfulPlatforms.length === 0) return

    const subject = '✅ Your post has been published!'
    const platformsList = successfulPlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10B981; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">✅ Post Published!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hi ${user.name}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your scheduled post has been successfully published to ${platformsList}:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; font-style: italic;">
              "${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}"
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/analytics" 
               style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Performance
            </a>
          </div>
        </div>
      </div>
    `

    return await notificationService.sendEmail(user.email, subject, html)
  }

  // Add a custom scheduled job
  addScheduledJob(name, cronExpression, callback) {
    if (this.jobs.has(name)) {
      console.warn(`Job ${name} already exists, skipping...`)
      return
    }

    const job = cron.schedule(cronExpression, callback, { scheduled: false })
    this.jobs.set(name, job)
    job.start()
    
    console.log(`Added scheduled job: ${name}`)
  }

  // Remove a scheduled job
  removeScheduledJob(name) {
    const job = this.jobs.get(name)
    if (job) {
      job.destroy()
      this.jobs.delete(name)
      console.log(`Removed scheduled job: ${name}`)
    }
  }

  // Collect trends from various sources
  async collectTrends() {
    try {
      console.log('🔍 Starting scheduled trend collection...')
      await trendCollectionService.collectAllTrends()
    } catch (error) {
      console.error('Scheduled trend collection error:', error)
    }
  }

  // Clean up old trends
  async cleanupTrends() {
    try {
      console.log('🧹 Starting trend cleanup...')
      await trendCollectionService.cleanupOldTrends()
    } catch (error) {
      console.error('Trend cleanup error:', error)
    }
  }

  // Get all active jobs
  getActiveJobs() {
    return Array.from(this.jobs.keys())
  }
}

module.exports = new SchedulerService()