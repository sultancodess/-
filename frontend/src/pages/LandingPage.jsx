import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Calendar,
  BarChart3,
  Bell,
  Users,
  Check,
  ArrowRight,
  Twitter,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const LandingPage = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Persona Scoring",
      description:
        "AI evaluates your profile strength and provides personalized feedback for improvement.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "AI Trend Finder",
      description:
        "Discover role-specific trends from LinkedIn & X with intelligent filtering and analysis.",
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "AI Post Generator",
      description:
        "Generate high-quality posts combining your persona, trends, and AI optimization.",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Engagement Analytics",
      description:
        "Track likes, shares, comments and measure your personal brand growth over time.",
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Smart Scheduling",
      description:
        "Schedule posts across LinkedIn and X with automated publishing and optimization.",
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "LinkedIn & X Integration",
      description:
        "Seamlessly connect and manage your professional presence across both platforms.",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "1 Connected Platform (X)",
        "1 Role/Persona",
        "5 AI posts per day",
        "Trends preview (Top 3/day)",
        "Basic analytics",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      description: "For serious content creators",
      features: [
        "Multiple platforms (coming soon)",
        "Unlimited roles/personas",
        "Unlimited AI posts",
        "Full trends access",
        "Advanced analytics",
        "Post scheduling",
        "Priority support",
      ],
      cta: "Start 7-Day Trial",
      popular: true,
    },
    {
      name: "Agency",
      price: "$49",
      period: "per month",
      description: "For teams and agencies",
      features: [
        "Everything in Pro",
        "Multi-account management",
        "Team collaboration",
        "White-label reports",
        "Custom integrations",
        "Dedicated support",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Build Your Personal Brand with AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Parsona helps you create and strengthen your online presence on
              LinkedIn and X. AI-powered content generation, trend analysis, and
              persona scoring for career growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                asChild
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everythings you need for personal branding
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From persona analysis to content creation, Parsona provides
              AI-powered tools to build your professional presence and
              accelerate career growth.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full glass hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade at any
              time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  className={`h-full relative ${
                    plan.popular ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        /{plan.period}
                      </span>
                    </div>
                    <CardDescription className="text-base mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      asChild
                    >
                      <Link to="/signup">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
