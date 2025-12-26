import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSentimentData } from './hooks/useSentimentData';
import { LineChart } from './components/LineChart';
import { BubbleChart } from './components/BubbleChart';
import { LiveFeed } from './components/LiveFeed';
import { ScrollSection, NarrativeBlock, StatCard, SectionDivider } from './components/ScrollSection';
import {
  IconBot, IconTrendingUp, IconTarget, IconNewspaper, IconActivity,
  IconGlobe, IconCalendar, IconSmile, IconFrown, IconMeh
} from './components/Icons';
import './index.css';

function App() {
  const { data, loading, error } = useSentimentData();
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollY, setScrollY] = useState(0);

  // Track scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get sentiment color class
  const getSentimentColorClass = (score) => {
    if (score > 0.2) return 'text-[#22c55e]';
    if (score < -0.2) return 'text-[#ef4444]';
    return 'text-[#eab308]';
  };

  // Calculate percentage for visualization
  const scoreToPercentage = (score) => Math.round((score + 1) * 50);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="gradient-bg"></div>
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-[var(--color-accent-secondary)] border-b-transparent animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
          <p className="text-[var(--color-text-secondary)] animate-pulse">Analyzing global sentiment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="container-wide flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white">
              <IconBot className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-[var(--color-text-primary)]">AI Sentiment</span>
              <span className="font-light text-[var(--color-text-secondary)]"> Pulse</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-sm">
            <a href="#trends" className={`nav-link flex items-center gap-2 ${activeSection === 'trends' ? 'active' : 'text-[var(--color-text-secondary)]'}`}>
              <IconTrendingUp className="w-4 h-4 hidden sm:block" /> Trends
            </a>
            <a href="#sources" className={`nav-link flex items-center gap-2 ${activeSection === 'sources' ? 'active' : 'text-[var(--color-text-secondary)]'}`}>
              <IconTarget className="w-4 h-4 hidden sm:block" /> Sources
            </a>
            <a href="#feed" className={`nav-link flex items-center gap-2 ${activeSection === 'feed' ? 'active' : 'text-[var(--color-text-secondary)]'}`}>
              <IconNewspaper className="w-4 h-4 hidden sm:block" /> Feed
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <ScrollSection id="hero" onVisible={setActiveSection}>
        <div className="container-narrow pt-20">
          {/* Live indicator */}
          <div className="flex justify-center mb-8 fade-in-up">
            <div className="live-indicator">
              <span className="live-dot"></span>
              Live Analysis
            </div>
          </div>

          {/* Main headline */}
          <div className="text-center mb-12 fade-in-up stagger-1">
            <h1 className="headline-serif headline-large mb-6">
              How does the world
              <br />
              <span className="gradient-text">feel about AI</span>
              <br />
              today?
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
              Real-time sentiment analysis of global news headlines,
              powered by machine learning and updated every 6 hours.
            </p>
          </div>

          {/* Big sentiment display */}
          {data && (
            <div className="text-center mb-16 fade-in-up stagger-2">
              <div className="inline-block p-8 rounded-3xl card-glass">
                <div className={`big-number ${getSentimentColorClass(data.overall_sentiment)}`}>
                  {data.overall_sentiment > 0 ? '+' : ''}{(data.overall_sentiment * 100).toFixed(0)}
                </div>
                <div className="text-sm text-[var(--color-text-muted)] mt-2 uppercase tracking-widest">
                  Sentiment Score
                </div>
                <div className={`inline-flex mt-4 px-4 py-2 rounded-full text-sm font-semibold ${data.overall_sentiment > 0.2 ? 'sentiment-positive' :
                  data.overall_sentiment < -0.2 ? 'sentiment-negative' :
                    'sentiment-neutral'
                  }`}>
                  {data.overall_sentiment > 0.2 ? '↗ Optimistic' :
                    data.overall_sentiment < -0.2 ? '↘ Pessimistic' :
                      '→ Balanced'}
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {data && (
            <div className="stats-grid mb-10 fade-in-up stagger-3">
              <StatCard
                value={data.total_articles}
                label="Headlines"
                icon={<IconActivity className="w-6 h-6 text-[var(--color-accent)]" />}
              />
              <StatCard
                value={data.source_stats?.length || 0}
                label="Sources"
                icon={<IconGlobe className="w-6 h-6 text-[var(--color-accent-secondary)]" />}
              />
              <StatCard
                value={`${data.daily_stats?.length || 0}`}
                label="Days"
                icon={<IconCalendar className="w-6 h-6 text-[var(--color-positive)]" />}
              />
              <StatCard
                value={data.overall_label}
                label="Sentiment"
                icon={
                  data.overall_sentiment > 0.2 ? <IconSmile className="w-6 h-6 text-[var(--color-positive)]" /> :
                    data.overall_sentiment < -0.2 ? <IconFrown className="w-6 h-6 text-[var(--color-negative)]" /> :
                      <IconMeh className="w-6 h-6 text-[var(--color-neutral)]" />
                }
              />
            </div>
          )}

          {/* Last updated */}
          <p className="text-center text-sm text-[var(--color-text-muted)] mb-12 fade-in-up stagger-4">
            Last updated: {formatDate(data?.last_updated)}
          </p>

          {/* Scroll indicator */}
          <div className="text-center fade-in-up stagger-5">
            <div className="inline-flex flex-col items-center gap-2 text-[var(--color-text-muted)] animate-bounce">
              <span className="text-xs uppercase tracking-widest">Explore</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </div>
        </div>
      </ScrollSection>

      {/* Trends Section */}
      <ScrollSection id="trends" onVisible={setActiveSection}>
        <div className="container-wide">
          <NarrativeBlock title="Sentiment Over Time" icon={<IconTrendingUp className="w-8 h-8 text-[var(--color-accent)]" />}>
            <p>
              Track how global AI sentiment evolves. Each point shows daily average,
              with the trend line smoothing out day-to-day fluctuations.
            </p>
          </NarrativeBlock>

          {data && (
            <div className="card-glass p-4 sm:p-6 mb-10">
              <LineChart data={data} height={350} />
            </div>
          )}

          {/* Daily breakdown */}
          {data?.daily_stats && data.daily_stats.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-6 text-[var(--color-text-primary)]">
                Last 7 Days
              </h3>
              <div className="daily-grid">
                {data.daily_stats.slice(-7).map((day, idx) => (
                  <div
                    key={idx}
                    className="card-glass p-4 text-center interactive-card"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="text-xs text-[var(--color-text-muted)] mb-2">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${getSentimentColorClass(day.avg_sentiment)}`}>
                      {day.avg_sentiment > 0 ? '+' : ''}{(day.avg_sentiment * 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {day.article_count} articles
                    </div>
                    {/* Mini progress bar */}
                    <div className="progress-bar mt-3">
                      <div
                        className={`progress-fill ${day.avg_sentiment > 0.2 ? 'progress-positive' :
                          day.avg_sentiment < -0.2 ? 'progress-negative' :
                            'progress-neutral'
                          }`}
                        style={{ width: `${scoreToPercentage(day.avg_sentiment)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollSection>

      <SectionDivider />

      {/* Sources Section */}
      <ScrollSection id="sources" onVisible={setActiveSection}>
        <div className="container-wide">
          <NarrativeBlock title="Sentiment by Source" icon={<IconTarget className="w-8 h-8 text-[var(--color-accent-secondary)]" />}>
            <p>
              Compare how different publishers cover AI news. Bars show sentiment
              scores from negative (left) to positive (right).
            </p>
          </NarrativeBlock>

          {data && (
            <div className="card-glass p-4 sm:p-6 mb-10">
              <BubbleChart data={data} height={420} />
            </div>
          )}

          {/* Source ranking */}
          {data?.source_stats && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-6 text-[var(--color-text-primary)]">
                Top Sources
              </h3>
              <div className="space-y-3">
                {data.source_stats.slice(0, 8).map((source, idx) => (
                  <div
                    key={idx}
                    className="card-glass p-4 flex items-center justify-between interactive-card"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg w-6 text-center text-[var(--color-text-muted)]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {source.source}
                        </span>
                        <span className="text-sm text-[var(--color-text-muted)] ml-2">
                          {source.article_count} articles
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block w-32">
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${source.avg_sentiment > 0.2 ? 'progress-positive' :
                              source.avg_sentiment < -0.2 ? 'progress-negative' :
                                'progress-neutral'
                              }`}
                            style={{ width: `${scoreToPercentage(source.avg_sentiment)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`font-bold text-lg min-w-[60px] text-right ${getSentimentColorClass(source.avg_sentiment)}`}>
                        {source.avg_sentiment > 0 ? '+' : ''}{(source.avg_sentiment * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollSection>

      <SectionDivider />

      {/* Live Feed Section */}
      <ScrollSection id="feed" onVisible={setActiveSection}>
        <div className="container-narrow">
          <NarrativeBlock title="Latest Headlines" icon={<IconNewspaper className="w-8 h-8 text-[var(--color-text-primary)]" />}>
            <p>
              Every headline analyzed by our AI. Click to read the full story.
            </p>
          </NarrativeBlock>

          {data && (
            <LiveFeed articles={data.articles} limit={12} />
          )}
        </div>
      </ScrollSection>

      {/* Footer */}
      <footer className="py-16 border-t border-[var(--color-glass-border)]">
        <div className="container-wide text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white">
              <IconBot className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[var(--color-text-primary)]">AI Sentiment Pulse</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">
            Automated sentiment analysis of global AI news
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Powered by Hugging Face Transformers · Updated every 6 hours
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
