const axios = require('axios')
const User = require('../models/User')

class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2'
  }

  // Get user's LinkedIn access token
  async getAccessToken(userId) {
    const user = await User.findById(userId)
    if (!user?.connectedAccounts?.linkedin?.accessToken) {
      throw new Error('LinkedIn account not connected')
    }
    return user.connectedAccounts.linkedin.accessToken
  }

  // Get user's LinkedIn profile
  async getUserProfile(userId) {
    try {
      const accessToken = await this.getAccessToken(userId)
      
      const response = await axios.get(`${this.baseURL}/people/~`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          projection: '(id,firstName,lastName,headline,summary,industry,location,pictureInfo,positions)'
        }
      })

      return {
        id: response.data.id,
        name: `${response.data.firstName?.localized?.en_US} ${response.data.lastName?.localized?.en_US}`,
        headline: response.data.headline?.localized?.en_US,
        summary: response.data.summary?.localized?.en_US,
        industry: response.data.industry?.localized?.en_US,
        location: response.data.location?.name,
        profilePicture: response.data.pictureInfo?.displayImage,
        positions: response.data.positions?.elements || []
      }
    } catch (error) {
      console.error('LinkedIn profile fetch error:', error.response?.data || error.message)
      throw new Error('Failed to fetch LinkedIn profile')
    }
  }

  // Get user's recent LinkedIn posts
  async getRecentPosts(userId, limit = 10) {
    try {
      const accessToken = await this.getAccessToken(userId)
      
      const response = await axios.get(`${this.baseURL}/shares`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          q: 'owners',
          owners: 'urn:li:person:' + (await this.getUserProfile(userId)).id,
          count: limit,
          projection: '(elements*(id,text,commentary,created,lastModified,lifecycleState,visibility))'
        }
      })

      return response.data.elements?.map(post => ({
        id: post.id,
        text: post.text?.text || post.commentary,
        createdAt: new Date(post.created.time),
        engagement: {
          // LinkedIn API doesn't provide engagement metrics in basic tier
          likes: 0,
          comments: 0,
          shares: 0
        }
      })) || []
    } catch (error) {
      console.error('LinkedIn posts fetch error:', error.response?.data || error.message)
      return [] // Return empty array if posts can't be fetched
    }
  }

  // Post to LinkedIn
  async createPost(userId, content, options = {}) {
    try {
      const accessToken = await this.getAccessToken(userId)
      const profile = await this.getUserProfile(userId)
      
      const postData = {
        author: `urn:li:person:${profile.id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }

      // Add media if provided
      if (options.media && options.media.length > 0) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE'
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = options.media.map(mediaUrl => ({
          status: 'READY',
          media: mediaUrl
        }))
      }

      const response = await axios.post(`${this.baseURL}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      })

      return {
        postId: response.data.id,
        url: `https://www.linkedin.com/feed/update/${response.data.id}`,
        success: true
      }
    } catch (error) {
      console.error('LinkedIn post creation error:', error.response?.data || error.message)
      throw new Error('Failed to post to LinkedIn')
    }
  }

  // Get post analytics (requires LinkedIn Marketing API)
  async getPostAnalytics(userId, postId) {
    try {
      const accessToken = await this.getAccessToken(userId)
      
      // Note: This requires LinkedIn Marketing API access
      const response = await axios.get(`${this.baseURL}/socialActions/${postId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return {
        likes: response.data.numLikes || 0,
        comments: response.data.numComments || 0,
        shares: response.data.numShares || 0,
        impressions: response.data.numImpressions || 0,
        clicks: response.data.numClicks || 0
      }
    } catch (error) {
      console.error('LinkedIn analytics fetch error:', error.response?.data || error.message)
      // Return default metrics if analytics can't be fetched
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        clicks: 0
      }
    }
  }

  // Search for trending content in user's industry
  async getTrendingContent(userId, industry, limit = 10) {
    try {
      const accessToken = await this.getAccessToken(userId)
      
      // This is a simplified version - LinkedIn's content search is limited
      const response = await axios.get(`${this.baseURL}/shares`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          q: 'search',
          keywords: industry,
          count: limit
        }
      })

      return response.data.elements?.map(post => ({
        id: post.id,
        text: post.text?.text || post.commentary,
        author: post.author,
        createdAt: new Date(post.created.time),
        engagement: {
          likes: post.numLikes || 0,
          comments: post.numComments || 0,
          shares: post.numShares || 0
        }
      })) || []
    } catch (error) {
      console.error('LinkedIn trending content error:', error.response?.data || error.message)
      return []
    }
  }

  // Update user's LinkedIn connection status
  async updateConnectionStatus(userId, connectionData) {
    try {
      const user = await User.findById(userId)
      
      user.connectedAccounts.linkedin = {
        connected: true,
        username: connectionData.username,
        accessToken: connectionData.accessToken,
        refreshToken: connectionData.refreshToken,
        connectedAt: new Date()
      }

      await user.save()
      return true
    } catch (error) {
      console.error('LinkedIn connection update error:', error)
      throw new Error('Failed to update LinkedIn connection')
    }
  }

  // Disconnect LinkedIn account
  async disconnectAccount(userId) {
    try {
      const user = await User.findById(userId)
      
      user.connectedAccounts.linkedin = {
        connected: false,
        username: '',
        accessToken: '',
        refreshToken: '',
        connectedAt: null
      }

      await user.save()
      return true
    } catch (error) {
      console.error('LinkedIn disconnection error:', error)
      throw new Error('Failed to disconnect LinkedIn account')
    }
  }
}

module.exports = new LinkedInService()