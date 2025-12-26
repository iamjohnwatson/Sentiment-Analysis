# 🤖 AI Sentiment Pulse

> **Real-time sentiment analysis of global AI news headlines**

A fully automated, zero-cost web application that scrapes global news headlines about Artificial Intelligence, analyzes their sentiment using machine learning, and displays the results in a sophisticated interactive "scroll-telling" interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Actions](https://img.shields.io/badge/automation-GitHub%20Actions-2088FF)
![React](https://img.shields.io/badge/frontend-React%2018-61DAFB)
![Python](https://img.shields.io/badge/backend-Python%203.11-3776AB)

## ✨ Features

- **Automated Data Pipeline**: GitHub Actions runs every 6 hours to scrape fresh news
- **ML-Powered Analysis**: Uses Hugging Face's DistilBERT model for sentiment classification
- **Interactive Visualizations**: D3.js-powered charts with hover interactions
- **Scroll-telling Experience**: Reuters/NYT-style narrative data journalism interface
- **Zero Cost**: Runs entirely on GitHub Actions + GitHub Pages
- **Mobile-First Design**: Responsive layout that works across all devices

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                           │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │  CRON    │───▶│ Python       │───▶│ Commit data.json    │   │
│  │ (6 hrs)  │    │ Scraper      │    │ to Repository       │   │
│  └──────────┘    └──────────────┘    └─────────────────────┘   │
│                         │                       │               │
│                         ▼                       ▼               │
│               ┌──────────────────┐    ┌─────────────────────┐   │
│               │ Hugging Face     │    │ Build & Deploy      │   │
│               │ Sentiment Model  │    │ to GitHub Pages     │   │
│               └──────────────────┘    └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       GitHub Pages                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React App with D3.js Visualizations                     │   │
│  │  • Line Chart (Sentiment Over Time)                      │   │
│  │  • Bubble Chart (Source Distribution)                    │   │
│  │  • Live Headlines Feed                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend Script** | Python 3.11 |
| **RSS Parsing** | feedparser |
| **Sentiment Analysis** | Hugging Face Transformers (DistilBERT) |
| **Frontend Framework** | React 18 + Vite |
| **Styling** | Tailwind CSS v4 |
| **Visualizations** | D3.js |
| **Automation** | GitHub Actions |
| **Hosting** | GitHub Pages |

## 📁 Project Structure

```
Sentiment-Analysis/
├── .github/
│   └── workflows/
│       └── main.yml           # Automated pipeline
├── scripts/
│   ├── scraper.py             # Python scraper + sentiment analyzer
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LineChart.jsx      # Sentiment trend chart
│   │   │   ├── BubbleChart.jsx    # Source distribution chart
│   │   │   ├── LiveFeed.jsx       # Headlines with scores
│   │   │   └── ScrollSection.jsx  # Scroll-telling wrappers
│   │   ├── hooks/
│   │   │   ├── useScrollProgress.js
│   │   │   └── useSentimentData.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   │   └── data.json          # Generated sentiment data
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Sentiment-Analysis.git
   cd Sentiment-Analysis
   ```

2. **Set up Python environment** (optional, for running scraper locally)
   ```bash
   cd scripts
   pip install -r requirements.txt
   python scraper.py
   cd ..
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser** to `http://localhost:5173`

### Building for Production

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`.

## ⚙️ GitHub Actions Setup

The workflow runs automatically, but you need to enable GitHub Pages:

1. Go to **Settings → Pages**
2. Under "Build and deployment", select **GitHub Actions**
3. The workflow will deploy on next push or scheduled run

### Manual Trigger

You can manually trigger data updates:

1. Go to **Actions → Update AI Sentiment Data & Deploy**
2. Click **Run workflow**

## 📊 Data Format

The `data.json` file contains:

```json
{
  "last_updated": "2024-12-25T12:00:00Z",
  "total_articles": 85,
  "overall_sentiment": 0.142,
  "overall_label": "Neutral",
  "daily_stats": [
    {
      "date": "2024-12-25",
      "avg_sentiment": 0.185,
      "article_count": 12,
      "moving_avg": 0.143
    }
  ],
  "source_stats": [
    {
      "source": "TechCrunch",
      "avg_sentiment": 0.378,
      "article_count": 12
    }
  ],
  "articles": [
    {
      "headline": "OpenAI Announces Breakthrough...",
      "source": "TechCrunch",
      "sentiment_score": 0.756,
      "sentiment_label": "Positive"
    }
  ]
}
```

## 🎨 Design System

| Element | Value |
|---------|-------|
| Headline Font | Source Serif 4 |
| UI Font | Inter |
| Background | #FAFAFA |
| Text | #222222 |
| Accent | #DC3545 (Reuters Red) |
| Positive | #28A745 |
| Negative | #DC3545 |
| Neutral | #6C757D |

## 📈 Sentiment Model

Uses **distilbert-base-uncased-finetuned-sst-2-english**:

- Fine-tuned on Stanford Sentiment Treebank
- Binary classification (Positive/Negative)
- Scores normalized to -1 to +1 range
- Neutral: -0.2 to +0.2

## 🔧 Configuration

### Adjusting Update Frequency

Edit `.github/workflows/main.yml`:
```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
  # Change to:
  - cron: '0 */12 * * *' # Every 12 hours
```

### Adding News Sources

Edit `scripts/scraper.py`:
```python
RSS_FEEDS = [
    ("Google News AI", "https://news.google.com/rss/search?q=..."),
    # Add more feeds here
]
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for the sentiment model
- [D3.js](https://d3js.org/) for visualization capabilities
- Reuters Graphics & NYT Upshot for design inspiration
