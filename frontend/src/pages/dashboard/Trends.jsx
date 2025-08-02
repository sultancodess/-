import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Sparkles,
  Filter,
  Search,
  RefreshCw,
  Target,
  Lightbulb,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

const Trends = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTrends, setFilteredTrends] = useState([]);
  const [activeTab, setActiveTab] = useState("for-you");
  const [userRoles, setUserRoles] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "technology", label: "Technology" },
    { value: "business", label: "Business" },
    { value: "entertainment", label: "Entertainment" },
    { value: "sports", label: "Sports" },
    { value: "politics", label: "Politics" },
    { value: "health", label: "Health" },
    { value: "science", label: "Science" },
    { value: "education", label: "Education" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "travel", label: "Travel" },
    { value: "food", label: "Food" },
    { value: "fashion", label: "Fashion" },
    { value: "gaming", label: "Gaming" },
    { value: "music", label: "Music" },
    { value: "art", label: "Art" },
    { value: "general", label: "General" },
  ];

  const commonRoles = [
    "CSE Student",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "Product Manager",
    "UI/UX Designer",
    "Marketing Specialist",
    "Content Creator",
    "Entrepreneur",
  ];

  useEffect(() => {
    fetchTrends();
    fetchUserRoles();
  }, []);

  useEffect(() => {
    filterTrends();
  }, [trends, selectedCategory, selectedRole, searchTerm, activeTab]);

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get("/api/users/roles");
      setUserRoles(response.data.roles || []);
    } catch (error) {
      console.error("Failed to fetch user roles:", error);
    }
  };

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
      };

      // Add role-based filtering if user has roles
      if (activeTab === "for-you" && userRoles.length > 0) {
        params.roleId = userRoles[0]._id; // Use primary role
      }

      const response = await axios.get("/api/trends", { params });
      setTrends(response.data.trends || []);
    } catch (error) {
      console.error("Failed to fetch trends:", error);

      // Enhanced mock data with role-based content suggestions
      const mockTrends = [
        {
          _id: "1",
          title: "AI Revolution 2024",
          description:
            "The latest developments in artificial intelligence are reshaping industries worldwide.",
          category: "technology",
          hashtags: ["AI", "Technology", "Innovation"],
          keywords: [
            "artificial intelligence",
            "machine learning",
            "automation",
          ],
          metrics: { trendScore: 95, velocity: 8.5, sentiment: "positive" },
          platforms: { twitter: { tweetVolume: 15420 } },
          createdAt: "2024-01-07T10:00:00Z",
          isActive: true,
          personaImpact: {
            score: "+8",
            reason: "High relevance for tech professionals",
          },
          contentSuggestions: [
            {
              type: "opinion",
              text: "Share your thoughts on how AI is transforming your field",
              engagement: 85,
            },
            {
              type: "educational",
              text: "Break down a complex AI concept for your audience",
              engagement: 78,
            },
          ],
          roleRelevance: {
            "CSE Student": 95,
            "Frontend Developer": 80,
            "Data Scientist": 98,
          },
        },
        {
          _id: "2",
          title: "Remote Work Evolution",
          description:
            "Companies are adopting new strategies for distributed teams.",
          category: "business",
          hashtags: ["RemoteWork", "Business", "Productivity"],
          keywords: ["remote work", "distributed teams", "work from home"],
          metrics: { trendScore: 87, velocity: 6.2, sentiment: "positive" },
          platforms: { twitter: { tweetVolume: 8930 } },
          createdAt: "2024-01-07T09:30:00Z",
          isActive: true,
          personaImpact: {
            score: "+5",
            reason: "Shows adaptability and modern work awareness",
          },
          contentSuggestions: [
            {
              type: "personal",
              text: "Share your remote work setup or productivity tips",
              engagement: 72,
            },
            {
              type: "tip",
              text: "Offer advice on remote collaboration tools",
              engagement: 68,
            },
          ],
          roleRelevance: {
            "Frontend Developer": 85,
            "Product Manager": 90,
            "Marketing Specialist": 75,
          },
        },
        {
          _id: "3",
          title: "Sustainable Technology",
          description: "Green tech solutions are gaining momentum in 2024.",
          category: "technology",
          hashtags: ["GreenTech", "Sustainability", "CleanEnergy"],
          keywords: ["sustainable technology", "green energy", "climate tech"],
          metrics: { trendScore: 82, velocity: 7.1, sentiment: "positive" },
          platforms: { twitter: { tweetVolume: 12150 } },
          createdAt: "2024-01-07T08:45:00Z",
          isActive: true,
        },
        {
          _id: "4",
          title: "Digital Marketing Trends",
          description:
            "New strategies emerging in the digital marketing landscape.",
          category: "business",
          hashtags: ["DigitalMarketing", "Marketing", "Strategy"],
          keywords: ["digital marketing", "social media", "content strategy"],
          metrics: { trendScore: 78, velocity: 5.8, sentiment: "neutral" },
          platforms: { twitter: { tweetVolume: 6780 } },
          createdAt: "2024-01-07T07:20:00Z",
          isActive: true,
        },
        {
          _id: "5",
          title: "Cryptocurrency Updates",
          description:
            "Latest developments in the crypto and blockchain space.",
          category: "technology",
          hashtags: ["Crypto", "Blockchain", "Bitcoin"],
          keywords: ["cryptocurrency", "blockchain", "bitcoin"],
          metrics: { trendScore: 75, velocity: 4.8, sentiment: "neutral" },
          platforms: { twitter: { tweetVolume: 9240 } },
          createdAt: "2024-01-07T07:00:00Z",
          isActive: true,
        },
        {
          _id: "6",
          title: "Health & Wellness Tech",
          description: "Technology innovations in healthcare and wellness.",
          category: "health",
          hashtags: ["HealthTech", "Wellness", "MedTech"],
          keywords: ["health technology", "wellness apps", "medical devices"],
          metrics: { trendScore: 71, velocity: 5.2, sentiment: "positive" },
          platforms: { twitter: { tweetVolume: 5670 } },
          createdAt: "2024-01-07T06:30:00Z",
          isActive: true,
        },
      ];

      setTrends(mockTrends);
      toast.error("Failed to fetch live trends. Showing sample data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshTrends = async () => {
    setRefreshing(true);
    await fetchTrends();
    setRefreshing(false);
    toast.success("Trends refreshed!");
  };

  const filterTrends = () => {
    let filtered = trends;

    // Filter by tab (For You vs All Trends)
    if (activeTab === "for-you" && userRoles.length > 0) {
      // Sort by role relevance for personalized feed
      const primaryRole = userRoles[0]?.name || "Frontend Developer";
      filtered = filtered.sort((a, b) => {
        const aRelevance = a.roleRelevance?.[primaryRole] || 0;
        const bRelevance = b.roleRelevance?.[primaryRole] || 0;
        return bRelevance - aRelevance;
      });
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (trend) => trend.category === selectedCategory
      );
    }

    // Filter by role
    if (selectedRole !== "all") {
      filtered = filtered.filter(
        (trend) => trend.roleRelevance?.[selectedRole] > 50
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (trend) =>
          trend.title.toLowerCase().includes(searchLower) ||
          trend.description.toLowerCase().includes(searchLower) ||
          trend.hashtags.some((tag) =>
            tag.toLowerCase().includes(searchLower)
          ) ||
          trend.keywords?.some((keyword) =>
            keyword.toLowerCase().includes(searchLower)
          )
      );
    }

    setFilteredTrends(filtered);
  };

  const generatePost = (trend) => {
    // Navigate to post generator with trend data
    navigate("/dashboard/generator", {
      state: {
        trend: {
          id: trend._id,
          title: trend.title,
          description: trend.description,
          hashtags: trend.hashtags,
          category: trend.category,
        },
      },
    });
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Target className="mr-3 h-8 w-8 text-primary" />
            Role-Based Trends
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover trending topics tailored to your persona and career goals.
            Build your personal brand with AI-powered content suggestions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button
            onClick={refreshTrends}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="for-you" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            For You
          </TabsTrigger>
          <TabsTrigger value="all-trends" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            All Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="space-y-6">
          {userRoles.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target className="mr-2 h-5 w-5 text-primary" />
                <h3 className="font-semibold">Personalized for Your Role</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Trends curated for{" "}
                <span className="font-medium text-primary">
                  {userRoles[0]?.name || "your primary role"}
                </span>{" "}
                to help boost your persona score and career growth.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-trends" className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="mr-2 h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">All Trending Topics</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Explore all trending topics across different industries and
              categories.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trends..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {userRoles.length > 0 && (
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {userRoles.map((role) => (
                  <SelectItem key={role._id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTrends.length} of {trends.length} trends
        </p>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
            Clear search
          </Button>
        )}
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTrends.map((trend, index) => (
          <motion.div
            key={trend._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {trend.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {trend.description}
                    </CardDescription>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-primary">
                      {trend.metrics.trendScore}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Trend Score
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Persona Impact */}
                  {trend.personaImpact && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Persona Impact
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                        >
                          {trend.personaImpact.score}
                        </Badge>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {trend.personaImpact.reason}
                      </p>
                    </div>
                  )}

                  {/* AI Content Suggestions */}
                  {trend.contentSuggestions &&
                    trend.contentSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center text-sm font-medium">
                          <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                          AI Content Ideas
                        </div>
                        {trend.contentSuggestions
                          .slice(0, 2)
                          .map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="bg-muted/50 rounded-md p-2 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {suggestion.type}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {suggestion.engagement}% engagement
                                </span>
                              </div>
                              <p className="text-muted-foreground">
                                {suggestion.text}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Volume</div>
                      <div className="text-muted-foreground">
                        {formatNumber(trend.platforms.twitter.tweetVolume)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Velocity</div>
                      <div className="text-muted-foreground">
                        {trend.metrics.velocity}/10
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Sentiment</div>
                      <div
                        className={`capitalize ${getSentimentColor(
                          trend.metrics.sentiment
                        )}`}
                      >
                        {trend.metrics.sentiment}
                      </div>
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Popular Hashtags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trend.hashtags?.map((hashtag) => (
                        <Badge
                          key={hashtag}
                          variant="secondary"
                          className="text-xs"
                        >
                          #{hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Category and Date */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {trend.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(trend.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => generatePost(trend)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Post
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Add to saved trends functionality
                        toast.success("Trend saved for later!");
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTrends.length === 0 && !loading && (
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm || selectedCategory !== "all"
              ? "No matching trends found"
              : "No trends available"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== "all"
              ? "Try adjusting your filters or search terms."
              : "Check back later for new trending topics."}
          </p>
          {(searchTerm || selectedCategory !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Trends;
