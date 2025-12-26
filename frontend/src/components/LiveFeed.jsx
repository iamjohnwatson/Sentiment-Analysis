import { useState } from 'react';
import { IconNewspaper } from './Icons';

/**
 * Enhanced Live Feed with dark theme and interactive cards
 */
export function LiveFeed({ articles, limit = 12 }) {
    const [expanded, setExpanded] = useState(false);

    if (!articles || articles.length === 0) {
        return (
            <div className="card-glass p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-glass)] flex items-center justify-center mx-auto mb-4">
                    <IconNewspaper className="w-6 h-6 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-[var(--color-text-muted)]">Loading headlines...</p>
            </div>
        );
    }

    const displayArticles = expanded ? articles.slice(0, 30) : articles.slice(0, limit);

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    const getSentimentInfo = (score) => {
        if (score > 0.2) return {
            color: '#22c55e',
            bg: 'rgba(34, 197, 94, 0.1)',
            glow: 'rgba(34, 197, 94, 0.2)',
            label: 'Positive',
            icon: '↗'
        };
        if (score < -0.2) return {
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.1)',
            glow: 'rgba(239, 68, 68, 0.2)',
            label: 'Negative',
            icon: '↘'
        };
        return {
            color: '#eab308',
            bg: 'rgba(234, 179, 8, 0.1)',
            glow: 'rgba(234, 179, 8, 0.2)',
            label: 'Neutral',
            icon: '→'
        };
    };

    return (
        <div className="space-y-4">
            {/* Headlines */}
            <div className="space-y-3">
                {displayArticles.map((article, index) => {
                    const sentiment = getSentimentInfo(article.sentiment_score);

                    return (
                        <a
                            key={index}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block card-glass p-4 sm:p-5 glow-effect group"
                            style={{
                                animationDelay: `${index * 0.05}s`
                            }}
                        >
                            <div className="flex gap-4 items-start">
                                {/* Sentiment score badge */}
                                <div
                                    className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-110"
                                    style={{
                                        background: sentiment.bg,
                                        boxShadow: 'none',
                                        border: `1px solid ${sentiment.glow}`
                                    }}
                                >
                                    <span
                                        className="text-lg sm:text-xl font-bold"
                                        style={{ color: sentiment.color }}
                                    >
                                        {article.sentiment_score > 0 ? '+' : ''}{(article.sentiment_score * 100).toFixed(0)}
                                    </span>
                                    <span
                                        className="text-xs opacity-70"
                                        style={{ color: sentiment.color }}
                                    >
                                        {sentiment.icon}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm sm:text-base font-medium text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                                        {article.headline}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
                                        <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-glass)] px-2 py-1 rounded-md">
                                            {article.source}
                                        </span>
                                        <span className="text-xs text-[var(--color-text-muted)]">
                                            {formatTimeAgo(article.published)} ago
                                        </span>
                                        <span
                                            className="ml-auto text-xs px-2 py-1 rounded-full font-semibold hidden sm:inline-flex"
                                            style={{
                                                background: sentiment.bg,
                                                color: sentiment.color
                                            }}
                                        >
                                            {sentiment.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="hidden sm:flex items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-all duration-300 group-hover:translate-x-1">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>

            {/* Show more button */}
            {articles.length > limit && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full py-4 text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] card-glass rounded-xl transition-all duration-300 hover:bg-[var(--color-bg-card-hover)]"
                >
                    {expanded ? (
                        <>
                            <span className="mr-2">↑</span>
                            Show Less
                        </>
                    ) : (
                        <>
                            <span className="mr-2">↓</span>
                            Show {Math.min(30, articles.length) - limit} More Headlines
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export default LiveFeed;
