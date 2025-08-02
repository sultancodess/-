const express = require('express')
const Trend = require('../models/Trend')
const Role = require('../models/Role')
const auth = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/trends
// @desc    Get trends for user's roles
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, limit = 10, roleId } = req.query
    
    let trends
    
    if (roleId) {
      // Get trends for specific role
      const role = await Role.findOne({ _id: roleId, user: req.user._id })
      if (!role) {
        return res.status(404).json({ message: 'Role not found' })
      }
      trends = await Trend.getForRole(role, parseInt(limit))
    } else {
      // Get general trends
      const query = {
        isActive: true,
        ...(category && { category })
      }
      
      trends = await Trend.find(query)
        .sort({ 'metrics.trendScore': -1, createdAt: -1 })
        .limit(parseInt(limit))
        .lean()
    }

    res.json({
      trends,
      count: trends.length
    })
  } catch (error) {
    console.error('Get trends error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/trends/:id
// @desc    Get single trend with analysis
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const trend = await Trend.findById(req.params.id)
    
    if (!trend) {
      return res.status(404).json({ message: 'Trend not found' })
    }

    // Get content analysis
    const analysis = await trend.analyzeForContent()

    res.json({
      trend,
      analysis
    })
  } catch (error) {
    console.error('Get trend error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/trends/hashtags/trending
// @desc    Get trending hashtags
// @access  Private
router.get('/hashtags/trending', auth, async (req, res) => {
  try {
    const { category, limit = 20 } = req.query
    
    const hashtags = await Trend.getTrendingHashtags(category, parseInt(limit))

    res.json({
      hashtags
    })
  } catch (error) {
    console.error('Get trending hashtags error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router