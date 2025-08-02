import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Wand2, Copy, Save, Send, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import toast from 'react-hot-toast'

const PostGenerator = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [trends, setTrends] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedTrend, setSelectedTrend] = useState('')
  const [contentType, setContentType] = useState('general')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPostId, setCurrentPostId] = useState(null)

  const contentTypes = [
    { value: 'general', label: 'General Post' },
    { value: 'educational', label: 'Educational' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'entertaining', label: 'Entertaining' },
    { value: 'news', label: 'News & Updates' },
    { value: 'personal', label: 'Personal Story' }
  ]

  useEffect(() => {
    fetchInitialData()
    
    // Check if we came from trends page with trend data
    if (location.state?.trend) {
      const trend = location.state.trend
      setSelectedTrend(trend.id)
      setCustomPrompt(`Focus on: ${trend.title}. ${trend.description}`)
    }
  }, [location.state])

  const fetchInitialData = async () => {
    try {
      // Fetch roles and trends from API
      const [rolesResponse, trendsResponse] = await Promise.all([
        axios.get('/api/users/roles'),
        axios.get('/api/trends', { params: { limit: 10 } })
      ])

      const fetchedRoles = rolesResponse.data.roles || []
      const fetchedTrends = trendsResponse.data.trends || []

      setRoles(fetchedRoles)
      setTrends(fetchedTrends)
      
      if (fetchedRoles.length > 0) {
        setSelectedRole(fetchedRoles[0]._id)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      
      // Fallback to mock data
      const mockRoles = [
        {
          _id: '1',
          name: 'Tech Entrepreneur',
          persona: { industry: 'technology', targetAudience: 'startup founders' }
        }
      ]

      const mockTrends = [
        {
          _id: '1',
          title: 'AI Revolution 2024',
          category: 'technology',
          metrics: { trendScore: 95 }
        }
      ]

      setRoles(mockRoles)
      setTrends(mockTrends)
      if (mockRoles.length > 0) {
        setSelectedRole(mockRoles[0]._id)
      }
      
      toast.error('Using sample data - please check your connection')
    } finally {
      setLoading(false)
    }
  }

  const generatePost = async () => {
    if (!selectedRole) {
      toast.error('Please select a role first')
      return
    }

    setIsGenerating(true)
    try {
      const requestData = {
        roleId: selectedRole,
        contentType,
        ...(selectedTrend && { trendId: selectedTrend }),
        ...(customPrompt && { customPrompt })
      }

      const response = await axios.post('/api/posts/generate', requestData)
      
      // Handle new AI response format with multiple variations
      if (response.data.postVariations) {
        const firstVariation = response.data.postVariations.post_variations[0]
        const content = firstVariation.hook 
          ? `${firstVariation.hook}\n\n${firstVariation.body}` 
          : firstVariation.body
        setGeneratedContent(content)
        setCurrentPostId(response.data.post._id)
      } else {
        // Fallback for old format
        setGeneratedContent(response.data.generatedContent?.text || response.data.post?.content)
        setCurrentPostId(response.data.post._id)
      }
      
      toast.success('Content generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      
      if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'Daily limit reached')
      } else {
        toast.error('Failed to generate content')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    toast.success('Content copied to clipboard!')
  }

  const saveAsDraft = async () => {
    if (!currentPostId) {
      toast.error('No post to save')
      return
    }

    try {
      await axios.put(`/api/posts/${currentPostId}`, {
        content: generatedContent,
        status: 'draft'
      })
      toast.success('Post saved as draft!')
    } catch (error) {
      console.error('Save draft error:', error)
      toast.error('Failed to save draft')
    }
  }

  const schedulePost = () => {
    if (!currentPostId) {
      toast.error('No post to schedule')
      return
    }
    
    navigate('/dashboard/calendar', { 
      state: { 
        postId: currentPostId,
        content: generatedContent 
      }
    })
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Sparkles className="mr-3 h-8 w-8 text-primary" />
          AI Post Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Create engaging social media content with AI that understands your brand voice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Content Configuration</CardTitle>
              <CardDescription>
                Customize your content generation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Role/Persona
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name} ({role.persona.industry})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trend Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trending Topic (Optional)
                </label>
                <Select value={selectedTrend} onValueChange={setSelectedTrend}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific trend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific trend</SelectItem>
                    {trends.map((trend) => (
                      <SelectItem key={trend._id} value={trend._id}>
                        {trend.title} (Score: {trend.metrics?.trendScore || 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Content Type
                </label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Context (Optional)
                </label>
                <Textarea
                  rows={3}
                  placeholder="Add any specific instructions or context..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={generatePost}
                disabled={isGenerating || !selectedRole}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generated Content Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                Your AI-generated social media post
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  {/* Content Preview */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="whitespace-pre-wrap text-sm">
                      {generatedContent}
                    </div>
                  </div>

                  {/* Content Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Characters: </span>
                      <span className={generatedContent.length > 280 ? 'text-red-500' : 'text-green-500'}>
                        {generatedContent.length}/280
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Words: </span>
                      <span>{generatedContent.split(' ').length}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={copyToClipboard}
                      className="flex-1"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={saveAsDraft}
                      className="flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={schedulePost}
                      className="flex-1"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  </div>

                  {/* Regenerate Button */}
                  <Button
                    variant="ghost"
                    onClick={generatePost}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate New Version
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to create?</h3>
                  <p className="text-muted-foreground">
                    Configure your settings and click "Generate Content" to create your AI-powered post.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default PostGenerator