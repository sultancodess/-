const express = require('express')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const Role = require('../models/Role')
const auth = require('../middleware/auth')

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({
      message: 'Server error during signup'
    })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      message: 'Server error during login'
    })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    res.json({
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      message: 'Server error'
    })
  }
})

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = generateToken(req.user.id)
    
    res.json({
      token,
      message: 'Token refreshed successfully'
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      message: 'Server error during token refresh'
    })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({
    message: 'Logout successful'
  })
})

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', (req, res) => {
  // Google OAuth redirect URL
  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&scope=openid%20profile%20email&response_type=code`
  res.redirect(googleAuthUrl)
})

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_CALLBACK_URL
    })

    const { access_token } = tokenResponse.data

    // Get user info from Google
    const userResponse = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`)
    const { id, email, name, picture } = userResponse.data

    // Check if user exists
    let user = await User.findOne({ googleId: id })
    
    if (!user) {
      // Create new user
      user = new User({
        googleId: id,
        name,
        email,
        avatar: picture,
        onboardingCompleted: false
      })
      await user.save()
    }

    // Generate JWT token
    const token = generateToken(user._id)
    
    // Redirect to frontend with token
    const redirectUrl = user.onboardingCompleted 
      ? `${process.env.FRONTEND_URL}/dashboard?token=${token}`
      : `${process.env.FRONTEND_URL}/onboarding?token=${token}`
      
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`)
  }
})

// @route   POST /api/auth/complete-onboarding
// @desc    Complete user onboarding with persona setup
// @access  Private
router.post('/complete-onboarding', auth, [
  body('role').isString().withMessage('Role is required'),
  body('industry').isString().withMessage('Industry is required'),
  body('experienceLevel').isString().withMessage('Experience level is required'),
  body('brandingGoal').isString().withMessage('Branding goal is required'),
  body('tone').isString().withMessage('Tone is required'),
  body('topicsKeywords').isArray().withMessage('Topics and keywords must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { role, industry, experienceLevel, brandingGoal, tone, topicsKeywords } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    // Create primary role/persona
    const primaryRole = new Role({
      user: user._id,
      name: `${role} - ${industry}`,
      description: `${role} focused on ${brandingGoal.toLowerCase()} in ${industry}`,
      persona: {
        industry: industry.toLowerCase(),
        targetAudience: getTargetAudience(role, industry),
        toneOfVoice: tone.toLowerCase(),
        contentTypes: getContentTypes(brandingGoal),
        keywords: topicsKeywords,
        hashtags: generateHashtags(topicsKeywords),
        brandingGoal,
        experienceLevel
      },
      isDefault: true,
      isActive: true
    })

    await primaryRole.save()

    // Generate AI persona audit
    const personaAudit = await generatePersonaAudit(user, primaryRole)

    // Update user onboarding status
    user.onboardingCompleted = true
    user.onboardingStep = 5
    await user.save()

    res.json({
      message: 'Onboarding completed successfully',
      user: user.toJSON(),
      primaryRole,
      personaAudit
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    res.status(500).json({
      message: 'Server error during onboarding'
    })
  }
})

// Helper functions for onboarding
function getTargetAudience(role, industry) {
  const audiences = {
    'Student': 'fellow students and entry-level professionals',
    'Developer': 'tech professionals and hiring managers',
    'Creator': 'content consumers and brand collaborators',
    'Professional': 'industry peers and potential clients'
  }
  return audiences[role] || 'professionals in ' + industry
}

function getContentTypes(brandingGoal) {
  const contentMap = {
    'Job Offers': ['professional', 'educational', 'personal'],
    'Thought Leadership': ['educational', 'opinion', 'insights'],
    'Audience Growth': ['entertaining', 'educational', 'engaging']
  }
  return contentMap[brandingGoal] || ['professional', 'educational']
}

function generateHashtags(keywords) {
  return keywords.slice(0, 5).map(keyword => 
    keyword.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
  )
}

async function generatePersonaAudit(user, role) {
  // This would integrate with AI service for persona audit
  return {
    personaScore: 65, // Initial score
    suggestedBio: `${role.persona.experienceLevel} ${user.name.split(' ')[0]} | ${role.persona.industry} enthusiast | Sharing insights on ${role.persona.keywords.slice(0, 3).join(', ')}`,
    starterPosts: [
      {
        type: 'introduction',
        content: `👋 Hi! I'm ${user.name.split(' ')[0]}, a ${role.persona.experienceLevel.toLowerCase()} ${role.name.split(' - ')[0].toLowerCase()} passionate about ${role.persona.keywords[0]}. Excited to share my journey and connect with like-minded professionals!`
      },
      {
        type: 'insight',
        content: `💡 Key insight from my ${role.persona.industry} experience: ${role.persona.keywords[0]} is transforming how we work. Here's what I've learned...`
      },
      {
        type: 'engagement',
        content: `🤔 Question for the ${role.persona.industry} community: What's the biggest challenge you're facing with ${role.persona.keywords[0]}? Let's discuss solutions!`
      }
    ]
  }
}

module.exports = router