const express = require('express')
const axios = require('axios')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/connections/twitter/auth
// @desc    Redirect to Twitter OAuth
// @access  Private
router.get('/twitter/auth', auth, (req, res) => {
  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${process.env.TWITTER_CALLBACK_URL}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${req.user._id}&code_challenge=challenge&code_challenge_method=plain`
  res.redirect(twitterAuthUrl)
})

// @route   GET /api/connections/twitter/callback
// @desc    Twitter OAuth callback
// @access  Public
router.get('/twitter/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', {
      client_id: process.env.TWITTER_CLIENT_ID,
      client_secret: process.env.TWITTER_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TWITTER_CALLBACK_URL,
      code_verifier: 'challenge'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const { access_token, refresh_token } = tokenResponse.data

    // Get user info from Twitter
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    const { username } = userResponse.data.data

    // Update user's connected accounts
    const user = await User.findById(userId)
    if (user) {
      user.connectedAccounts.twitter = {
        connected: true,
        username,
        accessToken: access_token,
        refreshToken: refresh_token,
        connectedAt: new Date()
      }
      await user.save()
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/connections?twitter=connected`)
  } catch (error) {
    console.error('Twitter connection error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/connections?error=twitter_failed`)
  }
})

// @route   GET /api/connections/linkedin/auth
// @desc    Redirect to LinkedIn OAuth
// @access  Private
router.get('/linkedin/auth', auth, (req, res) => {
  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_CALLBACK_URL}&scope=r_liteprofile%20r_emailaddress%20w_member_social&state=${req.user._id}`
  res.redirect(linkedinAuthUrl)
})

// @route   GET /api/connections/linkedin/callback
// @desc    LinkedIn OAuth callback
// @access  Public
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const { access_token } = tokenResponse.data

    // Get user info from LinkedIn
    const userResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    const { localizedFirstName, localizedLastName } = userResponse.data
    const username = `${localizedFirstName} ${localizedLastName}`

    // Update user's connected accounts
    const user = await User.findById(userId)
    if (user) {
      user.connectedAccounts.linkedin = {
        connected: true,
        username,
        accessToken: access_token,
        connectedAt: new Date()
      }
      await user.save()
    }

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/connections?linkedin=connected`)
  } catch (error) {
    console.error('LinkedIn connection error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/connections?error=linkedin_failed`)
  }
})

// @route   POST /api/connections/twitter/disconnect
// @desc    Disconnect Twitter account
// @access  Private
router.post('/twitter/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.connectedAccounts.twitter = {
      connected: false,
      username: null,
      accessToken: null,
      refreshToken: null,
      connectedAt: null
    }
    await user.save()

    res.json({ message: 'Twitter account disconnected successfully' })
  } catch (error) {
    console.error('Twitter disconnect error:', error)
    res.status(500).json({ message: 'Failed to disconnect Twitter account' })
  }
})

// @route   POST /api/connections/linkedin/disconnect
// @desc    Disconnect LinkedIn account
// @access  Private
router.post('/linkedin/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.connectedAccounts.linkedin = {
      connected: false,
      username: null,
      accessToken: null,
      connectedAt: null
    }
    await user.save()

    res.json({ message: 'LinkedIn account disconnected successfully' })
  } catch (error) {
    console.error('LinkedIn disconnect error:', error)
    res.status(500).json({ message: 'Failed to disconnect LinkedIn account' })
  }
})

// @route   GET /api/connections/status
// @desc    Get connection status for all platforms
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    res.json({
      twitter: {
        connected: user.connectedAccounts?.twitter?.connected || false,
        username: user.connectedAccounts?.twitter?.username || null,
        connectedAt: user.connectedAccounts?.twitter?.connectedAt || null
      },
      linkedin: {
        connected: user.connectedAccounts?.linkedin?.connected || false,
        username: user.connectedAccounts?.linkedin?.username || null,
        connectedAt: user.connectedAccounts?.linkedin?.connectedAt || null
      }
    })
  } catch (error) {
    console.error('Get connections status error:', error)
    res.status(500).json({ message: 'Failed to get connection status' })
  }
})

module.exports = router