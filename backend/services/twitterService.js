const axios = require('axios')
const User = require('../models/User')
const Trend = require('../models/Trend')

class TwitterService {
  constructor() {
    this.baseURL = 'https://api.twitter.com/2'
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN
  }

  // Get trending topics
  async getTrendingTopics(woeid = 1) { // 1 = worldwide
    try {
      const response = await axios.get(`${this.baseURL}/trends/place`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        params: {
          id: woeid
        }
      })

      const trends = response.data[0]?.trends || []
      
      // Process and save trends to database
      const processedTrends = await Promise.all(
        trends.slice(0, 20).map(async (trend, index) => {
          const existingTrend = await Trend.findOne({ 
            title: trend.name,
            'platforms.twitter.woeid': woeid 
          })

          if (existingTrend) {
            // Update existing trend
            existingTrend.platforms.twitter.tweetVolume = trend.tweet_volume || 0
            existingTrend.platforms.twitter.rank = index + 1
            existingTrend.calculateTrendScore()
            await existingTrend.save()
            return existingTrend
          } else {
            // Create new trend
            const newTrend = new Trend({
              title: trend.name,
              category: this.categorizeTrend(trend.name),
              keywords: this.extractKeywords(trend.name),
              hashtags: this.extractHashtags(trend.name),
              platforms: {
                twitter: {
                  tweetVolume: trend.tweet_volume || 0,
                  url: trend.url,
                  woeid: woeid,
                  rank: index + 1
                }
              },
              location: {
                country: woeid === 1 ? 'Global' : 'Unknown'
              }
            })

            newTrend.calculateTrendScore()
            await newTrend.save()
            return newTrend
          }
        })
      )

      return processedTrends
    } catch (error) {
      console.error('Twitter API error:', error.response?.data || error.message)
      throw new Error('Failed to fetch trending topics')
    }
  }

  // Post tweet
  async postTweet(userId, content, mediaIds = []) {
    try {
      const user = await User.findById(userId)
      if (!user.twitterAccessToken) {
        throw new Error('Twitter account not connected')
      }

      const tweetData = {
        text: content
      }

      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds }
      }

      const response = await axios.post(`${this.baseURL}/tweets`, tweetData, {
        headers: {
          'Authorization': `Bearer ${user.twitterAccessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return {
        tweetId: response.data.data.id,
        url: `https://twitter.com/user/status/${response.data.data.id}`,
        text: response.data.data.text
      }
    } catch (error) {
      console.error('Tweet posting error:', error.response?.data || error.message)
      throw new Error('Failed to post tweet')
    }
  }

  // Get tweet metrics
  async getTweetMetrics(tweetId) {
    try {
      const response = await axios.get(`${this.baseURL}/tweets/${tweetId}`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        params: {
          'tweet.fields': 'public_metrics,created_at',
          'expansions': 'author_id'
        }
      })

      const tweet = response.data.data
      const metrics = tweet.public_metrics

      return {
        impressions: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        quotes: metrics.quote_count || 0,
        bookmarks: metrics.bookmark_count || 0,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Tweet metrics error:', error.response?.data || error.message)
      return null
    }
  }

  // Search tweets
  async searchTweets(query, maxResults = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/tweets/search/recent`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`
        },
        params: {
          query: query,
          max_results: maxResults,
          'tweet.fields': 'public_metrics,created_at,context_annotations',
          'expansions': 'author_id'
        }
      })

      return response.data.data || []
    } catch (error) {
      console.error('Tweet search error:', error.response?.data || error.message)
      return []
    }
  }

  // Helper methods
  categorizeTrend(trendName) {
    const categories = {
      technology: ['tech', 'ai', 'crypto', 'blockchain', 'software', 'app', 'digital'],
      business: ['business', 'startup', 'finance', 'market', 'economy', 'stock'],
      entertainment: ['movie', 'music', 'celebrity', 'show', 'netflix', 'disney'],
      sports: ['football', 'basketball', 'soccer', 'olympics', 'nfl', 'nba'],
      politics: ['election', 'president', 'government', 'policy', 'vote'],
      health: ['health', 'covid', 'vaccine', 'medical', 'wellness'],
      lifestyle: ['fashion', 'food', 'travel', 'lifestyle', 'beauty']
    }

    const lowerTrend = trendName.toLowerCase()
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerTrend.includes(keyword))) {
        return category
      }
    }

    return 'general'
  }

  extractKeywords(text) {
    // Simple keyword extraction
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5)
  }

  extractHashtags(text) {
    const hashtagRegex = /#[\w]+/g
    const hashtags = text.match(hashtagRegex) || []
    return hashtags.map(tag => tag.substring(1))
  }
}

module.exports = new TwitterService()