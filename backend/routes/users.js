const express = require('express')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const Role = require('../models/Role')
const auth = require('../middleware/auth')
const { calculatePersonaScore } = require('../services/aiService')
const twitterService = require('../services/twitterService')

const router = express.Router()

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const roles = await Role.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 })

    res.json({
      user: user.toJSON(),
      roles,
      planLimits: user.getPlanLimits()
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('settings.timezone').optional().isString(),
  body('settings.theme').optional().isIn(['light', 'dark', 'system'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const user = await User.findById(req.user._id)
    const allowedUpdates = ['name', 'settings']
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'settings') {
          user.settings = { ...user.settings, ...req.body[field] }
        } else {
          user[field] = req.body[field]
        }
      }
    })

    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/users/roles
// @desc    Create new role
// @access  Private
router.post('/roles', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Role name must be at least 2 characters'),
  body('persona.industry').isString().withMessage('Industry is required'),
  body('persona.targetAudience').isString().withMessage('Target audience is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    // Check role limits
    const planLimits = req.user.getPlanLimits()
    const currentRoleCount = await Role.countDocuments({ user: req.user._id })
    
    if (currentRoleCount >= planLimits.roles && planLimits.roles !== Infinity) {
      return res.status(403).json({
        message: `Role limit reached. Maximum ${planLimits.roles} roles on ${req.user.subscription.plan} plan.`
      })
    }

    const role = new Role({
      user: req.user._id,
      ...req.body
    })

    await role.save()

    res.status(201).json({
      message: 'Role created successfully',
      role
    })
  } catch (error) {
    console.error('Create role error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/users/roles
// @desc    Get user's roles
// @access  Private
router.get('/roles', auth, async (req, res) => {
  try {
    const roles = await Role.find({ user: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 })

    res.json({ roles })
  } catch (error) {
    console.error('Get roles error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/users/roles/:id
// @desc    Update role
// @access  Private
router.put('/roles/:id', auth, async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    const allowedUpdates = ['name', 'description', 'persona', 'platforms', 'aiSettings']
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        role[field] = req.body[field]
      }
    })

    await role.save()

    res.json({
      message: 'Role updated successfully',
      role
    })
  } catch (error) {
    console.error('Update role error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/users/roles/:id
// @desc    Delete role
// @access  Private
router.delete('/roles/:id', auth, async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    if (role.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default role' })
    }

    await role.deleteOne()

    res.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Delete role error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/users/usage
// @desc    Get user usage statistics
// @access  Private
router.get('/usage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const planLimits = user.getPlanLimits()

    res.json({
      usage: user.usage,
      limits: planLimits,
      subscription: user.subscription
    })
  } catch (error) {
    console.error('Get usage error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/users/persona-score
// @desc    Get user's persona score
// @access  Private
router.get('/persona-score', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    if (!user.personaScore) {
      return res.status(404).json({ message: 'Persona score not calculated yet' })
    }

    res.json({
      scoreData: user.personaScore,
      lastUpdated: user.personaScore.lastUpdated
    })
  } catch (error) {
    console.error('Get persona score error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/users/calculate-persona-score
// @desc    Calculate user's persona score using AI
// @access  Private
router.post('/calculate-persona-score', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const roles = await Role.find({ user: req.user._id })

    // Gather social media data
    const socialData = {
      connectedAccounts: user.connectedAccounts,
      profiles: {},
      recentPosts: []
    }

    // Get Twitter profile data if connected
    if (user.connectedAccounts.twitter?.connected) {
      try {
        const twitterProfile = await twitterService.getUserProfile(user._id)
        socialData.profiles.twitter = twitterProfile
        
        const recentTweets = await twitterService.getRecentTweets(user._id, 10)
        socialData.recentPosts = socialData.recentPosts.concat(recentTweets)
      } catch (error) {
        console.log('Twitter data fetch error:', error.message)
      }
    }

    // Prepare user profile for AI analysis
    const userProfile = {
      name: user.name,
      roles: roles.map(role => ({
        name: role.name,
        industry: role.persona.industry,
        targetAudience: role.persona.targetAudience,
        toneOfVoice: role.persona.toneOfVoice
      })),
      subscription: user.subscription.plan,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) // days
    }

    // Calculate persona score using AI
    const scoreResult = await calculatePersonaScore(userProfile, socialData)

    // Store previous score for history
    const previousScore = user.personaScore?.overallScore
    if (previousScore && previousScore !== scoreResult.overallScore) {
      if (!scoreResult.history) scoreResult.history = []
      scoreResult.history.unshift({
        score: previousScore,
        date: user.personaScore.lastUpdated || user.updatedAt
      })
      // Keep only last 10 scores
      scoreResult.history = scoreResult.history.slice(0, 10)
    }

    // Update user with new score
    scoreResult.lastUpdated = new Date()
    user.personaScore = scoreResult
    await user.save()

    res.json({
      message: 'Persona score calculated successfully',
      scoreData: scoreResult
    })
  } catch (error) {
    console.error('Calculate persona score error:', error)
    res.status(500).json({ 
      message: 'Failed to calculate persona score',
      error: error.message 
    })
  }
})

module.exports = router