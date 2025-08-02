const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateTrendBasedContent = async (
  userProfile,
  trend,
  platform = "X"
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are PersonaPilot's AI Post Generator.

🎯 Goal: Generate optimized posts for ${platform}, based on trend context.

⚙️ Dynamic Inputs:
mode = "trend_based"
role = "${userProfile.role}"
industry = "${userProfile.industry}"
tone = "${userProfile.tone}"
branding_goal = "${userProfile.brandingGoal}"
platform = "${platform}"
topics_keywords = ${JSON.stringify(userProfile.topicsKeywords)}
trend_title = "${trend.title}"
trend_summary = "${trend.summary}"

📌 Rules for trend_based mode:
- Use trend_title + trend_summary + topics_keywords
- Generate 3 versions:
  * Version 1 (Hook + Short Post + Hashtags) → For quick scroll capture
  * Version 2 (Hook + Story Format + CTA) → For engagement
  * Version 3 (Hook + Insight + Value) → For thought leadership
- Include relevant hashtags from topics_keywords
- Adapt style for platform (LinkedIn = more formal, X = concise/engaging)

📤 Output JSON format:
{
  "post_variations": [
    {
      "version": 1,
      "hook": "🚀 Exciting development in ${userProfile.industry}...",
      "body": "Main content here",
      "hashtags": ["#relevant", "#hashtags"]
    }
  ]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    let text = response.text();

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return parsedResponse;
      }
    } catch (parseError) {
      console.log("JSON parsing failed, using fallback format");
    }

    // Fallback format if JSON parsing fails
    return {
      post_variations: [
        {
          version: 1,
          hook: `🚀 ${trend.title} is changing ${userProfile.industry}!`,
          body: text.substring(0, 200),
          hashtags: userProfile.topicsKeywords
            .slice(0, 3)
            .map((k) => `#${k.replace(/\s+/g, "")}`),
        },
      ],
    };
  } catch (error) {
    console.error("AI trend-based generation error:", error);
    throw new Error("Failed to generate trend-based content");
  }
};

const generateCustomContent = async (
  userProfile,
  userDraft,
  platform = "X"
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are PersonaPilot's AI Post Generator.

🎯 Goal: Generate optimized posts for ${platform}, enhancing user's custom draft.

⚙️ Dynamic Inputs:
mode = "custom_post"
role = "${userProfile.role}"
industry = "${userProfile.industry}"
tone = "${userProfile.tone}"
branding_goal = "${userProfile.brandingGoal}"
platform = "${platform}"
topics_keywords = ${JSON.stringify(userProfile.topicsKeywords)}
user_draft = "${userDraft}"

📌 Rules for custom_post mode:
- Enhance user_draft:
  * Correct grammar & clarity
  * Add a strong opening hook based on tone & platform
  * Suggest 2–3 relevant hashtags
- Create 3 versions:
  * Professional
  * Engaging
  * Motivational/Casual
- Adapt style for platform (LinkedIn = more formal, X = concise/engaging)

📤 Output JSON format:
{
  "post_variations": [
    {
      "version": 1,
      "style": "Professional",
      "hook": "Professional hook here...",
      "body": "Enhanced content here",
      "hashtags": ["#relevant", "#hashtags"]
    }
  ]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    let text = response.text();

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return parsedResponse;
      }
    } catch (parseError) {
      console.log("JSON parsing failed, using fallback format");
    }

    // Fallback format
    return {
      post_variations: [
        {
          version: 1,
          style: "Enhanced",
          hook: "✨ Here's an update:",
          body: text.substring(0, 200),
          hashtags: userProfile.topicsKeywords
            .slice(0, 3)
            .map((k) => `#${k.replace(/\s+/g, "")}`),
        },
      ],
    };
  } catch (error) {
    console.error("AI custom content generation error:", error);
    throw new Error("Failed to generate custom content");
  }
};

// Legacy function for backward compatibility
const generateContent = async (prompt, aiSettings = {}) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const generationConfig = {
      temperature: aiSettings.creativity || 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = await result.response;
    let text = response.text();

    // Extract hashtags from the generated content
    const hashtagRegex = /#[\w]+/g;
    const hashtags = text.match(hashtagRegex) || [];

    // Clean hashtags (remove # symbol)
    const cleanHashtags = hashtags.map((tag) => tag.substring(1));

    // Ensure content fits within character limits
    if (aiSettings.maxLength && text.length > aiSettings.maxLength) {
      text = text.substring(0, aiSettings.maxLength - 3) + "...";
    }

    return {
      text: text.trim(),
      hashtags: cleanHashtags,
      wordCount: text.split(" ").length,
      characterCount: text.length,
    };
  } catch (error) {
    console.error("AI generation error:", error);
    throw new Error("Failed to generate content");
  }
};

