#!/usr/bin/env python3
"""
Live AI Sentiment Analysis Scraper
Scrapes AI-related news headlines from NewsAPI and performs sentiment analysis using Hugging Face.
"""

import os
import json
import requests
import feedparser
from datetime import datetime, timedelta
from collections import defaultdict
from transformers import pipeline
import pandas as pd

# API Configuration - Require environment variables (no fallback for security)
NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY")
HF_API_TOKEN = os.environ.get("HF_API_TOKEN")

if not NEWSAPI_KEY or not HF_API_TOKEN:
    print("Error: NEWSAPI_KEY and HF_API_TOKEN environment variables are required.")
    print("Set them with: export NEWSAPI_KEY=your_key && export HF_API_TOKEN=your_token")
    exit(1)

# NewsAPI endpoints
NEWSAPI_URL = "https://newsapi.org/v2/everything"

# Output path
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data.json")

# Search queries for AI news
AI_QUERIES = [
    "artificial intelligence",
    "machine learning",
    "ChatGPT",
    "OpenAI",
    "generative AI",
]

# Curated list of top news publishers
ALLOWED_SOURCES = [
    # Top Global News Publishers
    "Reuters",
    "Associated Press",
    "AP News",
    "BBC News",
    "BBC",
    "The New York Times",
    "New York Times",
    "The Washington Post",
    "Washington Post",
    "The Guardian",
    "Guardian",
    "Bloomberg",
    "Bloomberg.com",
    "Financial Times",
    "CNBC",
    "CNN",
    "The Wall Street Journal",
    "Wall Street Journal",
    "WSJ",
    # Top Tech Publishers
    "TechCrunch",
    "The Verge",
    "Wired",
    "WIRED",
    "Ars Technica",
]

def is_allowed_source(source_name):
    """Check if source is in our curated list"""
    if not source_name:
        return False
    source_lower = source_name.lower()
    return any(allowed.lower() in source_lower or source_lower in allowed.lower() 
               for allowed in ALLOWED_SOURCES)


def fetch_news_from_newsapi():
    """Fetch AI-related news from NewsAPI"""
    articles = []
    seen_titles = set()
    
    # Date range: last 7 days (NewsAPI free tier limit)
    to_date = datetime.now()
    from_date = to_date - timedelta(days=7)
    
    for query in AI_QUERIES:
        try:
            params = {
                "q": query,
                "from": from_date.strftime("%Y-%m-%d"),
                "to": to_date.strftime("%Y-%m-%d"),
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 100,  # Max to capture more from curated sources
                "apiKey": NEWSAPI_KEY,
            }
            
            response = requests.get(NEWSAPI_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "ok":
                for article in data.get("articles", []):
                    title = article.get("title", "")
                    source_name = article.get("source", {}).get("name", "Unknown")
                    
                    # Skip if no title or duplicate
                    if not title or title.lower() in seen_titles:
                        continue
                    
                    # Skip [Removed] articles
                    if "[Removed]" in title:
                        continue
                    
                    # Only include articles from curated sources
                    if not is_allowed_source(source_name):
                        continue
                    
                    seen_titles.add(title.lower())
                    
                    articles.append({
                        "headline": title,
                        "source": source_name,
                        "link": article.get("url", ""),
                        "published": article.get("publishedAt", datetime.now().isoformat()),
                        "description": article.get("description", ""),
                    })
            
            print(f"  Fetched {len(data.get('articles', []))} articles for query: {query}")
            
        except requests.RequestException as e:
            print(f"  Error fetching news for '{query}': {e}")
        except Exception as e:
            print(f"  Unexpected error for '{query}': {e}")
    
    return articles


# Google News RSS queries for AI topics
GOOGLE_NEWS_RSS_QUERIES = [
    "artificial intelligence",
    "OpenAI ChatGPT",
    "machine learning",
    "generative AI",
]

# BBC Technology RSS feed
BBC_RSS_URL = "http://feeds.bbci.co.uk/news/technology/rss.xml"

# AI-related keywords for filtering RSS results
AI_KEYWORDS = [
    "ai", "artificial intelligence", "machine learning", "chatgpt", "openai", 
    "gpt", "llm", "neural", "deep learning", "generative", "gemini", "claude",
    "anthropic", "microsoft copilot", "meta ai", "google ai"
]


def is_ai_related(text):
    """Check if text contains AI-related keywords"""
    if not text:
        return False
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in AI_KEYWORDS)


def extract_source_from_google_news(title):
    """Extract source name from Google News title (format: 'Headline - Source')"""
    if " - " in title:
        parts = title.rsplit(" - ", 1)
        if len(parts) == 2:
            return parts[0].strip(), parts[1].strip()
    return title, "Google News"


