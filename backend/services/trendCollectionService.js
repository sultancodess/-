const axios = require('axios')
const Trend = require('../models/Trend')
const { generateTrendInsights } = require('./aiService')

class TrendCollectionService {
  constructor() {
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN
    this.linkedinClientId = process.env.LINKEDIN_CLIENT_ID
    this.categories = [
      'technology', 'business', 'entertainment', 'sports', 'politics',
      'health', 'science', 'education', 'lifestyle', 'travel',
      'food', 'fashion', 'gaming', 'music', 'art', 'general'
    ]
  }

  // Collect trends from all sources
  async collectAllTrends() {
    try {
      console.log('🔍 Starting trend collection...')
      
      const [twitterTrends, linkedinTrends, generalTrends] = await Promise.all([
        this.collectTwitterTrends(),
        this.collectLinkedInTrends(),
        this.collectGeneralTrends()
      ])

      const allTrends = [...twitterTrends, ...linkedinTrends, ...generalTrends]
      
      // Process and save trends
      const savedTrends = await this.processTrends(allTrends)
      
      console.log(`✅ Collected and processed ${savedTrends.length} trends`)
      return savedTrends
    } catch (error) {
      console.error('❌ Trend collection error:', error)
      throw error
    }
  }

  // Collect Twitter trends
  async collectTwitterTrends() {
    try {
      if (!this.twitterBearerToken) {
        console.log('⚠️ Twitter Bearer Token not configured, skipping Twitter trends')
        return []
      }

      // Get trending topics from Twitter API v2
      const response = await axios.get('https://api.twitter.com/2/trends/by/woeid/1', {
        headers: {
          'Authorization': `Bearer ${this.twitterBearerToken}`
        },
        params: {
          'trend.fields': 'tweet_volume'
        }
      })

      const trends = response.data.data || []
      
      return trends.map(trend => ({
        title: trend.trend,
        description: `Trending on Twitter with ${trend.tweet_volume || 'unknown'} tweets`,
        category: this.categorizeContent(trend.trend),
        keywords: this.extractKeywords(trend.trend),
        hashtags: this.extractHashtags(trend.trend),
        platforms: {
          twitter: {
            tweetVolume: trend.tweet_volume || 0,
            woeid: 1,
            rank: trends.indexOf(trend) + 1
          }
        },
        source: 'twitter'
      }))
    } catch (error) {
      console.error('Twitter trends collection error:', error)
      return this.getMockTwitterTrends()
    }
  }

  // Collect LinkedIn trends (mock implementation - LinkedIn doesn't have public trends API)
  async collectLinkedInTrends() {
    try {
      // LinkedIn doesn't have a public trends API, so we'll use mock data
      // In a real implementation, you might scrape LinkedIn or use third-party services
      return this.getMockLinkedInTrends()
    } catch (error) {
      console.error('LinkedIn trends collection error:', error)
      return []
    }
  }

  // Collect general trends from various sources
  async collectGeneralTrends() {
    try {
      // This could integrate with Google Trends API, news APIs, etc.
      // For now, we'll generate some general trends
      return this.getMockGeneralTrends()
    } catch (error) {
      console.error('General trends collection error:', error)
      return []
    }
  }

  // Process and save trends to database
  async processTrends(rawTrends) {
    const processedTrends = []

    for (const rawTrend of rawTrends) {
      try {
        // Check if trend already exists
        const existingTrend = await Trend.findOne({
          title: rawTrend.title,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        })

        if (existingTrend) {
          // Update existing trend
          existingTrend.platforms = { ...existingTrend.platforms, ...rawTrend.platforms }
          existingTrend.metrics.trendScore = this.calculateTrendScore(rawTrend)
          await existingTrend.save()
          processedTrends.push(existingTrend)
        } else {
          // Create new trend
          const trend = new Trend({
            ...rawTrend,
            metrics: {
              trendScore: this.calculateTrendScore(rawTrend),
              velocity: Math.random() * 10, // Mock velocity
              sentiment: this.analyzeSentiment(rawTrend.title),
              sentimentScore: (Math.random() - 0.5) * 2 // -1 to 1
            },
            isActive: true
          })

          // Generate AI analysis
          try {
            const aiAnalysis = await this.generateAIAnalysis(trend)
            trend.aiAnalysis = aiAnalysis
          } catch (aiError) {
            console.error('AI analysis error:', aiError)
          }

          await trend.save()
          processedTrends.push(trend)
        }
      } catch (error) {
        console.error('Error processing trend:', rawTrend.title, error)
      }
    }

    return processedTrends
  }

