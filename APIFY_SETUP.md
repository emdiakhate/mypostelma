# Apify Competitor Analysis Setup Guide

This guide explains how to configure the Apify-based competitor analysis system.

## Overview

The competitor analysis system uses:
- **Apify** for scraping Instagram, Facebook, Twitter, and TikTok
- **Jina.ai** for scraping websites (free, no API key required)
- **OpenAI GPT-4o-mini** for AI analysis

## Cost Breakdown

### Per Analysis:
- **OpenAI**: ~€0.0013 (GPT-4o-mini)
- **Apify**: Varies by platform and data volume
  - Instagram Profile Scraper: ~$0.10-0.50 per run
  - Facebook Pages Scraper: ~$0.10-0.50 per run
  - Twitter Scraper: ~$0.10-0.30 per run (or free with Twitter API v2)
  - TikTok Scraper: ~$0.10-0.30 per run

**Total**: ~€0.50-2.00 per full competitor analysis (all platforms)

### Free Tier Options:
- **Apify**: $5 free credits on signup (≈5-10 analyses)
- **Twitter API v2**: 1,500 tweets/month free
- **Jina.ai**: Free for website scraping

## Setup Instructions

### 1. Get Apify API Token

1. Sign up at https://apify.com
2. Get $5 free credits
3. Go to Settings → Integrations → API tokens
4. Copy your API token

### 2. Get Twitter API Access (Optional)

Twitter API v2 is optional. If not configured, the system will use Apify's Twitter scraper (costs credits).

1. Go to https://developer.twitter.com
2. Create a new app
3. Get your Bearer Token (free tier: 1,500 tweets/month)

### 3. Configure Supabase Secrets

#### Option A: Via Supabase Dashboard
1. Go to your Supabase project
2. Navigate to Settings → Edge Functions → Secrets
3. Add the following secrets:

```
APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxx (optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx (should already exist)
```

#### Option B: Via Supabase CLI
```bash
# Required
supabase secrets set APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxx
supabase secrets set OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

# Optional (for Twitter API v2, otherwise uses Apify)
supabase secrets set TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxx
```

### 4. Update Database Schema (if needed)

The following JSONB columns should exist in `competitor_analysis` table:
- `instagram_data` (JSONB)
- `facebook_data` (JSONB)
- `linkedin_data` (JSONB)
- `twitter_data` (JSONB) - **NEW**
- `tiktok_data` (JSONB) - **NEW**
- `website_data` (JSONB)

If `twitter_data` and `tiktok_data` don't exist, run this migration:

```sql
ALTER TABLE competitor_analysis
ADD COLUMN IF NOT EXISTS twitter_data JSONB,
ADD COLUMN IF NOT EXISTS tiktok_data JSONB;
```

### 5. Deploy Edge Function

The new Edge Function is located at:
```
supabase/functions/analyze-competitor-apify/index.ts
```

Deploy it with:
```bash
supabase functions deploy analyze-competitor-apify
```

## Usage

### Add Competitor with Social URLs

When adding a competitor, provide URLs for the platforms you want to analyze:

```typescript
{
  name: "Nike",
  industry: "Sports & Apparel",
  instagram_url: "https://www.instagram.com/nike/",
  twitter_url: "https://twitter.com/Nike",
  facebook_url: "https://www.facebook.com/nike",
  tiktok_url: "https://www.tiktok.com/@nike",
  website_url: "https://www.nike.com"
}
```

### Analyze Competitor

Click the "Analyze" button on the competitor card. The analysis will:

1. **Scrape all platforms in parallel** (1-3 minutes)
   - Instagram: profile, posts, engagement metrics
   - Twitter: profile, tweets, engagement (via API or Apify)
   - Facebook: page, posts, likes
   - TikTok: profile, videos, engagement
   - Website: content via Jina.ai (fast, free)

2. **Analyze with OpenAI** (~10 seconds)
   - Positioning, content strategy, tone
   - Strengths, weaknesses, opportunities
   - Strategic recommendations

3. **Save to database**
   - Analysis results
   - Raw scraped data (for audit)
   - Cost tracking

## Data Collected Per Platform

### Instagram
- Username, full name, bio
- Followers, following, posts count
- Engagement rate, avg likes, avg comments
- Recent posts (up to 100, configurable)
- Top posts with captions and metrics

### Twitter/X
- Username, display name, description
- Followers, following, tweets count
- Recent tweets (up to 100)
- Engagement metrics per tweet

### Facebook
- Page name, about
- Likes, followers
- Recent posts with engagement

### TikTok
- Username, profile info
- Followers, hearts, videos count
- Recent videos with views, likes, comments

### Website
- Clean markdown content
- About, services, value proposition
- Blog posts, case studies

## Error Handling

The system handles:
- **Apify actor timeouts** (max 5 minutes per actor)
- **Invalid URLs** (graceful degradation)
- **Rate limits** (retry with exponential backoff)
- **Private profiles** (error message in data)
- **Budget exhaustion** (graceful failure, partial results)

## Troubleshooting

### "Analysis failed: Apify token not configured"
→ Add `APIFY_TOKEN` to Supabase secrets

### "Actor run timeout after 5 minutes"
→ Normal for large accounts. The system saves partial results. Try re-running.

### "No data returned from Instagram"
→ Profile might be private or URL is invalid

### "Failed to check run status: 401"
→ Invalid Apify token. Check your token and re-add to secrets.

## Cost Optimization Tips

1. **Limit scraping frequency**: Don't analyze competitors more than once per week
2. **Use Twitter API v2** instead of Apify for Twitter (free tier: 1,500 tweets/month)
3. **Reduce resultsLimit**: Currently set to 100 posts max per platform
4. **Cache results**: The system stores raw data, so you can re-analyze without re-scraping
5. **Monitor Apify dashboard**: Track usage at https://console.apify.com

## Beta Testing Notes

This is a beta implementation. Future improvements:
- **Caching**: 24h cache to avoid re-scraping
- **Selective scraping**: Choose which platforms to scrape
- **Scheduled analysis**: Auto-analyze competitors weekly
- **Gemini fallback**: Use Google Gemini for analysis (lower cost)
- **LinkedIn scraping**: Add LinkedIn support (requires different approach)

## Support

For issues:
1. Check Apify dashboard for actor run logs
2. Check Supabase Edge Function logs
3. Verify API tokens are correctly configured
4. Test individual URLs in Apify console first

## References

- Apify Docs: https://docs.apify.com
- Twitter API v2 Docs: https://developer.twitter.com/en/docs/twitter-api
- Jina.ai Docs: https://jina.ai/reader
- OpenAI API Docs: https://platform.openai.com/docs
