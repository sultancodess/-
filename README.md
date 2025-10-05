# Parsona - AI-Powered Personal Branding Platform

Parsona helps users create and strengthen their online presence across social media platforms using AI-powered content generation, trend analysis, and persona scoring.

## 🚀 Features

### Core Features
- **Persona Setup & AI-driven Scoring** - Define your professional role and get AI-powered feedback
- **LinkedIn & X Account Integrations** - Connect and manage multiple social media accounts
- **AI-Powered Post Generation** - Generate content based on persona, trends, and AI optimization
- **Automated Scheduling & Publishing** - Schedule posts across platforms with cron job automation
- **Engagement Analytics & Growth Reports** - Track performance and measure personal brand growth

### User Features
- **Authentication** - Sign up/Login with Email, Google, LinkedIn, or X
- **Role & Persona Management** - Define role, skills, industry with JSON storage
- **Premium Subscription** - Freemium model with Razorpay/Stripe integration
- **AI Trend Finder** - Fetch role/industry-specific trends with NLP filtering
- **Post Management** - Drafts, scheduled posts, published posts with cron jobs
- **Analytics Dashboard** - Track likes, shares, comments, and persona growth

### Admin Features
- **User Management** - Manage users & subscriptions
- **API Monitoring** - Monitor API usage & costs
- **System Health Dashboard** - System monitoring and health checks
- **Content Moderation** - Optional content review and moderation

## 🏗️ Architecture

**Model:** Monolithic, Client-Server Architecture

- **Frontend:** React.js (Vite + JSX) + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express (Monolithic service)
- **Database:** MongoDB (User data, Persona JSON, Posts, Analytics)
- **APIs:** LinkedIn API, Twitter API, Google Gemini AI
- **Payments:** Razorpay / Stripe
- **Scheduler:** Cron Jobs for post scheduling

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- API Keys for:
  - Google Gemini AI
  - Twitter API v2
  - LinkedIn API
  - Google OAuth
  - Razorpay/Stripe

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd parsona
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/parsona

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Twitter API (X API v2)
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
TWITTER_CALLBACK_URL=http://localhost:5000/api/connections/twitter/callback

# LinkedIn API
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:5000/api/connections/linkedin/callback

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 User Flow

1. **Landing Page** → User discovers Parsona and its features
2. **Registration/Login** → User creates account or signs in
3. **Onboarding** → User sets up persona (role, industry, skills, goals)
4. **Account Integration** → User connects LinkedIn & Twitter accounts via OAuth
5. **Persona Score** → AI calculates initial persona strength score
6. **Trend Discovery** → User explores trending topics relevant to their role
7. **Content Generation** → AI generates personalized post drafts
8. **Content Management** → User edits, schedules, and publishes posts
9. **Analytics** → User tracks engagement and persona growth
10. **Optimization** → User receives AI recommendations for improvement

## 🎯 Target Audience

- **Job Seekers** – Building strong profiles to attract recruiters
- **Freelancers/Creators** – Growing audience and reputation
- **Professionals** – Strengthening thought leadership
- **Students** – Preparing for internships and first jobs

## 💰 Monetization Strategy

- **Freemium Model** - Basic persona scoring + limited posts (5/day)
- **Premium Subscription** (~$10–15/month) - Unlimited posts, advanced analytics, AI insights
- **Future Enterprise Tier** - For recruiters & agencies

## 📊 Success Metrics

- DAU/MAU growth
- Conversion rate free → premium
- Average engagement (likes, comments, shares)
- Retention (monthly churn < 5%)
- ARPU (Average Revenue Per User)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/complete-onboarding` - Complete onboarding

### Users & Roles
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/roles` - Get user roles
- `POST /api/users/roles` - Create new role
- `GET /api/users/persona-score` - Get persona score
- `POST /api/users/calculate-persona-score` - Calculate persona score

### Posts
- `POST /api/posts/generate` - Generate AI content
- `GET /api/posts` - Get user posts
- `PUT /api/posts/:id` - Update post
- `POST /api/posts/:id/publish` - Publish post
- `POST /api/posts/:id/schedule` - Schedule post

### Trends
- `GET /api/trends` - Get trending topics
- `GET /api/trends/:id` - Get single trend
- `GET /api/trends/hashtags/trending` - Get trending hashtags

### Connections
- `GET /api/connections/twitter/auth` - Twitter OAuth
- `GET /api/connections/linkedin/auth` - LinkedIn OAuth
- `POST /api/connections/twitter/disconnect` - Disconnect Twitter
- `POST /api/connections/linkedin/disconnect` - Disconnect LinkedIn
- `GET /api/connections/status` - Get connection status

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/engagement` - Get engagement metrics
- `GET /api/analytics/growth` - Get growth metrics

### Billing
- `POST /api/billing/create-subscription` - Create subscription
- `POST /api/billing/cancel-subscription` - Cancel subscription
- `GET /api/billing/subscription-status` - Get subscription status

## 🔒 Security Features

- JWT-based authentication
- OAuth integration for social accounts
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Environment variable protection

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables for production
3. Set up Redis for caching (optional)
4. Configure API keys for all services

### Backend Deployment
```bash
npm run build
npm start
```

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@parsona.com or join our Discord community.

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core authentication and user management
- ✅ Persona setup and scoring
- ✅ AI content generation
- ✅ Basic analytics dashboard
- ✅ LinkedIn & Twitter integration

### Phase 2 (Next)
- 🔄 Advanced analytics and reporting
- 🔄 Team collaboration features
- 🔄 Mobile app development
- 🔄 Additional social platforms
- 🔄 Enterprise features

### Phase 3 (Future)
- 📋 White-label solutions
- 📋 Advanced AI features
- 📋 Marketplace for content templates
- 📋 Integration with CRM systems
- 📋 Advanced automation workflows

---

Built with ❤️ by the Parsona Team