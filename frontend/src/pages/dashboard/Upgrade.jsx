import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Check, Zap, Users, BarChart3, Calendar, Bell, Shield, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const Upgrade = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      popular: false,
      features: [
        '1 Connected Platform (X)',
        '1 Role/Persona',
        '5 AI posts per day',
        'Trends preview (Top 3/day)',
        'Basic analytics',
        'Community support'
      ],
      limitations: [
        'Limited AI generations',
        'Basic trend insights',
        'No scheduling',
        'No advanced analytics'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For serious content creators',
      popular: true,
      features: [
        'Multiple platforms (coming soon)',
        'Unlimited roles/personas',
        'Unlimited AI posts',
        'Full trends access',
        'Advanced analytics',
        'Post scheduling',
        'Persona score tracking',
        'Content optimization',
        'Priority support',
        '7-day free trial'
      ],
      limitations: []
    },
    {
      id: 'agency',
      name: 'Agency',
      price: '$49',
      period: 'per month',
      description: 'For teams and agencies',
      popular: false,
      features: [
        'Everything in Pro',
        'Multi-account management',
        'Team collaboration',
        'White-label reports',
        'Custom integrations',
        'Advanced persona insights',
        'Bulk content generation',
        'API access',
        'Dedicated support',
        'Custom onboarding'
      ],
      limitations: []
    }
  ]

  const handleUpgrade = async (planId) => {
    if (planId === 'free') return

    setLoading(true)
    try {
      // Create Razorpay subscription
      const response = await axios.post('/api/billing/create-subscription', {
        plan: planId
      })

      const { subscriptionId, amount, currency } = response.data

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        subscription_id: subscriptionId,
        amount: amount,
        currency: currency,
        name: 'PersonaPilot.io',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Subscription`,
        image: '/logo.png',
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post('/api/billing/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId
            })

            toast.success('Subscription activated successfully! 🎉')
            window.location.reload()
          } catch (error) {
            console.error('Payment verification failed:', error)
            toast.error('Payment verification failed')
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: {
          color: '#4F46E5'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error('Failed to initiate upgrade')
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = user?.subscription?.plan || 'free'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold flex items-center justify-center mb-4">
            <Crown className="mr-3 h-10 w-10 text-primary" />
            Upgrade Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of PersonaPilot.io with advanced AI features, 
            unlimited content generation, and powerful analytics.
          </p>
        </motion.div>
      </div>

      {/* Current Plan Status */}
      {currentPlan !== 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</h3>
                  <p className="text-muted-foreground">
                    {user?.subscription?.status === 'active' ? 'Your subscription is active' : 'Subscription status: ' + user?.subscription?.status}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className={`h-full relative ${
              plan.popular ? 'border-primary shadow-lg scale-105' : ''
            } ${currentPlan === plan.id ? 'bg-primary/5 border-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              {currentPlan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Current Plan
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <CardDescription className="text-base mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      What's included:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations for free plan */}
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-muted-foreground">
                        Limitations:
                      </h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-start">
                            <span className="h-4 w-4 text-muted-foreground mr-3 mt-0.5">•</span>
                            <span className="text-sm text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="pt-4">
                    {currentPlan === plan.id ? (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : plan.id === 'free' ? (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        disabled={currentPlan !== 'free'}
                      >
                        {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={loading}
                      >
                        {loading ? (
                          'Processing...'
                        ) : plan.id === 'pro' && currentPlan === 'free' ? (
                          'Start 7-Day Free Trial'
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Why Upgrade to Pro?</CardTitle>
            <CardDescription className="text-center">
              Unlock advanced PersonaPilot.io features to supercharge your personal brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-fit mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Unlimited AI Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Generate unlimited AI-powered posts tailored to your personas
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-fit mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Advanced Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Deep insights into your content performance and persona growth
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-fit mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Smart Scheduling</h4>
                <p className="text-sm text-muted-foreground">
                  Schedule posts for optimal engagement times automatically
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-fit mx-auto mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Multiple Personas</h4>
                <p className="text-sm text-muted-foreground">
                  Create unlimited personas for different aspects of your brand
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What's included in the free trial?</h4>
                <p className="text-sm text-muted-foreground">
                  The 7-day free trial includes all Pro features. No credit card required to start.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Do you offer refunds?</h4>
                <p className="text-sm text-muted-foreground">
                  We offer a 30-day money-back guarantee if you're not satisfied with PersonaPilot.io.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Can I upgrade or downgrade later?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can change your plan at any time. Changes take effect at the next billing cycle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Upgrade