def fetch_news_from_google_rss():
    """Fetch AI-related news from Google News RSS"""
    articles = []
    seen_titles = set()
    
    # Browser-like headers to avoid blocking
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    print("  Fetching from Google News RSS...")
    
    for query in GOOGLE_NEWS_RSS_QUERIES:
        try:
            # Google News RSS URL format
            encoded_query = query.replace(" ", "+")
            url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
            
            # Fetch with requests first (to use custom headers), then parse
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            feed = feedparser.parse(response.text)
            
            for entry in feed.entries[:50]:  # Check more entries to find curated sources
                raw_title = entry.get("title", "")
                headline, source = extract_source_from_google_news(raw_title)
                
                # Skip if not from curated source list
                if not is_allowed_source(source):
                    continue
                
                # Skip duplicates
                if not headline or headline.lower() in seen_titles:
                    continue
                
                seen_titles.add(headline.lower())
                
                # Parse published date
                try:
                    pub_date = datetime(*entry.published_parsed[:6]).isoformat()
                except:
                    pub_date = datetime.now().isoformat()
                
                articles.append({
                    "headline": headline,
                    "source": source,
                    "link": entry.get("link", ""),
                    "published": pub_date,
                    "description": entry.get("summary", "")[:200] if entry.get("summary") else "",
                })
            
            print(f"    Found {len(feed.entries)} articles for query: {query}")
            
        except Exception as e:
            print(f"    Error fetching RSS for '{query}': {e}")
    
    print(f"  Total from Google News: {len(articles)} articles")
    return articles


def fetch_news_from_bbc_rss():
    """Fetch AI-related news from BBC Technology RSS"""
    articles = []
    
    print("  Fetching from BBC Technology RSS...")
    
    try:
        feed = feedparser.parse(BBC_RSS_URL)
        
        for entry in feed.entries:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            
            # Only include AI-related articles
            if not is_ai_related(title) and not is_ai_related(summary):
                continue
            
            # Parse published date
            try:
                pub_date = datetime(*entry.published_parsed[:6]).isoformat()
            except:
                pub_date = datetime.now().isoformat()
            
            articles.append({
                "headline": title,
                "source": "BBC News",
                "link": entry.get("link", ""),
                "published": pub_date,
                "description": summary[:200] if summary else "",
            })
        
        print(f"  Found {len(articles)} AI-related articles from BBC")
        
    except Exception as e:
        print(f"  Error fetching BBC RSS: {e}")
    
    return articles


def merge_and_deduplicate(articles_list):
    """Merge multiple article lists and remove duplicates"""
    seen_titles = set()
    merged = []
    
    # Flatten and deduplicate
    for articles in articles_list:
        for article in articles:
            title_key = article["headline"].lower()[:50]  # Use first 50 chars for matching
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                merged.append(article)
    
    # Sort by published date descending
    merged.sort(key=lambda x: x.get("published", ""), reverse=True)
    
    return merged


def analyze_sentiment_with_hf(articles):
    """Perform sentiment analysis using FinBERT (financial news specialized)"""
    print("Loading FinBERT sentiment model (optimized for financial news)...")
    
    # Use local model with HF token for authentication
    os.environ["HF_TOKEN"] = HF_API_TOKEN
    
    # FinBERT is specifically trained on financial news
    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model="ProsusAI/finbert",
        token=HF_API_TOKEN,
        top_k=None
    )
    
    print(f"Analyzing sentiment for {len(articles)} articles...")
    
    for i, article in enumerate(articles):
        try:
            # Use headline + description for better context
            text = article["headline"]
            if article.get("description"):
                text = f"{text}. {article['description'][:200]}"
            
            # Truncate to avoid token limits
            text = text[:500]
            
            result = sentiment_pipeline(text)[0]
            
            # FinBERT outputs: positive, negative, neutral
            scores = {r["label"]: r["score"] for r in result}
            positive_score = scores.get("positive", 0)
            negative_score = scores.get("negative", 0)
            neutral_score = scores.get("neutral", 0)
            
            # Calculate sentiment score between -1 and 1
            # Positive pulls toward +1, negative toward -1
            sentiment_score = positive_score - negative_score
            
            # Determine label (FinBERT is more nuanced, so use tighter thresholds)
            if positive_score > negative_score and positive_score > neutral_score:
                label = "Positive"
            elif negative_score > positive_score and negative_score > neutral_score:
                label = "Negative"
            else:
                label = "Neutral"
            
            article["sentiment_score"] = round(sentiment_score, 3)
            article["sentiment_label"] = label
            article["confidence"] = round(max(positive_score, negative_score, neutral_score), 3)
            
            if (i + 1) % 20 == 0:
                print(f"  Processed {i + 1}/{len(articles)} articles...")
            
        except Exception as e:
            print(f"  Error analyzing article: {e}")
            article["sentiment_score"] = 0
            article["sentiment_label"] = "Neutral"
            article["confidence"] = 0
    
    # Remove description from output (not needed in frontend)
    for article in articles:
        article.pop("description", None)
    
    return articles


