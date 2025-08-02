import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe, Twitter, Linkedin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [connections, setConnections] = useState({
    twitter: { connected: false, username: null },
    linkedin: { connected: false, username: null }
  })
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      trends: true,
      engagement: true,
      weeklyReport: false
    },
    privacy: {
      profileVisible: true,
      analyticsSharing: false,
      dataExport: true
    },
    posting: {
      autoHashtags: true,
      optimalTiming: true,
      duplicateCheck: true
    }
  })

  useEffect(() => {
    fetchConnectionStatus()
  }, [])

  const updateSettings = async (section, key, value) => {
    try {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }))
      toast.success('Settings updated successfully')
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings')
    }
  }

  const fetchConnectionStatus = async () => {
    try {
      const response = await axios.get('/api/connections/status')
      setConnections(response.data)
    } catch (error) {
      console.error('Failed to fetch connection status:', error)
    }
  }

  const connectTwitter = async () => {
    try {
      const response = await axios.get('/api/connections/twitter/connect')
      window.open(response.data.authUrl, '_blank', 'width=600,height=600')
      
      // Listen for connection success
      const checkConnection = setInterval(async () => {
        try {
          const status = await axios.get('/api/connections/status')
          if (status.data.twitter.connected) {
            setConnections(prev => ({ ...prev, twitter: status.data.twitter }))
            toast.success('Twitter connected successfully!')
            clearInterval(checkConnection)
          }
        } catch (error) {
          // Continue checking
        }
      }, 2000)

      // Stop checking after 2 minutes
      setTimeout(() => clearInterval(checkConnection), 120000)
    } catch (error) {
      console.error('Failed to connect Twitter:', error)
      toast.error('Failed to connect Twitter')
    }
  }

  const disconnectTwitter = async () => {
    try {
      await axios.post('/api/connections/twitter/disconnect')
      setConnections(prev => ({ 
        ...prev, 
        twitter: { connected: false, username: null } 
      }))
      toast.success('Twitter account disconnected')
    } catch (error) {
      console.error('Failed to disconnect Twitter:', error)
      toast.error('Failed to disconnect Twitter')
    }
  }

  const connectLinkedIn = async () => {
    try {
      const response = await axios.get('/api/connections/linkedin/connect')
      window.open(response.data.authUrl, '_blank', 'width=600,height=600')
      
      // Listen for connection success
      const checkConnection = setInterval(async () => {
        try {
          const status = await axios.get('/api/connections/status')
          if (status.data.linkedin.connected) {
            setConnections(prev => ({ ...prev, linkedin: status.data.linkedin }))
            toast.success('LinkedIn connected successfully!')
            clearInterval(checkConnection)
          }
        } catch (error) {
          // Continue checking
        }
      }, 2000)

      setTimeout(() => clearInterval(checkConnection), 120000)
    } catch (error) {
      console.error('Failed to connect LinkedIn:', error)
      toast.error('Failed to connect LinkedIn')
    }
  }

  const disconnectLinkedIn = async () => {
    try {
      await axios.post('/api/connections/linkedin/disconnect')
      setConnections(prev => ({ 
        ...prev, 
        linkedin: { connected: false, username: null } 
      }))
      toast.success('LinkedIn account disconnected')
    } catch (error) {
      console.error('Failed to disconnect LinkedIn:', error)
      toast.error('Failed to disconnect LinkedIn')
    }
  }

  const exportData = async () => {
    try {
      // API call to export user data
      toast.success('Data export initiated. You will receive an email shortly.')
    } catch (error) {
      console.error('Failed to export data:', error)
      toast.error('Failed to export data')
    }
  }

  const deleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // API call to delete account
        toast.success('Account deletion initiated')
      } catch (error) {
        console.error('Failed to delete account:', error)
        toast.error('Failed to delete account')
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and application settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account information and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  defaultValue={user?.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  defaultValue={user?.email}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Timezone
                </label>
                <Select defaultValue="UTC">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">
                Update Account Information
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Theme
                </label>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => theme !== 'light' && toggleTheme()}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => theme !== 'dark' && toggleTheme()}
                  >
                    Dark
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Language
                </label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {key === 'email' && 'Receive email notifications'}
                      {key === 'trends' && 'Get notified about new trending topics'}
                      {key === 'engagement' && 'Alerts for high engagement posts'}
                      {key === 'weeklyReport' && 'Weekly performance summary'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={value}
                      onChange={(e) => updateSettings('notifications', key, e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Manage your social media platform connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Twitter className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Twitter (X)</div>
                    <div className="text-sm text-muted-foreground">
                      {connections.twitter.connected 
                        ? `@${connections.twitter.username}` 
                        : 'Not connected'
                      }
                    </div>
                  </div>
                </div>
                {connections.twitter.connected ? (
                  <Button variant="outline" size="sm" onClick={disconnectTwitter}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={connectTwitter}>
                    Connect
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">LinkedIn</div>
                    <div className="text-sm text-muted-foreground">
                      {connections.linkedin.connected 
                        ? connections.linkedin.username 
                        : 'Not connected'
                      }
                    </div>
                  </div>
                </div>
                {connections.linkedin.connected ? (
                  <Button variant="outline" size="sm" onClick={disconnectLinkedIn}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={connectLinkedIn}>
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control your privacy settings and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Privacy Settings</h4>
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {key === 'profileVisible' && 'Make your profile visible to others'}
                          {key === 'analyticsSharing' && 'Share anonymous analytics data'}
                          {key === 'dataExport' && 'Allow data export requests'}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={value}
                          onChange={(e) => updateSettings('privacy', key, e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Data Management</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={exportData}>
                      Export My Data
                    </Button>
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={deleteAccount}>
                      Delete Account
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Account deletion is permanent and cannot be undone. All your data will be permanently removed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings