import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Twitter, 
  Linkedin, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Unlink,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const Connections = () => {
  const { user } = useAuth()
  const [connections, setConnections] = useState({
    twitter: { connected: false, username: '', connectedAt: null },
    linkedin: { connected: false, username: '', connectedAt: null }
  })
  const [loading, setLoading] = useState({})

  useEffect(() => {
    if (user?.connectedAccounts) {
      setConnections(user.connectedAccounts)
    }
  }, [user])

  const handleConnect = async (platform) => {
    setLoading(prev => ({ ...prev, [platform]: true }))
    
    try {
      // Redirect to OAuth flow
      window.location.href = `/api/connections/${platform}/auth`
    } catch (error) {
      console.error(`${platform} connection error:`, error)
      toast.error(`Failed to connect ${platform}`)
      setLoading(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleDisconnect = async (platform) => {
    setLoading(prev => ({ ...prev, [platform]: true }))
    
    try {
      await axios.post(`/api/connections/${platform}/disconnect`)
      
      setConnections(prev => ({
        ...prev,
        [platform]: { connected: false, username: '', connectedAt: null }
      }))
      
      toast.success(`${platform} disconnected successfully`)
    } catch (error) {
      console.error(`${platform} disconnection error:`, error)
      toast.error(`Failed to disconnect ${platform}`)
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }))
    }
  }

  const platforms = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      description: 'Connect your X account to publish posts and analyze engagement',
      features: ['Post publishing', 'Engagement analytics', 'Trend analysis', 'Audience insights']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      description: 'Connect your LinkedIn profile for professional networking content',
      features: ['Professional posts', 'Network analytics', 'Industry trends', 'Career insights']
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Account Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your social media accounts to start building your personal brand
        </p>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Connected Platforms</h3>
                <p className="text-2xl font-bold text-primary">
                  {Object.values(connections).filter(conn => conn.connected).length}/2
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Account Status</h3>
                <p className="text-sm text-muted-foreground">
                  {Object.values(connections).every(conn => conn.connected) 
                    ? 'All platforms connected' 
                    : 'Setup incomplete'
                  }
                </p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                {Object.values(connections).every(conn => conn.connected) ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Connections */}
      <div className="space-y-6">
        {platforms.map((platform) => {
          const connection = connections[platform.id]
          const isConnected = connection?.connected
          const isLoading = loading[platform.id]

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className={`${platform.bgColor} border-b`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-white dark:bg-gray-800 rounded-lg ${platform.color}`}>
                        <platform.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{platform.name}</span>
                          {isConnected && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {platform.description}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(platform.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Unlink className="h-4 w-4 mr-2" />
                            )}
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleConnect(platform.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Connect {platform.name}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {isConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Connected as @{connection.username}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Connected on {new Date(connection.connectedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Available Features:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {platform.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Connect your {platform.name} account to unlock:
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {platform.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="h-4 w-4 rounded-full bg-muted" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          We'll redirect you to {platform.name} to authorize the connection securely
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Next Steps */}
      {!Object.values(connections).every(conn => conn.connected) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">🚀 Next Steps</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect all your social media accounts to get the most out of Parsona's AI-powered features.
            </p>
            <div className="space-y-2">
              {!connections.twitter?.connected && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  <span>Connect X to start publishing and analyzing your tweets</span>
                </div>
              )}
              {!connections.linkedin?.connected && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  <span>Connect LinkedIn for professional networking content</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Connections