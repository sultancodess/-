import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  BarChart3,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Target,
  Award
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [trends, setTrends] = useState([])
  const [recentPosts, setRecentPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual API calls
      const mockAnalytics = {
        stats: {
          totalPosts: 24,
          totalLikes: 1250,
          totalRetweets: 340,
          totalImpressions: 15600,
          avgEngagementRate: 4.2
        },
        engagementOverTime: [
          { date: '2024-01-01', likes: 45, retweets: 12, replies: 8 },
          { date: '2024-01-02', likes: 52, retweets: 18, replies: 6 },
          { date: '2024-01-03', likes: 38, retweets: 9, replies: 12 },
          { date: '2024-01-04', likes: 65, retweets: 22, replies: 15 },
          { date: '2024-01-05', likes: 71, retweets: 28, replies: 18 },
          { date: '2024-01-06', likes: 58, retweets: 16, replies: 10 },
          { date: '2024-01-07', likes: 82, retweets: 35, replies: 22 }
        ]
      }

      const mockTrends = [
        {
          _id: '1',
          title: 'AI Revolution 2024',
          category: 'technology',
          metrics: { trendScore: 95 }
        },
        {
          _id: '2',
          title: 'Remote Work Trends',
          category: 'business',
          metrics: { trendScore: 87 }
        },
        {
          _id: '3',
          title: 'Sustainable Tech',
          category: 'technology',
          metrics: { trendScore: 82 }
        }
      ]

      const mockRecentPosts = [
        {
          _id: '1',
          content: 'Just discovered an amazing new AI tool that\'s revolutionizing content creation! 🚀 #AI #ContentCreation',
          platforms: {
            twitter: {
              metrics: { likes: 45, retweets: 12, replies: 8 }
            }
          },
          publishedAt: '2024-01-07T10:30:00Z',
          performance: { score: 78 }
        },
        {
          _id: '2',
          content: 'The future of remote work is here. Companies that adapt will thrive! 💼 #RemoteWork #FutureOfWork',
          platforms: {
            twitter: {
              metrics: { likes: 32, retweets: 8, replies: 5 }
            }
          },
          publishedAt: '2024-01-06T14:15:00Z',
          performance: { score: 65 }
        }
      ]

      setAnalytics(mockAnalytics)
      setTrends(mockTrends)
      setRecentPosts(mockRecentPosts)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your social media presence today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button asChild>
            <Link to="/dashboard/generator">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Post
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/trends">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Trends
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Persona Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persona Score</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">78/100</div>
              <p className="text-xs text-green-600">
                +5 this week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.stats.avgEngagementRate}%</div>
              <p className="text-xs text-green-600">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last week
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.stats.totalImpressions)}</div>
              <p className="text-xs text-muted-foreground">
                +15% from last week
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Engagement Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>
                Your engagement metrics for the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.engagementOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="likes" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    name="Likes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="retweets" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    name="Retweets"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trending Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Trending Topics</CardTitle>
                <CardDescription>
                  Hot topics in your industry
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/trends">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.map((trend, index) => (
                  <div key={trend._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{trend.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {trend.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {trend.metrics.trendScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>
                Your latest published content
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/analytics">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post._id} className="border rounded-lg p-4">
                  <p className="mb-3">{post.content}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Heart className="mr-1 h-4 w-4" />
                        {post.platforms.twitter.metrics.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="mr-1 h-4 w-4" />
                        {post.platforms.twitter.metrics.replies}
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">Score: {post.performance.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Dashboard