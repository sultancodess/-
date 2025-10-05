import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  User,
  BarChart3,
  ArrowRight,
  Star,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const PersonaScore = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [scoreData, setScoreData] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    // Load existing score data if available
    fetchPersonaScore()
  }, [])

  const fetchPersonaScore = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/users/persona-score')
      setScoreData(response.data.scoreData)
      setLastUpdated(response.data.lastUpdated)
    } catch (error) {
      console.error('Fetch persona score error:', error)
      // If no score exists, show initial state
      if (error.response?.status === 404) {
        setScoreData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const calculatePersonaScore = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/users/calculate-persona-score')
      setScoreData(response.data.scoreData)
      setLastUpdated(new Date().toISOString())
      toast.success('Persona score updated successfully!')
    } catch (error) {
      console.error('Calculate persona score error:', error)
      toast.error(error.response?.data?.message || 'Failed to calculate persona score')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreGrade = (score) => {
    if (score >= 90) return { grade: 'A+', description: 'Exceptional' }
    if (score >= 80) return { grade: 'A', description: 'Excellent' }
    if (score >= 70) return { grade: 'B', description: 'Good' }
    if (score >= 60) return { grade: 'C', description: 'Average' }
    return { grade: 'D', description: 'Needs Improvement' }
  }

  const scoreCategories = [
    {
      name: 'Profile Completeness',
      key: 'profileCompleteness',
      icon: User,
      description: 'How complete and optimized your social profiles are'
    },
    {
      name: 'Content Quality',
      key: 'contentQuality',
      icon: Star,
      description: 'Quality and engagement of your recent posts'
    },
    {
      name: 'Consistency',
      key: 'consistency',
      icon: BarChart3,
      description: 'How regularly you post and maintain your presence'
    },
    {
      name: 'Engagement Rate',
      key: 'engagementRate',
      icon: TrendingUp,
      description: 'How well your audience interacts with your content'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Persona Score</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered analysis of your personal brand strength
          </p>
        </div>
        <Button 
          onClick={calculatePersonaScore}
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Target className="h-4 w-4 mr-2" />
          )}
          {scoreData ? 'Recalculate Score' : 'Calculate Score'}
        </Button>
      </div>

      {!scoreData && !loading ? (
        /* Initial State */
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-6">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Get Your Persona Score</h2>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your connected social media profiles and provide a comprehensive 
              score with personalized recommendations to improve your personal brand.
            </p>
            <div className="space-y-3 text-sm text-left bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Profile completeness analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Content quality assessment</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Engagement rate evaluation</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Personalized improvement suggestions</span>
              </div>
            </div>
          </motion.div>
        </div>
      ) : scoreData ? (
        /* Score Results */
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your Persona Score</h2>
                    <p className="text-muted-foreground">
                      Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(scoreData.overallScore)}`}>
                      {scoreData.overallScore}
                    </div>
                    <div className="text-lg font-medium">
                      {getScoreGrade(scoreData.overallScore).grade}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getScoreGrade(scoreData.overallScore).description}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scoreCategories.map((category) => {
              const score = scoreData.breakdown?.[category.key] || 0
              return (
                <Card key={category.key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {category.description}
                        </CardDescription>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={score} className="h-2" />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* AI Feedback */}
          {scoreData.feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>AI Recommendations</span>
                </CardTitle>
                <CardDescription>
                  Personalized suggestions to improve your persona score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scoreData.feedback.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <div className="p-1 bg-primary/10 rounded-full mt-1">
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      {item.priority && (
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="mt-2">
                          {item.priority} priority
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Score History */}
          {scoreData.history && scoreData.history.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Score Trend</span>
                </CardTitle>
                <CardDescription>
                  Your persona score progress over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{scoreData.history[0].score}</div>
                    <div className="text-sm text-muted-foreground">Previous</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {scoreData.overallScore > scoreData.history[0].score ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`font-medium ${
                      scoreData.overallScore > scoreData.history[0].score 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {Math.abs(scoreData.overallScore - scoreData.history[0].score)} points
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{scoreData.overallScore}</div>
                    <div className="text-sm text-muted-foreground">Current</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Boost Your Score</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Take these actions to improve your persona score and strengthen your personal brand.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start" asChild>
                  <a href="/dashboard/generator">
                    <Star className="h-4 w-4 mr-2" />
                    Generate Quality Content
                  </a>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <a href="/dashboard/profile">
                    <User className="h-4 w-4 mr-2" />
                    Optimize Your Profile
                  </a>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <a href="/dashboard/trends">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Follow Trending Topics
                  </a>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <a href="/dashboard/calendar">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Maintain Consistency
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Loading State */
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analyzing Your Persona</h2>
          <p className="text-muted-foreground">
            Our AI is evaluating your social media presence...
          </p>
        </div>
      )}
    </div>
  )
}

export default PersonaScore