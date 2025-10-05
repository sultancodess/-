# Parsona - Project Structure

## 📁 Directory Structure

```
parsona/
├── backend/                          # Node.js/Express Backend
│   ├── middleware/                   # Custom middleware
│   │   └── auth.js                  # JWT authentication middleware
│   ├── models/                      # MongoDB/Mongoose models
│   │   ├── User.js                  # User model with persona scoring
│   │   ├── Role.js                  # Role/Persona model
│   │   ├── Post.js                  # Social media post model
│   │   └── Trend.js                 # Trending topics model
│   ├── routes/                      # API route handlers
│   │   ├── auth.js                  # Authentication routes
│   │   ├── users.js                 # User management routes
│   │   ├── posts.js                 # Post management routes
│   │   ├── trends.js                # Trend discovery routes
│   │   ├── analytics.js             # Analytics routes
│   │   ├── billing.js               # Payment/subscription routes
│   │   └── connections.js           # Social media OAuth routes
│   ├── services/                    # Business logic services
│   │   ├── aiService.js             # Google Gemini AI integration
│   │   ├── twitterService.js        # Twitter/X API integration
│   │   ├── linkedinService.js       # LinkedIn API integration
│   │   ├── analyticsService.js      # Analytics processing
│   │   └── notificationService.js   # Email/notification service
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Express server entry point
│
├── frontend/                        # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── auth/               # Authentication components
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── layout/             # Layout components
│   │   │   │   ├── Header.jsx      # Navigation header
│   │   │   │   └── Footer.jsx      # Site footer
│   │   │   └── ui/                 # Base UI components
│   │   │       ├── button.jsx      # Button component
│   │   │       ├── card.jsx        # Card component
│   │   │       ├── input.jsx       # Input component
│   │   │       ├── select.jsx      # Select component
│   │   │       ├── textarea.jsx    # Textarea component
│   │   │       ├── dialog.jsx      # Modal dialog
│   │   │       ├── tabs.jsx        # Tab component
│   │   │       ├── badge.jsx       # Badge component
│   │   │       └── progress.jsx    # Progress bar
│   │   ├── contexts/               # React contexts
│   │   │   ├── AuthContext.jsx     # Authentication state
│   │   │   └── ThemeContext.jsx    # Theme management
│   │   ├── layouts/                # Page layouts
│   │   │   └── DashboardLayout.jsx # Dashboard layout with sidebar
│   │   ├── lib/                    # Utility functions
│   │   │   └── utils.js            # Common utilities
│   │   ├── pages/                  # Page components
│   │   │   ├── auth/               # Authentication pages
│   │   │   │   ├── LoginPage.jsx   # Login form
│   │   │   │   ├── SignupPage.jsx  # Registration form
│   │   │   │   └── OnboardingPage.jsx # User onboarding
│   │   │   ├── dashboard/          # Dashboard pages
│   │   │   │   ├── Dashboard.jsx   # Main dashboard
│   │   │   │   ├── Profile.jsx     # Role & Persona management
│   │   │   │   ├── Connections.jsx # Account integrations
│   │   │   │   ├── PersonaScore.jsx # AI persona scoring
│   │   │   │   ├── Trends.jsx      # Trend discovery
│   │   │   │   ├── PostGenerator.jsx # AI post generation
│   │   │   │   ├── Calendar.jsx    # Drafts & scheduler
│   │   │   │   ├── Analytics.jsx   # Analytics & reports
│   │   │   │   ├── Settings.jsx    # User settings
│   │   │   │   └── Upgrade.jsx     # Premium upgrade
│   │   │   └── LandingPage.jsx     # Public landing page
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles
│   ├── index.html                  # HTML template
│   ├── package.json                # Frontend dependencies
│   ├── tailwind.config.js          # Tailwind CSS config
│   ├── postcss.config.js           # PostCSS config
│   └── vite.config.js              # Vite build config
│
├── README.md                        # Project documentation
├── PROJECT_STRUCTURE.md             # This file
└── .gitignore                       # Git ignore rules
```

## 🔧 Key Components

### Backend Architecture

#### Models
- **User.js** - Complete user model with subscription, usage tracking, persona scoring, and social connections
- **Role.js** - Persona/role management with AI settings and performance tracking
- **Post.js** - Social media posts with platform-specific data and analytics
- **Trend.js** - Trending topics with AI analysis and content suggestions

#### Services
- **aiService.js** - Google Gemini AI integration for content generation and persona scoring
- **twitterService.js** - Twitter/X API v2 integration for posting and analytics
- **linkedinService.js** - LinkedIn API integration for professional networking
- **analyticsService.js** - Analytics processing and reporting
- **notificationService.js** - Email notifications and alerts

