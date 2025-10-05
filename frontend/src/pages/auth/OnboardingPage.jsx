import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  User, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Zap,
  Briefcase,
  GraduationCap,
  Users,
  Lightbulb,
  MessageSquare,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [onboardingData, setOnboardingData] = useState({
    role: '',
    industry: '',
    experienceLevel: '',
    brandingGoal: '',
    tone: '',
    topicsKeywords: []
  })

  const [personaAudit, setPersonaAudit] = useState(null)

  // Handle token from Google OAuth redirect
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // The user context will be updated automatically
    }
  }, [searchParams])

  const roles = [
    { value: 'Student', label: 'Student', icon: GraduationCap, description: 'Building skills and seeking opportunities' },
    { value: 'Developer', label: 'Developer', icon: User, description: 'Creating solutions and sharing technical insights' },
    { value: 'Creator', label: 'Creator', icon: Lightbulb, description: 'Building audience and monetizing content' },
    { value: 'Professional', label: 'Professional', icon: Briefcase, description: 'Advancing career and industry presence' }
  ]

  const industries = [
    'Technology', 'Business', 'Marketing', 'Healthcare', 'Education',
    'Finance', 'Entertainment', 'Sports', 'Travel', 'Food & Beverage',
    'Fashion', 'Real Estate', 'Automotive', 'Non-profit', 'Other'
  ]

  const experienceLevels = [
    'Beginner', 'Intermediate', 'Advanced', 'Expert'
  ]

  const brandingGoals = [
    { value: 'Job Offers', label: 'Job Offers', icon: Briefcase, description: 'Attract recruiters and job opportunities' },
    { value: 'Thought Leadership', label: 'Thought Leadership', icon: Lightbulb, description: 'Establish expertise and influence' },
    { value: 'Audience Growth', label: 'Audience Growth', icon: Users, description: 'Build following and engagement' }
  ]

  const toneOptions = [
    { value: 'Professional', label: 'Professional', description: 'Formal, authoritative, business-focused' },
    { value: 'Motivational', label: 'Motivational', description: 'Inspiring, uplifting, encouraging' },
    { value: 'Casual', label: 'Casual', description: 'Relaxed, conversational, approachable' },
    { value: 'Thought Leader', label: 'Thought Leader', description: 'Insightful, analytical, forward-thinking' }
  ]

  const commonTopics = {
    'Student': ['Career Advice', 'Learning', 'Internships', 'Skills Development', 'Networking'],
    'Developer': ['React', 'JavaScript', 'Python', 'AI Tools', 'Web Development', 'Open Source'],
    'Creator': ['Content Strategy', 'Social Media', 'Personal Branding', 'Monetization', 'Audience Building'],
    'Professional': ['Leadership', 'Industry Trends', 'Career Growth', 'Business Strategy', 'Networking']
  }



  const completeOnboarding = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/auth/complete-onboarding', onboardingData)
      
      setPersonaAudit(response.data.personaAudit)
      setCurrentStep(5) // Show persona audit
      
      toast.success('Persona created successfully! 🎉')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const finishOnboarding = () => {
    toast.success('Welcome to Parsona! 🚀')
    navigate('/dashboard')
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else if (currentStep === 4) {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addKeyword = (keyword) => {
    if (keyword && !onboardingData.topicsKeywords.includes(keyword)) {
      setOnboardingData(prev => ({
        ...prev,
        topicsKeywords: [...prev.topicsKeywords, keyword]
      }))
    }
  }

  const removeKeyword = (keyword) => {
    setOnboardingData(prev => ({
      ...prev,
      topicsKeywords: prev.topicsKeywords.filter(k => k !== keyword)
    }))
  }

  const steps = [
    {
      number: 1,
      title: 'Role & Identity',
      description: 'Tell us about your professional role',
      icon: <User className="h-8 w-8" />
    },
    {
      number: 2,
      title: 'Branding Goals',
      description: 'What do you want to achieve?',
      icon: <Target className="h-8 w-8" />
    },
    {
      number: 3,
      title: 'Tone & Style',
      description: 'How do you want to communicate?',
      icon: <MessageSquare className="h-8 w-8" />
    },
    {
      number: 4,
      title: 'Topics & Keywords',
      description: 'What topics will you focus on?',
      icon: <TrendingUp className="h-8 w-8" />
    },
    {
      number: 5,
      title: 'AI Persona Audit',
      description: 'Your personalized brand analysis',
      icon: <BarChart3 className="h-8 w-8" />
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="bg-gradient-to-r from-primary to-accent p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Parsona
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-muted-foreground">Let's get you set up in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12 overflow-x-auto">
          <div className="flex items-center space-x-2 md:space-x-4 min-w-max px-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all
                    ${currentStep >= step.number 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground text-muted-foreground'
                    }
                  `}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <span className="font-semibold text-sm md:text-base">{step.number}</span>
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-16 md:max-w-20 leading-tight">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 md:w-16 h-0.5 transition-all
                    ${currentStep > step.number ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  {steps[currentStep - 1].icon}
                </div>
                <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
                <CardDescription className="text-base">
                  {steps[currentStep - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Role & Identity */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What best describes your role?</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roles.map((role) => (
                          <div
                            key={role.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              onboardingData.role === role.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setOnboardingData(prev => ({ ...prev, role: role.value }))}
                          >
                            <div className="flex items-start space-x-3">
                              <role.icon className="h-6 w-6 text-primary mt-1" />
                              <div>
                                <h4 className="font-medium">{role.label}</h4>
                                <p className="text-sm text-muted-foreground">{role.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Industry</label>
                        <Select
                          value={onboardingData.industry}
                          onValueChange={(value) => setOnboardingData(prev => ({ ...prev, industry: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map(industry => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Experience Level</label>
                        <Select
                          value={onboardingData.experienceLevel}
                          onValueChange={(value) => setOnboardingData(prev => ({ ...prev, experienceLevel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            {experienceLevels.map(level => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={nextStep}
                        disabled={!onboardingData.role || !onboardingData.industry || !onboardingData.experienceLevel}
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Branding Goals */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What's your primary branding goal?</h3>
                      <div className="space-y-3">
                        {brandingGoals.map((goal) => (
                          <div
                            key={goal.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              onboardingData.brandingGoal === goal.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setOnboardingData(prev => ({ ...prev, brandingGoal: goal.value }))}
                          >
                            <div className="flex items-start space-x-3">
                              <goal.icon className="h-6 w-6 text-primary mt-1" />
                              <div>
                                <h4 className="font-medium">{goal.label}</h4>
                                <p className="text-sm text-muted-foreground">{goal.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button 
                        onClick={nextStep}
                        disabled={!onboardingData.brandingGoal}
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Tone & Style */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">How do you want to communicate?</h3>
                      <div className="space-y-3">
                        {toneOptions.map((tone) => (
                          <div
                            key={tone.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              onboardingData.tone === tone.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setOnboardingData(prev => ({ ...prev, tone: tone.value }))}
                          >
                            <h4 className="font-medium">{tone.label}</h4>
                            <p className="text-sm text-muted-foreground">{tone.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button 
                        onClick={nextStep}
                        disabled={!onboardingData.tone}
                      >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Topics & Keywords */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">What topics will you focus on?</h3>
                      
                      {/* Suggested topics based on role */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Suggested for {onboardingData.role}s:</h4>
                        <div className="flex flex-wrap gap-2">
                          {commonTopics[onboardingData.role]?.map((topic) => (
                            <Badge
                              key={topic}
                              variant={onboardingData.topicsKeywords.includes(topic) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                if (onboardingData.topicsKeywords.includes(topic)) {
                                  removeKeyword(topic)
                                } else {
                                  addKeyword(topic)
                                }
                              }}
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Custom keyword input */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Add custom topics/keywords:</label>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="e.g., Machine Learning, Startup Growth"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addKeyword(e.target.value)
                                e.target.value = ''
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              const input = e.target.parentElement.querySelector('input')
                              addKeyword(input.value)
                              input.value = ''
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Selected keywords */}
                      {onboardingData.topicsKeywords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Selected topics ({onboardingData.topicsKeywords.length}):</h4>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.topicsKeywords.map((keyword) => (
                              <Badge
                                key={keyword}
                                variant="default"
                                className="cursor-pointer"
                                onClick={() => removeKeyword(keyword)}
                              >
                                {keyword} ×
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button 
                        onClick={nextStep}
                        disabled={onboardingData.topicsKeywords.length === 0 || loading}
                      >
                        {loading ? 'Creating Persona...' : 'Create My Persona'} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5: AI Persona Audit */}
                {currentStep === 5 && personaAudit && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Your AI Persona Audit</h3>
                      <p className="text-muted-foreground">
                        Here's your personalized brand analysis and recommendations
                      </p>
                    </div>

                    {/* Persona Score */}
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 text-center">
                      <h4 className="text-lg font-semibold mb-2">Initial Persona Score</h4>
                      <div className="text-4xl font-bold text-primary mb-2">{personaAudit.personaScore}/100</div>
                      <p className="text-sm text-muted-foreground">
                        Great starting point! Your score will improve as you create content and engage with your audience.
                      </p>
                    </div>

                    {/* Suggested Bio */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Optimized Bio Suggestion</h4>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm">{personaAudit.suggestedBio}</p>
                      </div>
                    </div>

                    {/* Starter Posts */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Starter Post Ideas</h4>
                      <div className="space-y-3">
                        {personaAudit.starterPosts.map((post, index) => (
                          <div key={index} className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="capitalize">
                                {post.type}
                              </Badge>
                            </div>
                            <p className="text-sm">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-primary/5 rounded-lg p-6">
                      <h4 className="font-semibold mb-3">🚀 Ready to Launch Your Persona?</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Connect your social accounts (X, LinkedIn)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Explore trending topics in your industry
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Generate your first AI-powered posts
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Schedule content for maximum engagement
                        </li>
                      </ul>
                    </div>

                    <div className="text-center">
                      <Button 
                        onClick={finishOnboarding}
                        size="lg"
                        className="w-full max-w-sm"
                      >
                        Launch My Persona <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default OnboardingPage