def calculate_daily_stats(articles):
    """Calculate daily sentiment statistics"""
    daily_data = defaultdict(list)
    
    for article in articles:
        date = article["published"][:10]  # Extract date portion
        daily_data[date].append(article["sentiment_score"])
    
    daily_stats = []
    for date, scores in sorted(daily_data.items()):
        daily_stats.append({
            "date": date,
            "avg_sentiment": round(sum(scores) / len(scores), 3),
            "article_count": len(scores),
            "positive_count": sum(1 for s in scores if s > 0.2),
            "negative_count": sum(1 for s in scores if s < -0.2),
            "neutral_count": sum(1 for s in scores if -0.2 <= s <= 0.2)
        })
    
    return daily_stats


def calculate_moving_average(daily_stats, window=7):
    """Calculate 7-day moving average"""
    if len(daily_stats) < 1:
        return daily_stats
    
    window = min(window, len(daily_stats))
    
    df = pd.DataFrame(daily_stats)
    df["moving_avg"] = df["avg_sentiment"].rolling(window=window, min_periods=1).mean().round(3)
    
    return df.to_dict(orient="records")


def calculate_source_stats(articles):
    """Calculate sentiment statistics by source"""
    source_data = defaultdict(list)
    
    for article in articles:
        source_data[article["source"]].append(article["sentiment_score"])
    
    source_stats = []
    for source, scores in source_data.items():
        if len(scores) >= 2:  # Only include sources with 2+ articles
            avg_score = sum(scores) / len(scores)
            source_stats.append({
                "source": source,
                "avg_sentiment": round(avg_score, 3),
                "article_count": len(scores),
                "sentiment_label": "Positive" if avg_score > 0.2 else ("Negative" if avg_score < -0.2 else "Neutral")
            })
    
    # Sort by article count descending
    source_stats.sort(key=lambda x: x["article_count"], reverse=True)
    return source_stats[:20]  # Top 20 sources


def main():
    print("=" * 60)
    print("AI Sentiment Analysis Pipeline")
    print("=" * 60)
    
    # Fetch news from multiple sources
    print("\n1. Fetching news from multiple sources...")
    
    # Source 1: NewsAPI (curated sources only)
    print("\n  [NewsAPI]")
    newsapi_articles = fetch_news_from_newsapi()
    print(f"    → {len(newsapi_articles)} articles from NewsAPI")
    
    # Source 2: Google News RSS (includes Reuters, Bloomberg, etc.)
    print("\n  [Google News RSS]")
    google_articles = fetch_news_from_google_rss()
    print(f"    → {len(google_articles)} articles from Google News")
    
    # Source 3: BBC Technology RSS
    print("\n  [BBC RSS]")
    bbc_articles = fetch_news_from_bbc_rss()
    print(f"    → {len(bbc_articles)} articles from BBC")
    
    # Merge and deduplicate
    print("\n  Merging and deduplicating...")
    articles = merge_and_deduplicate([newsapi_articles, google_articles, bbc_articles])
    print(f"   Total unique articles: {len(articles)}")
    
    if not articles:
        print("   ⚠️ No articles found, exiting.")
        return
    
    # Analyze sentiment
    print("\n2. Running sentiment analysis with Hugging Face...")
    articles = analyze_sentiment_with_hf(articles)
    
    # Calculate statistics
    print("\n3. Calculating statistics...")
    daily_stats = calculate_daily_stats(articles)
    daily_stats = calculate_moving_average(daily_stats)
    source_stats = calculate_source_stats(articles)
    
    # Calculate overall stats
    all_scores = [a["sentiment_score"] for a in articles if "sentiment_score" in a]
    overall_sentiment = sum(all_scores) / len(all_scores) if all_scores else 0
    
    # Build output
    output = {
        "last_updated": datetime.now().isoformat(),
        "total_articles": len(articles),
        "overall_sentiment": round(overall_sentiment, 3),
        "overall_label": "Positive" if overall_sentiment > 0.2 else ("Negative" if overall_sentiment < -0.2 else "Neutral"),
        "daily_stats": daily_stats,
        "source_stats": source_stats,
        "articles": sorted(articles, key=lambda x: x["published"], reverse=True)[:100]  # Latest 100
    }
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    # Write output
    print(f"\n4. Writing output to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)
    
    print("\n" + "=" * 60)
    print("✅ Pipeline Complete!")
    print("=" * 60)
    print(f"   Total articles analyzed: {len(articles)}")
    print(f"   Overall sentiment: {overall_sentiment:.3f} ({output['overall_label']})")
    print(f"   Date range: {daily_stats[0]['date'] if daily_stats else 'N/A'} to {daily_stats[-1]['date'] if daily_stats else 'N/A'}")
    print(f"   Unique sources: {len(source_stats)}")


if __name__ == "__main__":
    main()
