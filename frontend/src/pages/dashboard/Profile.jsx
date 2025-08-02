import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Plus, Edit, Trash2, Settings, Twitter, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/users/roles')
      setRoles(response.data.roles || [])
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      // Fallback to mock data
      setRoles([
        {
          _id: '1',
          name: 'Tech Entrepreneur',
          description: 'Sharing insights about startup life and technology trends',
          persona: {
            industry: 'technology',
            targetAudience: 'startup founders',
            toneOfVoice: 'professional',
            keywords: ['startup', 'technology', 'innovation', 'entrepreneurship'],
            hashtags: ['StartupLife', 'TechTrends', 'Innovation']
          },
          platforms: {
            twitter: {
              enabled: true,
              username: user?.twitterUsername || null
            }
          },
          isDefault: true,
          isActive: true,
          performance: {
            totalPosts: 45,
            avgEngagement: 4.2,
            bestPostingTime: '9:00 AM'
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const deleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await axios.delete(`/api/users/roles/${roleId}`)
        setRoles(roles.filter(role => role._id !== roleId))
        toast.success('Role deleted successfully')
      } catch (error) {
        console.error('Failed to delete role:', error)
        toast.error('Failed to delete role')
      }
    }
  }

  const toggleRoleStatus = async (roleId) => {
    try {
      const role = roles.find(r => r._id === roleId)
      const updatedRole = { ...role, isActive: !role.isActive }
      
      await axios.put(`/api/users/roles/${roleId}`, { isActive: updatedRole.isActive })
      
      setRoles(roles.map(r => r._id === roleId ? updatedRole : r))
      toast.success(`Role ${updatedRole.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role')
    }
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
          <User className="mr-3 h-8 w-8 text-primary" />
          Profile & Roles
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and content personas for PersonaPilot.io
        </p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>
            Your account information and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{user?.name}</h3>
              <p className="text-muted-foreground mb-4">{user?.email}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium">Plan</div>
                  <div className="text-lg capitalize">{user?.subscription?.plan || 'free'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Posts Generated</div>
                  <div className="text-lg">{user?.usage?.postsGenerated || 0}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Active Roles</div>
                  <div className="text-lg">{roles.filter(r => r.isActive).length}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                {user?.subscription?.plan === 'free' && (
                  <Button>
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Personas</h2>
          <p className="text-muted-foreground">
            Manage your different content personalities and strategies.
          </p>
        </div>
        <Button onClick={() => setShowRoleModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role, index) => (
          <motion.div
            key={role._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={`h-full ${!role.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-xl">{role.name}</CardTitle>
                      {role.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Badge variant={role.isActive ? "default" : "outline"}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {role.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!role.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteRole(role._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Persona Details */}
                  <div>
                    <h4 className="font-medium mb-2">Persona Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Industry:</span>
                        <div className="capitalize">{role.persona.industry}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tone:</span>
                        <div className="capitalize">{role.persona.toneOfVoice}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">Target Audience:</span>
                      <div className="text-sm">{role.persona.targetAudience}</div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <h4 className="font-medium mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.persona.keywords?.slice(0, 4).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {role.persona.keywords?.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.persona.keywords.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Platform Settings */}
                  <div>
                    <h4 className="font-medium mb-2">Platform Settings</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Twitter className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          {role.platforms?.twitter?.username || 'Not connected'}
                        </span>
                      </div>
                      <Badge variant={role.platforms?.twitter?.enabled ? "default" : "outline"}>
                        {role.platforms?.twitter?.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Posts</div>
                        <div className="font-medium">{role.performance?.totalPosts || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Engagement</div>
                        <div className="font-medium">{role.performance?.avgEngagement || 0}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Best Time</div>
                        <div className="font-medium">{role.performance?.bestPostingTime || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRoleStatus(role._id)}
                    >
                      {role.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRole(role)}
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {roles.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No personas created yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first content persona to get started with AI-powered posting.
          </p>
          <Button onClick={() => setShowRoleModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Persona
          </Button>
        </div>
      )}
    </div>
  )
}

export default Profile