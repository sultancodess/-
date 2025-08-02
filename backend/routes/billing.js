const express = require('express')
const Razorpay = require('razorpay')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// @route   POST /api/billing/create-subscription
// @desc    Create Razorpay subscription
// @access  Private
router.post('/create-subscription', auth, async (req, res) => {
  try {
    const { plan } = req.body // 'pro' or 'agency'
    
    if (!['pro', 'agency'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' })
    }

    const planDetails = {
      pro: {
        amount: 1900, // ₹19.00
        period: 'monthly',
        interval: 1
      },
      agency: {
        amount: 4900, // ₹49.00
        period: 'monthly',
        interval: 1
      }
    }

    const planConfig = planDetails[plan]

    // Create Razorpay plan if it doesn't exist
    const razorpayPlan = await razorpay.plans.create({
      period: planConfig.period,
      interval: planConfig.interval,
      item: {
        name: `PersonaPilot ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        amount: planConfig.amount,
        currency: 'INR'
      }
    })

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlan.id,
      customer_notify: 1,
      total_count: 12, // 12 months
      notes: {
        userId: req.user._id.toString(),
        plan: plan
      }
    })

    res.json({
      subscriptionId: subscription.id,
      planId: razorpayPlan.id,
      amount: planConfig.amount,
      currency: 'INR'
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/billing/verify-payment
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_signature,
      plan 
    } = req.body

    // Verify signature (implement signature verification)
    // This is a simplified version - implement proper signature verification
    
    // Update user subscription
    const user = await User.findById(req.user._id)
    
    user.subscription = {
      plan: plan,
      status: 'active',
      razorpaySubscriptionId: razorpay_subscription_id,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      trialEnd: plan === 'pro' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null // 7 day trial for pro
    }

    await user.save()

    res.json({
      message: 'Payment verified and subscription activated',
      subscription: user.subscription
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   GET /api/billing/subscription
// @desc    Get current subscription details
// @access  Private
router.get('/subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    let subscriptionDetails = null
    
    if (user.subscription.razorpaySubscriptionId) {
      try {
        subscriptionDetails = await razorpay.subscriptions.fetch(
          user.subscription.razorpaySubscriptionId
        )
      } catch (error) {
        console.error('Fetch subscription error:', error)
      }
    }

    res.json({
      subscription: user.subscription,
      razorpayDetails: subscriptionDetails,
      planLimits: user.getPlanLimits()
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// @route   POST /api/billing/cancel-subscription
// @desc    Cancel subscription
// @access  Private
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    if (!user.subscription.razorpaySubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' })
    }

    // Cancel Razorpay subscription
    await razorpay.subscriptions.cancel(user.subscription.razorpaySubscriptionId)

    // Update user subscription status
    user.subscription.status = 'cancelled'
    await user.save()

    res.json({
      message: 'Subscription cancelled successfully'
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router