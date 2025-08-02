const nodemailer = require('nodemailer')
const User = require('../models/User')

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  // Send email notification
  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"PersonaPilot" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent:', result.messageId)
      return result
    } catch (error) {
      console.error('Email sending error:', error)
      throw new Error('Failed to send email')
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to PersonaPilot! 🚀'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #06B6D4); padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to PersonaPilot!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your AI-powered social media companion</p>
        </div>
        
        <div style="padding: 40px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name}! 👋</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining PersonaPilot! We're excited to help you create amazing content and grow your social media presence.
          </p>
          
          <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-bottom: 15px;">🎯 What's Next?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Complete your onboarding to set up your first persona</li>
              <li>Connect your Twitter account for seamless posting</li>
              <li>Explore trending topics in your industry</li>
              <li>Generate your first AI-powered post</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Get Started
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Need help? Reply to this email or visit our support center.
          </p>
        </div>
      </div>
    `

    return await this.sendEmail(user.email, subject, html)
  }

  // Send trend alert
  async sendTrendAlert(user, trends) {
    if (!user.settings.notifications.trends) return

    const subject = '🔥 New Trending Topics for Your Personas'
    const trendsList = trends.map(trend => 
      `<li style="margin: 10px 0;"><strong>${trend.title}</strong> - ${trend.category}</li>`
    ).join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🔥 Trending Now</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hi ${user.name}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            We found ${trends.length} new trending topics that match your personas:
          </p>
          
          <ul style="color: #666; line-height: 1.6;">
            ${trendsList}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/trends" 
               style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Trends
            </a>
          </div>
        </div>
      </div>
    `

    return await this.sendEmail(user.email, subject, html)
  }

  // Send engagement alert
  async sendEngagementAlert(user, post, metrics) {
    if (!user.settings.notifications.engagement) return

    const subject = '📈 Your Post is Performing Great!'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #06B6D4; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">📈 Great Performance!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hi ${user.name}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your recent post is getting great engagement:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; font-style: italic; margin-bottom: 15px;">
              "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"
            </p>
            
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div>
                <strong style="color: #4F46E5; font-size: 24px;">${metrics.likes}</strong>
                <p style="color: #666; margin: 5px 0;">Likes</p>
              </div>
              <div>
                <strong style="color: #4F46E5; font-size: 24px;">${metrics.retweets}</strong>
                <p style="color: #666; margin: 5px 0;">Retweets</p>
              </div>
              <div>
                <strong style="color: #4F46E5; font-size: 24px;">${metrics.replies}</strong>
                <p style="color: #666; margin: 5px 0;">Replies</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/analytics" 
               style="background: #06B6D4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Analytics
            </a>
          </div>
        </div>
      </div>
    `

    return await this.sendEmail(user.email, subject, html)
  }

  // Send subscription reminder
  async sendSubscriptionReminder(user, daysLeft) {
    const subject = `⏰ Your PersonaPilot subscription expires in ${daysLeft} days`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F59E0B; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Subscription Reminder</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hi ${user.name}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your PersonaPilot ${user.subscription.plan} subscription will expire in ${daysLeft} days.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Don't lose access to your AI-powered content creation tools!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/upgrade" 
               style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Renew Subscription
            </a>
          </div>
        </div>
      </div>
    `

    return await this.sendEmail(user.email, subject, html)
  }

  // Send bulk notifications to users
  async sendBulkNotification(userIds, subject, html) {
    const users = await User.find({ 
      _id: { $in: userIds },
      'settings.notifications.email': true 
    })

    const promises = users.map(user => 
      this.sendEmail(user.email, subject, html)
    )

    return await Promise.allSettled(promises)
  }

  // Schedule notification (would integrate with a job queue in production)
  async scheduleNotification(userId, type, data, sendAt) {
    // In production, this would use a job queue like Bull or Agenda
    console.log(`Scheduled ${type} notification for user ${userId} at ${sendAt}`)
    
    // For now, just log the scheduled notification
    return {
      userId,
      type,
      data,
      sendAt,
      status: 'scheduled'
    }
  }
}

module.exports = new NotificationService()