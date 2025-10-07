const express = require('express')
const router = express.Router()

// @route   GET /api/docs
// @desc    API Documentation
// @access  Public
router.get('/', (req, res) => {
  const apiDocs = {
    title: 'Parsona API Documentation',
    version: '1.0.0',
    description: 'AI-Powered Personal Branding Platform API',
    baseUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      note: 'Most endpoints require authentication. Get token from /api/auth/login'
    },

    endpoints: {
      authentication: {
        'POST /api/auth/signup': {
          description: 'Register new user',
          body: {
            name: 'string (required)',
            email: 'string (required)',
            password: 'string (required, min 8 chars)'
          },
          response: {
            token: 'string',
            user: 'object'
          }
        },
        'POST /api/auth/login': {
          description: 'Login user',
          body: {
            email: 'string (required)',
            password: 'string (required)'
          },
          response: {
            token: 'string',
            user: 'object'
          }
        },
        'GET /api/auth/me': {
          description: 'Get current user',
          auth: 'required',
          response: {
            user: 'object'
          }
        },
        'GET /api/auth/google': {
          description: 'Google OAuth login',
          note: 'Redirects to Google OAuth flow'
        },
        'POST /api/auth/complete-onboarding': {
          description: 'Complete user onboarding',
          auth: 'required',
          body: {
            role: 'string',
            industry: 'string',
            experienceLevel: 'string',
            brandingGoal: 'string',
            tone: 'string',
            topicsKeywords: 'array'
          }
        }
      },

      users: {
        'GET /api/users/profile': {
          description: 'Get user profile with roles',
          auth: 'required',
          response: {
            user: 'object',
            roles: 'array',
            planLimits: 'object'
          }
        },
        'PUT /api/users/profile': {
          description: 'Update user profile',
          auth: 'required',
          body: {
            name: 'string (optional)',
            settings: 'object (optional)'
          }
        },
        'GET /api/users/roles': {
          description: 'Get user roles',
          auth: 'required',
          response: {
            roles: 'array'
          }
        },
        'POST /api/users/roles': {
          description: 'Create new role',
          auth: 'required',
          body: {
            name: 'string',
            description: 'string',
            persona: 'object'
          }
        },
        'GET /api/users/persona-score': {
          description: 'Get persona score',
          auth: 'required',
          response: {
            scoreData: 'object',
            lastUpdated: 'string'
          }
        },
        'POST /api/users/calculate-persona-score': {
          description: 'Calculate persona score using AI',
          auth: 'required',
          response: {
            scoreData: 'object'
          }
        }
      },

      posts: {
        'POST /api/posts/generate': {
          description: 'Generate AI content',
          auth: 'required',
          body: {
            roleId: 'string (required)',
            contentType: 'string',
            trendId: 'string (optional)',
            customPrompt: 'string (optional)',
            platform: 'string (default: X)'
          },
          response: {
            post: 'object',
            postVariations: 'object'
          }
        },
        'GET /api/posts': {
          description: 'Get user posts',
          auth: 'required',
          query: {
            status: 'string (optional)',
            roleId: 'string (optional)',
            limit: 'number (default: 20)',
            page: 'number (default: 1)'
          },
          response: {
            posts: 'array',
            pagination: 'object'
          }
        },
        'PUT /api/posts/:id': {
          description: 'Update post',
          auth: 'required',
          body: {
            content: 'string (optional)',
            hashtags: 'array (optional)',
            scheduledFor: 'string (optional)',
            status: 'string (optional)'
          }
        },
        'POST /api/posts/:id/publish': {
          description: 'Publish post to social media',
          auth: 'required',
          response: {
            post: 'object',
            tweetUrl: 'string'
          }
        },
        'POST /api/posts/:id/schedule': {
          description: 'Schedule post for later',
          auth: 'required',
          body: {
            scheduledFor: 'string (ISO date)'
          }
        },
        'GET /api/posts/scheduled': {
          description: 'Get scheduled posts',
          auth: 'required',
          response: {
            posts: 'array'
          }
        }
      },

      trends: {
        'GET /api/trends': {
          description: 'Get trending topics',
          auth: 'required',
          query: {
            category: 'string (optional)',
            limit: 'number (default: 10)',
            roleId: 'string (optional)'
          },
          response: {
            trends: 'array',
            count: 'number'
          }
        },
        'GET /api/trends/:id': {
          description: 'Get single trend with analysis',
          auth: 'required',
          response: {
            trend: 'object',
            analysis: 'object'
          }
        },
        'GET /api/trends/hashtags/trending': {
          description: 'Get trending hashtags',
          auth: 'required',
          query: {
            category: 'string (optional)',
            limit: 'number (default: 20)'
          },
          response: {
            hashtags: 'array'
          }
        }
      },

      connections: {
        'GET /api/connections/twitter/auth': {
          description: 'Redirect to Twitter OAuth',
          auth: 'required',
          note: 'Redirects to Twitter OAuth flow'
        },
        'GET /api/connections/linkedin/auth': {
          description: 'Redirect to LinkedIn OAuth',
          auth: 'required',
          note: 'Redirects to LinkedIn OAuth flow'
        },
        'POST /api/connections/twitter/disconnect': {
          description: 'Disconnect Twitter account',
          auth: 'required'
        },
        'POST /api/connections/linkedin/disconnect': {
          description: 'Disconnect LinkedIn account',
          auth: 'required'
        },
        'GET /api/connections/status': {
          description: 'Get connection status for all platforms',
          auth: 'required',
          response: {
            twitter: 'object',
            linkedin: 'object'
          }
        }
      },

      analytics: {
        'GET /api/analytics/dashboard': {
          description: 'Get dashboard analytics',
          auth: 'required',
          query: {
            period: 'string (24h|7d|30d, default: 7d)',
            roleId: 'string (optional)'
          },
          response: {
            stats: 'object',
            engagementOverTime: 'array',
            topPosts: 'array',
            postingTimes: 'array'
          }
        },
        'GET /api/analytics/posts/:id': {
          description: 'Get detailed post analytics',
          auth: 'required',
          response: {
            post: 'object',
            similarPosts: 'array',
            insights: 'object'
          }
        },
        'GET /api/analytics/overview': {
          description: 'Get comprehensive dashboard overview',
          auth: 'required',
          query: {
            timeframe: 'string (7d|30d|90d, default: 7d)'
          }
        }
      },

      billing: {
        'POST /api/billing/create-subscription': {
          description: 'Create Razorpay subscription',
          auth: 'required',
          body: {
            plan: 'string (pro|agency)'
          },
          response: {
            subscriptionId: 'string',
            planId: 'string',
            amount: 'number',
            currency: 'string'
          }
        },
        'POST /api/billing/verify-payment': {
          description: 'Verify Razorpay payment',
          auth: 'required',
          body: {
            razorpay_payment_id: 'string',
            razorpay_subscription_id: 'string',
            razorpay_signature: 'string',
            plan: 'string'
          }
        },
        'GET /api/billing/subscription': {
          description: 'Get current subscription details',
          auth: 'required',
          response: {
            subscription: 'object',
            razorpayDetails: 'object',
            planLimits: 'object'
          }
        },
        'POST /api/billing/cancel-subscription': {
          description: 'Cancel subscription',
          auth: 'required'
        }
      },

      admin: {
        'GET /api/admin/dashboard': {
          description: 'Get admin dashboard overview',
          auth: 'required (admin)',
          response: {
            overview: 'object',
            userGrowth: 'array',
            subscriptionStats: 'array',
            topPosts: 'array',
            recentUsers: 'array'
          }
        },
        'GET /api/admin/users': {
          description: 'Get all users with pagination',
          auth: 'required (admin)',
          query: {
            page: 'number',
            limit: 'number',
            search: 'string',
            plan: 'string',
            status: 'string'
          }
        },
        'GET /api/admin/system-health': {
          description: 'Get system health metrics',
          auth: 'required (admin)',
          response: {
            overall: 'string',
            database: 'object',
            apis: 'object',
            system: 'object'
          }
        }
      }
    },

    errorCodes: {
      400: 'Bad Request - Invalid input data',
      401: 'Unauthorized - Invalid or missing token',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error'
    },

    rateLimits: {
      general: '100 requests per 15 minutes per IP',
      auth: '5 login attempts per 15 minutes per IP',
      posting: '10 posts per minute per user',
      aiGeneration: 'Based on subscription plan'
    },

    webhooks: {
      description: 'Webhook endpoints for external integrations',
      endpoints: {
        'POST /api/webhooks/razorpay': 'Razorpay payment webhooks',
        'POST /api/webhooks/twitter': 'Twitter API webhooks',
        'POST /api/webhooks/linkedin': 'LinkedIn API webhooks'
      }
    },

    sdks: {
      javascript: 'Coming soon',
      python: 'Coming soon',
      curl: 'Use standard HTTP requests'
    },

    examples: {
      'Generate AI Post': {
        request: `curl -X POST ${process.env.BACKEND_URL || 'http://localhost:5000'}/api/posts/generate \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "roleId": "role_id_here",
    "contentType": "educational",
    "platform": "X"
  }'`,
        response: `{
  "message": "Content generated successfully",
  "post": {
    "_id": "post_id",
    "content": "Generated content here...",
    "status": "draft"
  },
  "postVariations": {
    "post_variations": [...]
  }
}`
      },
      'Get Analytics': {
        request: `curl -X GET "${process.env.BACKEND_URL || 'http://localhost:5000'}/api/analytics/dashboard?period=7d" \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
        response: `{
  "stats": {
    "totalPosts": 24,
    "avgEngagementRate": 4.2
  },
  "engagementOverTime": [...],
  "topPosts": [...]
}`
      }
    }
  }

  res.json(apiDocs)
})

// @route   GET /api/docs/openapi
// @desc    OpenAPI/Swagger specification
// @access  Public
router.get('/openapi', (req, res) => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Parsona API',
      version: '1.0.0',
      description: 'AI-Powered Personal Branding Platform API',
      contact: {
        name: 'Parsona Support',
        email: 'support@parsona.com'
      }
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'User login',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { type: 'object' }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Invalid credentials'
            }
          }
        }
      },
      '/api/posts/generate': {
        post: {
          summary: 'Generate AI content',
          tags: ['Posts'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roleId: { type: 'string' },
                    contentType: { type: 'string' },
                    trendId: { type: 'string' },
                    customPrompt: { type: 'string' },
                    platform: { type: 'string', default: 'X' }
                  },
                  required: ['roleId']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Content generated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      post: { type: 'object' },
                      postVariations: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  res.json(openApiSpec)
})

module.exports = router