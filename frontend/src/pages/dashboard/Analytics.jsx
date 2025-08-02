import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Heart, MessageCircle, Users, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  const periods = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' }
  ]

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      // Mock data - replace with actual API call
      const mockAnalytics = {
        stats: {
          totalPosts: 24,
          totalLikes: 1250,
          totalRetweets: 340,
          totalReplies: 180,
          totalImpressions: 15600,
          avgEngagementRate: 4.2
        },
        engagementOverTime: [
          { date: '2024-01-01', likes: 45, retweets: 12, replies: 8, impressions: 1200 },
          { date: '2024-01-02', likes: 52, retweets: 18, replies: 6, impressions: 1450 },
          { date: '2024-01-03', likes: 38, retweets: 9, replies: 12, impressions: 980 },
          { date: '2024-01-04', likes: 65, retweets: 22, replies: 15, impressions: 1800 },
          { date: '2024-01-05', likes: 71, retweets: 28, replies: 18, impressions: 2100 },
          { date: '2024-01-06', likes: 58, retweets: 16, replies: 10, impressions: 1650 },
          { date: '2024-01-07', likes: 82, retweets: 35, replies: 22, impressions: 2400 }
        ],
        topPosts: [
          {
            _id: '1',
            content: 'Just discovered an amazing new AI tool that\'s revolutionizing content creation! 🚀',
            platforms: { twitter: { metrics: { likes: 145, retweets: 42, replies: 28 } } },
            performance: { score: 95 },
            publishedAt: '2024-01-07T10:30:00Z'
          },
          {
            _id: '2',
            content: 'The future of remote work is here. Companies that adapt will thrive! 💼',
            platforms: { twitter: { metrics: { likes: 98, retweets: 31, replies: 15 } } },
            performance: { score: 78 },
            publishedAt: '2024-01-06T14:15:00Z'
          }
        ],
        postingTimes: [
          { _id: 9, avgEngagement: 4.8, postCount: 3 },
          { _id: 12, avgEngagement: 5.2, postCount: 4 },
          { _id: 15, avgEngagement: 6.1, postCount: 5 },
          { _id: 18, avgEngagement: 4.5, postCount: 2 },
          { _id: 21, avgEngagement: 3.9, postCount: 3 }
        ]
      }

      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your social media performance and engagement metrics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(analytics?.stats.totalLikes + analytics?.stats.totalRetweets + analytics?.stats.totalReplies)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
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
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics?.stats.totalImpressions)}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last period
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
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.stats.avgEngagementRate}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last period
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
              <CardTitle className="text-sm font-medium">Posts Published</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                +5 from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Engagement Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
              <CardDescription>
                Track your engagement metrics over the selected period
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
                  <Line 
                    type="monotone" 
                    dataKey="replies" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Replies"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Best Posting Times */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Best Posting Times</CardTitle>
              <CardDescription>
                Optimal hours for maximum engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.postingTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="_id" 
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(hour) => `${hour}:00`}
                    formatter={(value) => [`${value}%`, 'Avg Engagement']}
                  />
                  <Bar 
                    dataKey="avgEngagement" 
                    fill="#4F46E5"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>
              Your best content from the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topPosts.map((post, index) => (
                <div key={post._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="mb-2">{post.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Heart className="mr-1 h-4 w-4" />
                          {post.platforms.twitter.metrics.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="mr-1 h-4 w-4" />
                          {post.platforms.twitter.metrics.replies}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-primary">
                        {post.performance.score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score
                      </div>
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

export default Analytics