#### Routes
- **auth.js** - Authentication, registration, OAuth, onboarding
- **users.js** - Profile management, roles, persona scoring
- **posts.js** - Content generation, scheduling, publishing
- **trends.js** - Trend discovery and analysis
- **connections.js** - Social media OAuth and account management
- **analytics.js** - Performance metrics and reporting
- **billing.js** - Subscription management and payments

### Frontend Architecture

#### Pages Structure
- **Landing Page** - Marketing site with features, pricing, testimonials
- **Authentication** - Login, signup, onboarding flow
- **Dashboard** - Main hub with quick stats and navigation
- **Role & Persona** - Profile setup and persona management
- **Account Integrations** - Social media connection management
- **Persona Score** - AI-powered brand strength analysis
- **AI Trend Finder** - Discover relevant trending topics
- **AI Post Generator** - Create optimized social content
- **Drafts & Scheduler** - Content calendar and publishing
- **Analytics & Reports** - Performance tracking and insights

#### Component Library
- **UI Components** - Reusable design system components
- **Layout Components** - Headers, footers, navigation
- **Auth Components** - Protected routes and authentication
- **Context Providers** - Global state management

## 🔄 Data Flow

### User Onboarding Flow
1. **Registration** → User creates account
2. **Persona Setup** → Define role, industry, goals
3. **Account Integration** → Connect social media accounts
4. **AI Analysis** → Calculate initial persona score
5. **Dashboard Access** → Full platform functionality

### Content Creation Flow
1. **Trend Discovery** → Find relevant topics
2. **AI Generation** → Create personalized content
3. **Content Editing** → Refine and optimize
4. **Scheduling** → Plan publication timing
5. **Publishing** → Post to social platforms
6. **Analytics** → Track performance metrics

### Persona Scoring Flow
1. **Data Collection** → Gather social media data
2. **AI Analysis** → Evaluate profile strength
3. **Score Calculation** → Generate 0-100 score
4. **Feedback Generation** → Provide improvement suggestions
5. **Progress Tracking** → Monitor score changes over time

## 🔐 Security Implementation

### Authentication & Authorization
- JWT tokens for session management
- OAuth integration for social platforms
- Protected routes with middleware
- Role-based access control

### Data Protection
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Environment variable protection
- Secure password hashing

### API Security
- Request validation middleware
- Error handling and logging
- API key management
- Secure headers with Helmet.js

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  avatar: String,
  connectedAccounts: {
    twitter: { connected, username, tokens },
    linkedin: { connected, username, tokens }
  },
  subscription: { plan, status, billing },
  usage: { postsGenerated, limits },
  personaScore: { score, breakdown, feedback },
  settings: { timezone, notifications, theme },
  onboardingCompleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Role Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  name: String,
  description: String,
  persona: {
    industry: String,
    targetAudience: String,
    toneOfVoice: String,
    contentTypes: [String],
    keywords: [String],
    hashtags: [String]
  },
  platforms: { twitter, linkedin },
  aiSettings: { creativity, maxLength, preferences },
  performance: { totalPosts, avgEngagement },
  isActive: Boolean,
  isDefault: Boolean
}
```

### Post Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  role: ObjectId (ref: Role),
  content: String,
  hashtags: [String],
  aiGenerated: Boolean,
  trend: ObjectId (ref: Trend),
  status: String (draft|scheduled|published|failed),
  scheduledFor: Date,
  publishedAt: Date,
  platforms: {
    twitter: { tweetId, url, metrics },
    linkedin: { postId, url, metrics }
  },
  performance: { engagementRate, score }
}
```

### Trend Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  keywords: [String],
  hashtags: [String],
  platforms: { twitter, linkedin },
  metrics: { trendScore, velocity, sentiment },
  aiAnalysis: { summary, opportunities, risks },
  contentSuggestions: [{ type, text, engagement }],
  isActive: Boolean,
  createdAt: Date
}
```

## 🚀 Deployment Architecture

### Development Environment
- Frontend: Vite dev server (localhost:3000)
- Backend: Node.js/Express (localhost:5000)
- Database: Local MongoDB or MongoDB Atlas
- Redis: Local Redis instance (optional)

### Production Environment
- Frontend: Static hosting (Vercel, Netlify)
- Backend: Node.js hosting (Railway, Render, AWS)
- Database: MongoDB Atlas
- Redis: Redis Cloud or AWS ElastiCache
- CDN: Cloudinary for media assets

### Environment Variables
- Development: `.env` files
- Production: Platform environment settings
- Secrets: API keys, database URLs, JWT secrets
- Configuration: Feature flags, limits, settings

## 📈 Scalability Considerations

### Current Architecture (Monolithic)
- Single backend service
- Shared database
- Direct API integrations
- Simple deployment model

### Future Scaling Options
- Microservices architecture
- Service separation (auth, content, analytics)
- Database sharding
- Caching layers (Redis)
- Load balancing
- CDN integration
- Queue systems for background jobs

This structure provides a solid foundation for the Parsona platform while maintaining flexibility for future enhancements and scaling.