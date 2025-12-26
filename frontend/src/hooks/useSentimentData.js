import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and provide sentiment data
 * @returns {{ data: Object|null, loading: boolean, error: string|null }}
 */
export function useSentimentData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // In production, this fetches from the static data.json
                const response = await fetch(`${import.meta.env.BASE_URL}data.json`);
                if (!response.ok) {
                    throw new Error('Failed to fetch sentiment data');
                }
                const jsonData = await response.json();
                setData(jsonData);
                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                // Load sample data for development
                setData(getSampleData());
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

/**
 * Generate sample data for development/demo purposes
 */
function getSampleData() {
    const now = new Date();
    const articles = [];
    const dailyStats = [];
    const sources = [
        'TechCrunch', 'The Verge', 'Bloomberg', 'Reuters',
        'BBC News', 'Ars Technica', 'VentureBeat', 'MIT Technology Review',
        'The Guardian', 'New York Times', 'Wired', 'CNBC'
    ];

    const headlines = [
        { text: 'OpenAI Announces Major Breakthrough in AI Safety Research', sentiment: 0.75 },
        { text: 'Google DeepMind Achieves New Milestone in Protein Folding', sentiment: 0.82 },
        { text: 'Concerns Rise Over AI Job Displacement in Tech Industry', sentiment: -0.65 },
        { text: 'ChatGPT Reaches 200 Million Weekly Users Milestone', sentiment: 0.58 },
        { text: 'EU Passes Landmark AI Regulation Bill', sentiment: 0.12 },
        { text: 'Microsoft Integrates AI Deeply Into Windows', sentiment: 0.45 },
        { text: 'AI Startup Raises $500M in Series C Funding', sentiment: 0.62 },
        { text: 'Experts Warn of AI-Generated Misinformation Risks', sentiment: -0.78 },
        { text: 'New AI Model Achieves Human-Level Performance on Tests', sentiment: 0.71 },
        { text: 'Tech Giants Face Scrutiny Over AI Training Data', sentiment: -0.42 },
        { text: 'AI-Powered Drug Discovery Shows Promising Results', sentiment: 0.85 },
        { text: 'Privacy Concerns Mount as AI Surveillance Expands', sentiment: -0.68 },
        { text: 'Anthropic Releases Claude 3 with Enhanced Capabilities', sentiment: 0.55 },
        { text: 'AI Copyright Lawsuit Takes Unexpected Turn', sentiment: -0.35 },
        { text: 'Meta Unveils New AI-Powered Social Features', sentiment: 0.38 },
        { text: 'AI Bias Study Reveals Persistent Discrimination Issues', sentiment: -0.72 },
        { text: 'Autonomous Vehicles Make Safety Breakthrough', sentiment: 0.68 },
        { text: 'China Announces Major AI Investment Initiative', sentiment: 0.25 },
        { text: 'AI Art Generator Sparks Creative Industry Debate', sentiment: -0.18 },
        { text: 'Healthcare AI Tools Receive FDA Approval', sentiment: 0.79 },
    ];

    // Generate articles for the past 14 days
    for (let day = 0; day < 14; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];

        // 4-8 articles per day
        const numArticles = 4 + Math.floor(Math.random() * 5);
        let dayTotal = 0;

        for (let i = 0; i < numArticles; i++) {
            const headlineData = headlines[Math.floor(Math.random() * headlines.length)];
            const source = sources[Math.floor(Math.random() * sources.length)];
            const variation = (Math.random() - 0.5) * 0.3;
            const sentiment = Math.max(-1, Math.min(1, headlineData.sentiment + variation));

            articles.push({
                headline: headlineData.text,
                source: source,
                link: `https://example.com/article-${day}-${i}`,
                published: new Date(date.getTime() - i * 3600000).toISOString(),
                sentiment_score: parseFloat(sentiment.toFixed(3)),
                sentiment_label: sentiment > 0.2 ? 'Positive' : sentiment < -0.2 ? 'Negative' : 'Neutral',
                confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(3))
            });

            dayTotal += sentiment;
        }

        const avgSentiment = dayTotal / numArticles;
        dailyStats.push({
            date: dateStr,
            avg_sentiment: parseFloat(avgSentiment.toFixed(3)),
            article_count: numArticles,
            positive_count: articles.filter(a => a.published.startsWith(dateStr) && a.sentiment_score > 0.2).length,
            negative_count: articles.filter(a => a.published.startsWith(dateStr) && a.sentiment_score < -0.2).length,
            neutral_count: articles.filter(a => a.published.startsWith(dateStr) && Math.abs(a.sentiment_score) <= 0.2).length,
        });
    }

    // Calculate 7-day moving average
    dailyStats.reverse();
    for (let i = 0; i < dailyStats.length; i++) {
        const window = dailyStats.slice(Math.max(0, i - 6), i + 1);
        const avg = window.reduce((sum, d) => sum + d.avg_sentiment, 0) / window.length;
        dailyStats[i].moving_avg = parseFloat(avg.toFixed(3));
    }

    // Calculate source stats
    const sourceMap = {};
    articles.forEach(article => {
        if (!sourceMap[article.source]) {
            sourceMap[article.source] = { scores: [], count: 0 };
        }
        sourceMap[article.source].scores.push(article.sentiment_score);
        sourceMap[article.source].count++;
    });

    const sourceStats = Object.entries(sourceMap).map(([source, data]) => ({
        source,
        avg_sentiment: parseFloat((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(3)),
        article_count: data.count,
        sentiment_label: data.scores.reduce((a, b) => a + b, 0) / data.scores.length > 0.2 ? 'Positive' :
            data.scores.reduce((a, b) => a + b, 0) / data.scores.length < -0.2 ? 'Negative' : 'Neutral'
    })).sort((a, b) => b.article_count - a.article_count);

    const overallSentiment = articles.reduce((sum, a) => sum + a.sentiment_score, 0) / articles.length;

    return {
        last_updated: now.toISOString(),
        total_articles: articles.length,
        overall_sentiment: parseFloat(overallSentiment.toFixed(3)),
        overall_label: overallSentiment > 0.2 ? 'Positive' : overallSentiment < -0.2 ? 'Negative' : 'Neutral',
        daily_stats: dailyStats,
        source_stats: sourceStats,
        articles: articles.sort((a, b) => new Date(b.published) - new Date(a.published))
    };
}

export default useSentimentData;