  // Calculate trend score based on various factors
  calculateTrendScore(trend) {
    let score = 0

    // Twitter volume score (0-40 points)
    if (trend.platforms?.twitter?.tweetVolume) {
      score += Math.min(trend.platforms.twitter.tweetVolume / 10000 * 40, 40)
    }

    // Recency bonus (0-30 points)
    score += 30 // New trends get full recency bonus

    // Category relevance (0-20 points)
    const relevantCategories = ['technology', 'business', 'education']
    if (relevantCategories.includes(trend.category)) {
      score += 20
    } else {
      score += 10
    }

    // Keyword quality (0-10 points)
    if (trend.keywords && trend.keywords.length > 0) {
      score += Math.min(trend.keywords.length * 2, 10)
    }

    return Math.min(Math.round(score), 100)
  }

  // Analyze sentiment of trend title
  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'amazing', 'success', 'win', 'breakthrough', 'innovation']
    const negativeWords = ['bad', 'terrible', 'fail', 'crisis', 'problem', 'issue', 'concern']
    
    const lowerText = text.toLowerCase()
    const hasPositive = positiveWords.some(word => lowerText.includes(word))
    const hasNegative = negativeWords.some(word => lowerText.includes(word))
    
    if (hasPositive && !hasNegative) return 'positive'
    if (hasNegative && !hasPositive) return 'negative'
    return 'neutral'
  }

  // Categorize content based on keywords
  categorizeContent(text) {
    const categoryKeywords = {
      technology: ['ai', 'tech', 'software', 'app', 'digital', 'cyber', 'data', 'cloud', 'mobile'],
      business: ['business', 'startup', 'company', 'market', 'finance', 'economy', 'investment'],
      entertainment: ['movie', 'music', 'celebrity', 'show', 'entertainment', 'film', 'tv'],
      sports: ['sports', 'football', 'basketball', 'soccer', 'game', 'team', 'player'],
      health: ['health', 'medical', 'doctor', 'hospital', 'medicine', 'wellness', 'fitness'],
      education: ['education', 'school', 'university', 'learning', 'student', 'teacher']
    }

    const lowerText = text.toLowerCase()
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category
      }
    }
    
    return 'general'
  }

  // Extract keywords from text
  extractKeywords(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been'].includes(word))
    
    return [...new Set(words)].slice(0, 5)
  }

  // Extract hashtags from text
  extractHashtags(text) {
    const hashtagRegex = /#[\w]+/g
    const hashtags = text.match(hashtagRegex) || []
    return hashtags.map(tag => tag.substring(1)).slice(0, 5)
  }

  // Generate AI analysis for trend
  async generateAIAnalysis(trend) {
    try {
      const userProfile = {
        role: 'Content Creator',
        industry: trend.category,
        experienceLevel: 'Intermediate'
      }

      const trendData = {
        title: trend.title,
        summary: trend.description
      }

      const insights = await generateTrendInsights(userProfile, [trendData])
      
      return {
        summary: `${trend.title} is trending in the ${trend.category} category`,
        opportunities: [
          'Create educational content about this topic',
          'Share personal experiences or opinions',
          'Engage with the trending conversation'
        ],
        risks: [
          'Ensure content is accurate and well-researched',
          'Be mindful of sensitive topics',
          'Avoid jumping on trends without adding value'
        ],
        targetAudience: this.getTargetAudience(trend.category),
        bestPostingTimes: ['9:00 AM', '1:00 PM', '5:00 PM'],
        suggestedHashtags: trend.hashtags.slice(0, 3),
        competitorActivity: Math.floor(Math.random() * 100),
        lastAnalyzed: new Date()
      }
    } catch (error) {
      console.error('AI analysis generation error:', error)
      return {
        summary: `Trending topic in ${trend.category}`,
        opportunities: ['Create relevant content'],
        risks: ['Research thoroughly before posting'],
        targetAudience: ['General audience'],
        bestPostingTimes: ['9:00 AM'],
        suggestedHashtags: [],
        competitorActivity: 0,
        lastAnalyzed: new Date()
      }
    }
  }

  // Get target audience for category
  getTargetAudience(category) {
    const audiences = {
      technology: ['Tech professionals', 'Developers', 'Startup founders'],
      business: ['Entrepreneurs', 'Business professionals', 'Investors'],
      education: ['Students', 'Educators', 'Lifelong learners'],
      health: ['Health enthusiasts', 'Medical professionals', 'Wellness seekers'],
      entertainment: ['Entertainment fans', 'Pop culture enthusiasts'],
      sports: ['Sports fans', 'Athletes', 'Fitness enthusiasts']
    }
    
    return audiences[category] || ['General audience']
  }

  // Mock Twitter trends (fallback)
  getMockTwitterTrends() {
    return [
      {
        title: 'AI Revolution 2024',
        description: 'The latest developments in artificial intelligence',
        category: 'technology',
        keywords: ['ai', 'artificial intelligence', 'technology', 'innovation'],
        hashtags: ['AI', 'TechTrends', 'Innovation'],
        platforms: { twitter: { tweetVolume: 15420, rank: 1 } },
        source: 'mock'
      },
      {
        title: 'Remote Work Evolution',
        description: 'New trends in remote and hybrid work models',
        category: 'business',
        keywords: ['remote work', 'hybrid', 'productivity', 'workplace'],
        hashtags: ['RemoteWork', 'FutureOfWork', 'Productivity'],
        platforms: { twitter: { tweetVolume: 8930, rank: 2 } },
        source: 'mock'
      }
    ]
  }

  // Mock LinkedIn trends
  getMockLinkedInTrends() {
    return [
      {
        title: 'Professional Development 2024',
        description: 'Skills and strategies for career advancement',
        category: 'business',
        keywords: ['professional development', 'career', 'skills', 'growth'],
        hashtags: ['ProfessionalDevelopment', 'CareerGrowth', 'Skills'],
        platforms: { linkedin: { engagement: 5000, shares: 1200 } },
        source: 'mock'
      },
      {
        title: 'Sustainable Business Practices',
        description: 'Companies adopting eco-friendly strategies',
        category: 'business',
        keywords: ['sustainability', 'business', 'environment', 'green'],
        hashtags: ['Sustainability', 'GreenBusiness', 'ESG'],
        platforms: { linkedin: { engagement: 3500, shares: 800 } },
        source: 'mock'
      }
    ]
  }

  // Mock general trends
  getMockGeneralTrends() {
    return [
      {
        title: 'Digital Wellness',
        description: 'Balancing technology use for better mental health',
        category: 'health',
        keywords: ['digital wellness', 'mental health', 'technology', 'balance'],
        hashtags: ['DigitalWellness', 'MentalHealth', 'TechBalance'],
        platforms: { general: { mentions: 2500 } },
        source: 'mock'
      }
    ]
  }

  // Clean up old trends
  async cleanupOldTrends() {
    try {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      
      const result = await Trend.updateMany(
        {
          createdAt: { $lt: twoDaysAgo },
          'metrics.trendScore': { $lt: 20 }
        },
        { isActive: false }
      )

      console.log(`🧹 Deactivated ${result.modifiedCount} old trends`)
      return result.modifiedCount
    } catch (error) {
      console.error('Trend cleanup error:', error)
      return 0
    }
  }
}

module.exports = new TrendCollectionService()