const analyzeContent = async (content) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze this social media content and provide insights:
    
    Content: "${content}"
    
    Please provide:
    1. Sentiment (positive/negative/neutral)
    2. Tone (professional/casual/humorous/etc.)
    3. Target audience
    4. Engagement potential (1-10)
    5. Suggested improvements
    
    Format as JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    try {
      return JSON.parse(analysisText);
    } catch (parseError) {
      // If JSON parsing fails, return a basic analysis
      return {
        sentiment: "neutral",
        tone: "professional",
        targetAudience: "general",
        engagementPotential: 5,
        suggestedImprovements: ["Consider adding more engaging elements"],
      };
    }
  } catch (error) {
    console.error("Content analysis error:", error);
    throw new Error("Failed to analyze content");
  }
};

const generateVariations = async (originalContent, count = 3) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create ${count} variations of this social media post while maintaining the core message:

    Original: "${originalContent}"

    Requirements:
    - Keep the same tone and intent
    - Vary the wording and structure
    - Maintain character limits for Twitter (280 chars)
    - Each variation should be unique and engaging

    Format as a JSON array of strings.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const variationsText = response.text();

    try {
      const variations = JSON.parse(variationsText);
      return Array.isArray(variations) ? variations : [variationsText];
    } catch (parseError) {
      // If JSON parsing fails, return the raw text split by lines
      return variationsText
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, count);
    }
  } catch (error) {
    console.error("Variation generation error:", error);
    throw new Error("Failed to generate variations");
  }
};

const optimizeForEngagement = async (content, platform = "twitter") => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Optimize this social media post for maximum engagement on ${platform}:

    Original: "${content}"

    Please:
    1. Improve the hook/opening
    2. Add engaging elements (questions, calls-to-action, etc.)
    3. Optimize hashtag usage
    4. Ensure platform-specific best practices
    5. Maintain authenticity

    Return the optimized version.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const optimizedContent = response.text().trim();

    return {
      original: content,
      optimized: optimizedContent,
      improvements: [
        "Enhanced opening hook",
        "Added engagement elements",
        "Optimized for platform",
      ],
    };
  } catch (error) {
    console.error("Content optimization error:", error);
    throw new Error("Failed to optimize content");
  }
};

const generateTrendInsights = async (userProfile, trendsData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are PersonaPilot's AI Trend Finder.

🎯 Goal: Identify, rank, and summarize the most relevant trends for a user's personal brand growth on X and LinkedIn.

⚙️ Dynamic Inputs:
role = "${userProfile.role}"
industry = "${userProfile.industry}"
experience_level = "${userProfile.experienceLevel}"
branding_goal = "${userProfile.brandingGoal}"
topics_keywords = ${JSON.stringify(userProfile.topicsKeywords)}
platform = "${userProfile.platform || "X"}"
trend_data = ${JSON.stringify(trendsData)}

📌 Rules:
- Filter trend_data: Must match user.role OR industry OR topics_keywords
- Prioritize trends supporting branding_goal
- Rank trends by: Relevance Score (0–100), Engagement Potential (Low, Medium, High)
- For top 5 trends: Summarize in one engaging sentence, Suggest content angle aligned with branding_goal, Suggest hook aligned with tone

📤 Output JSON:
{
  "trends": [
    {
      "trend_title": "AI-powered SaaS Builders",
      "relevance_score": 91,
      "engagement_potential": "High",
      "summary": "Indie hackers are using AI tools to build MVPs in days instead of weeks.",
      "content_angle": "Position yourself as an early adopter leveraging AI to speed product delivery.",
      "hook": "🚀 Building faster than ever with AI — Here's how it changes the SaaS game."
    }
  ]
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    let text = response.text();

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return parsedResponse;
      }
    } catch (parseError) {
      console.log("JSON parsing failed for trend insights");
    }

    // Fallback format
    return {
      trends: trendsData.slice(0, 5).map((trend, index) => ({
        trend_title: trend.title,
        relevance_score: Math.max(60, 100 - index * 10),
        engagement_potential: index < 2 ? "High" : index < 4 ? "Medium" : "Low",
        summary:
          trend.description || `Trending topic in ${userProfile.industry}`,
        content_angle: `Share your perspective on ${trend.title} as a ${userProfile.role}`,
        hook: `💡 ${trend.title} is reshaping ${userProfile.industry}...`,
      })),
    };
  } catch (error) {
    console.error("AI trend insights error:", error);
    throw new Error("Failed to generate trend insights");
  }
};

module.exports = {
  generateContent,
  generateTrendBasedContent,
  generateCustomContent,
  generateTrendInsights,
  analyzeContent,
  generateVariations,
  optimizeForEngagement,
};
