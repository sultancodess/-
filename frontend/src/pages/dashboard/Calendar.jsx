import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Plus, Clock, Edit, Trash2, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import toast from 'react-hot-toast'

const Calendar = () => {
  const location = useLocation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [newPost, setNewPost] = useState({
    content: '',
    scheduledFor: '',
    platform: 'twitter'
  })
  const [draggedPost, setDraggedPost] = useState(null)

  useEffect(() => {
    fetchScheduledPosts()
    
    // Check if we came from post generator with a post to schedule
    if (location.state?.postId && location.state?.content) {
      setNewPost({
        content: location.state.content,
        scheduledFor: '',
        platform: 'twitter'
      })
      setShowScheduleDialog(true)
    }
  }, [location.state])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getPostsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return scheduledPosts.filter(post => 
      post.scheduledFor.split('T')[0] === dateStr
    )
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const fetchScheduledPosts = async () => {
    try {
      const response = await axios.get('/api/posts/scheduled')
      setScheduledPosts(response.data.posts || [])
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error)
      // Fallback to mock data
      setScheduledPosts([
        {
          _id: '1',
          content: 'Exciting AI developments this week! 🚀',
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          platforms: { twitter: { enabled: true } },
          status: 'scheduled'
        },
        {
          _id: '2',
          content: 'Remote work productivity tips for teams 💼',
          scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          platforms: { twitter: { enabled: true } },
          status: 'scheduled'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const schedulePost = async () => {
    if (!newPost.content || !newPost.scheduledFor) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await axios.post('/api/posts', {
        content: newPost.content,
        scheduledFor: newPost.scheduledFor,
        platforms: {
          [newPost.platform]: { enabled: true }
        },
        status: 'scheduled'
      })

      setScheduledPosts([...scheduledPosts, response.data.post])
      setNewPost({ content: '', scheduledFor: '', platform: 'twitter' })
      setShowScheduleDialog(false)
      toast.success('Post scheduled successfully!')
    } catch (error) {
      console.error('Failed to schedule post:', error)
      toast.error('Failed to schedule post')
    }
  }

  const deletePost = async (postId) => {
    try {
      await axios.delete(`/api/posts/${postId}`)
      setScheduledPosts(scheduledPosts.filter(post => post._id !== postId))
      toast.success('Post deleted successfully')
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Failed to delete post')
    }
  }

  const reschedulePost = async (postId, newDateTime) => {
    try {
      await axios.put(`/api/posts/${postId}/schedule`, {
        scheduledFor: newDateTime
      })
      
      setScheduledPosts(scheduledPosts.map(post => 
        post._id === postId 
          ? { ...post, scheduledFor: newDateTime }
          : post
      ))
      
      toast.success('Post rescheduled successfully')
    } catch (error) {
      console.error('Failed to reschedule post:', error)
      toast.error('Failed to reschedule post')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, post) => {
    setDraggedPost(post)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetDate) => {
    e.preventDefault()
    if (draggedPost) {
      const newDateTime = new Date(targetDate)
      newDateTime.setHours(new Date(draggedPost.scheduledFor).getHours())
      newDateTime.setMinutes(new Date(draggedPost.scheduledFor).getMinutes())
      
      reschedulePost(draggedPost._id, newDateTime.toISOString())
      setDraggedPost(null)
    }
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <CalendarIcon className="mr-3 h-8 w-8 text-primary" />
            Content Calendar
          </h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage your social media posts.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(-1)}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth(1)}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => {
                  const posts = getPostsForDate(date)
                  const isToday = date && date.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[80px] p-2 border rounded-lg
                        ${date ? 'bg-background hover:bg-muted/50 cursor-pointer' : 'bg-muted/20'}
                        ${isToday ? 'border-primary bg-primary/5' : 'border-border'}
                      `}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {posts.slice(0, 2).map(post => (
                              <div
                                key={post.id}
                                className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                              >
                                {new Date(post.scheduledFor).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            ))}
                            {posts.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{posts.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Posts Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Posts</CardTitle>
              <CardDescription>
                Your scheduled content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.map(post => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(post.scheduledFor).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-3">{post.content}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {post.platform}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Calendar