const express = require('express')
const { body, validationResult } = require('express-validator')
const Post = require('../models/Post')
const Role = require('../models/Role')
const Trend = require('../models/Trend')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { generateContent, generateTrendBasedContent, generateCustomContent, generateVariations, optimizeForEngagement } = require('../services/aiService')
const twitterService = require('../services/twitterService')

const router = express.Router()

// @route   POST /api/posts/generate
// @desc    Generate AI content for post using new system
// @access  Private
router.post('/generate', auth, [
  body('roleId').isMongoId().withMessage('Valid role ID required'),
  body('contentType').isString().withMessage('Content type required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { roleId, contentType, trendId, customPrompt, platform = 'X' } = req.body
    
    // Check user's daily limit
    const user = await User.findById(req.user._id)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayPosts = await Post.countDocuments({
      user: req.user._id,
      createdAt: { $gte: today },
      aiGenerated: true
    })

    const dailyLimit = user.subscription.plan === 'free' ? 5 : Infinity
    if (todayPosts >= dailyLimit) {
      return res.status(403).json({
        message: `Daily AI generation limit reached (${dailyLimit} posts)`
      })
    }

    // Get role data
    const role = await Role.findOne({ _id: roleId, user: req.user._id })
    if (!role) {
      return res.status(404).json({ message: 'Role not found' })
    }

    // Build user profile for AI
    const userProfile = {
      role: role.name.split(' - ')[0], // Extract role from "Developer - Technology"
      industry: role.persona.industry,
      tone: role.persona.toneOfVoice,
      brandingGoal: role.persona.brandingGoal || 'Audience Growth',
      topicsKeywords: role.persona.keywords,
      experienceLevel: role.persona.experienceLevel || 'Intermediate'
    }

    let postVariations

    if (trendId) {
      // Trend-based generation
      const trend = await Trend.findById(trendId)
      if (!trend) {
        return res.status(404).json({ message: 'Trend not found' })
      }

      const trendData = {
        title: trend.title,
        summary: trend.description || `Trending topic in ${userProfile.industry}`
      }

      postVariations = await generateTrendBasedContent(userProfile, trendData, platform)
    } else if (customPrompt) {
      // Custom content enhancement
      postVariations = await generateCustomContent(userProfile, customPrompt, platform)
    } else {
      // Fallback to legacy system
      const prompt = `Generate a ${contentType} social media post for a ${role.name} in the ${role.persona.industry} industry. Target audience: ${role.persona.targetAudience}. Tone: ${role.persona.toneOfVoice}. Include relevant hashtags from: ${role.persona.keywords.join(', ')}. Keep it under 280 characters.`
      
      const generatedContent = await generateContent(prompt, {
        creativity: 0.7,
        maxLength: 280
      })

      postVariations = {
        post_variations: [{
          version: 1,
          hook: '',
          body: generatedContent.text,
          hashtags: generatedContent.hashtags
        }]
      }
    }

    // Create post record with first variation
    const firstVariation = postVariations.post_variations[0]
    const content = firstVariation.hook 
      ? `${firstVariation.hook}\n\n${firstVariation.body}` 
      : firstVariation.body

    const post = new Post({
      user: req.user._id,
      role: roleId,
      content: content,
      hashtags: firstVariation.hashtags || [],
      aiGenerated: true,
      trend: trendId || null,
      platforms: {
        [platform.toLowerCase()]: {
          enabled: true,
          content: content
        }
      },
      status: 'draft'
    })

    await post.save()

    res.json({
      message: 'Content generated successfully',
      post,
      postVariations,
      remainingGenerations: dailyLimit - todayPosts - 1
    })
  } catch (error) {
    console.error('Generate content error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/posts
// @desc    Get user's posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, roleId, limit = 20, page = 1 } = req.query
    
    const query = { user: req.user._id, isArchived: false }
    
    if (status) query.status = status
    if (roleId) query.role = roleId

    const posts = await Post.find(query)
      .populate('role', 'name persona.industry')
      .populate('trend', 'title category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await Post.countDocuments(query)

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', auth, [
  body('content').optional().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (post.status === 'published') {
      return res.status(400).json({ message: 'Cannot edit published posts' })
    }

    // Update allowed fields
    const allowedUpdates = ['content', 'hashtags', 'scheduledFor', 'status']
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field]
      }
    })

    await post.save()

    res.json({
      message: 'Post updated successfully',
      post
    })
  } catch (error) {
    console.error('Update post error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (post.status === 'published') {
      // Archive instead of delete
      post.isArchived = true
      await post.save()
    } else {
      await post.deleteOne()
    }

    res.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
// @ro
ute   POST /api/posts/:id/publish
// @desc    Publish post to Twitter
// @access  Private
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (post.status === 'published') {
      return res.status(400).json({ message: 'Post already published' })
    }

    // Format content for Twitter
    const formattedContent = post.formatForPlatform('twitter')

    try {
      // Publish to Twitter
      const tweetResult = await twitterService.postTweet(req.user._id, formattedContent)
      
      // Update post with Twitter data
      post.status = 'published'
      post.publishedAt = new Date()
      post.platforms.twitter.tweetId = tweetResult.tweetId
      post.platforms.twitter.url = tweetResult.url

      await post.save()

      res.json({
        message: 'Post published successfully',
        post,
        tweetUrl: tweetResult.url
      })
    } catch (twitterError) {
      post.status = 'failed'
      await post.save()
      
      res.status(500).json({
        message: 'Failed to publish to Twitter',
        error: twitterError.message
      })
    }
  } catch (error) {
    console.error('Publish post error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/posts/:id/schedule
// @desc    Schedule post for later
// @access  Private
router.post('/:id/schedule', auth, [
  body('scheduledFor').isISO8601().withMessage('Valid date required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { scheduledFor } = req.body
    const scheduledDate = new Date(scheduledFor)

    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' })
    }

    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    post.status = 'scheduled'
    post.scheduledFor = scheduledDate
    await post.save()

    res.json({
      message: 'Post scheduled successfully',
      post
    })
  } catch (error) {
    console.error('Schedule post error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/posts/:id/variations
// @desc    Generate variations of a post
// @access  Private
router.post('/:id/variations', auth, async (req, res) => {
  try {
    const { count = 3 } = req.body
    
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const variations = await generateVariations(post.content, count)

    res.json({
      message: 'Variations generated successfully',
      original: post.content,
      variations
    })
  } catch (error) {
    console.error('Generate variations error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/posts/:id/optimize
// @desc    Optimize post for engagement
// @access  Private
router.post('/:id/optimize', auth, async (req, res) => {
  try {
    const { platform = 'twitter' } = req.body
    
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const optimization = await optimizeForEngagement(post.content, platform)

    res.json({
      message: 'Post optimized successfully',
      optimization
    })
  } catch (error) {
    console.error('Optimize post error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/posts/:id/metrics
// @desc    Get post metrics from Twitter
// @access  Private
router.get('/:id/metrics', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id })
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!post.platforms.twitter.tweetId) {
      return res.status(400).json({ message: 'Post not published to Twitter' })
    }

    // Fetch latest metrics from Twitter
    const metrics = await twitterService.getTweetMetrics(post.platforms.twitter.tweetId)
    
    if (metrics) {
      // Update post with latest metrics
      post.platforms.twitter.metrics = metrics
      post.calculatePerformanceScore()
      await post.save()
    }

    res.json({
      metrics: post.platforms.twitter.metrics,
      performanceScore: post.performance.score,
      engagementRate: post.engagementRate
    })
  } catch (error) {
    console.error('Get metrics error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/posts/scheduled
// @desc    Get scheduled posts
// @access  Private
router.get('/scheduled', auth, async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.user._id,
      status: 'scheduled',
      scheduledFor: { $gte: new Date() }
    })
    .populate('role', 'name')
    .sort({ scheduledFor: 1 })

    res.json({ posts })
  } catch (error) {
    console.error('Get scheduled posts error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/posts/bulk-schedule
// @desc    Schedule multiple posts
// @access  Private
router.post('/bulk-schedule', auth, [
  body('posts').isArray().withMessage('Posts array required'),
  body('posts.*.postId').isMongoId().withMessage('Valid post ID required'),
  body('posts.*.scheduledFor').isISO8601().withMessage('Valid date required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { posts: postsToSchedule } = req.body
    const results = []

    for (const item of postsToSchedule) {
      try {
        const post = await Post.findOne({ 
          _id: item.postId, 
          user: req.user._id 
        })
        
        if (post && new Date(item.scheduledFor) > new Date()) {
          post.status = 'scheduled'
          post.scheduledFor = new Date(item.scheduledFor)
          await post.save()
          
          results.push({
            postId: item.postId,
            success: true,
            scheduledFor: item.scheduledFor
          })
        } else {
          results.push({
            postId: item.postId,
            success: false,
            error: 'Invalid post or date'
          })
        }
      } catch (error) {
        results.push({
          postId: item.postId,
          success: false,
          error: error.message
        })
      }
    }

    res.json({
      message: 'Bulk scheduling completed',
      results
    })
  } catch (error) {
    console.error('Bulk schedule error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})