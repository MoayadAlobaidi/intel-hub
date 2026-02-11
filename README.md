# Intel Hub

A comprehensive intelligence platform consisting of three interconnected applications for monitoring, analysis, and data visualization.

## 🚀 Project Overview

Intel Hub is a multi-application platform designed for real-time intelligence gathering, analysis, and visualization. The project consists of three main applications:

- **Intel Hub** (Main Dashboard) - Central intelligence hub with real-time data processing
- **Delta Intel** (Geospatial Analysis) - Advanced mapping and location-based intelligence
- **World Monitor** (Global Intelligence) - AI-powered global monitoring with news aggregation

## 📁 Project Structure

```
intel-hub/
├── apps/
│   ├── intel-hub/           # Main Next.js application (port 3001)
│   ├── deltaintel/          # Geospatial analysis app (port 3002)
│   └── worldmonitor/        # AI-powered monitoring app
├── package.json              # Root package.json with dev scripts
├── README.md                 # This file
└── package-lock.json         # Dependency lock file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MoayadAlobaidi/intel-hub.git
cd intel-hub
```

2. Install dependencies:
```bash
npm install
```

3. Start all applications:
```bash
npm run dev
```

This will start all three applications concurrently:
- Intel Hub: http://localhost:3001
- Delta Intel: http://localhost:3002  
- World Monitor: http://localhost:3000

### Alternative: Start Individual Apps

```bash
# Start only Intel Hub
npm run dev:intelhub

# Start only Delta Intel
npm run dev:deltaintel

# Start only World Monitor
npm run dev:worldmonitor
```

## 📊 Application Details

### Intel Hub (Main Dashboard)
- **Port**: 3001
- **Framework**: Next.js 16.1.6
- **Features**: Central intelligence dashboard, real-time data processing
- **Tech Stack**: React 19.2.3, TypeScript, ESLint

### Delta Intel (Geospatial Analysis)
- **Port**: 3002
- **Framework**: Next.js 16.1.1
- **Features**: Advanced mapping, location-based intelligence
- **Tech Stack**: React 19.2.3, MapLibre GL, Tailwind CSS 4

### World Monitor (Global Intelligence)
- **Port**: 3000
- **Framework**: Vite + TypeScript
- **Features**: AI-powered news aggregation, global monitoring, data visualization
- **Tech Stack**: Deck.gl, MapLibre GL, D3.js, ONNX Runtime, Redis caching

## 🔧 Development

### Available Scripts

```bash
# Start all applications concurrently
npm run dev

# Start individual applications
npm run dev:intelhub
npm run dev:deltaintel
npm run dev:worldmonitor

# Build all applications
npm run build

# Lint code
npm run lint

# Run tests (if available)
npm test
```

### Environment Variables

Some applications may require environment variables. Check individual app directories for specific requirements.

## 🔒 Security Considerations

### RSS Proxy Allowlist

When adding new RSS feeds in `worldmonitor/src/config/feeds.ts`, you MUST also add the feed domains to the allowlist in `worldmonitor/api/rss-proxy.js`.

**Why**: The RSS proxy has a security allowlist (`ALLOWED_DOMAINS`) that blocks requests to domains not explicitly listed. Feeds from unlisted domains will return HTTP 403 "Domain not allowed" errors.

**How to Add New Feeds**:
1. Add the feed to `src/config/feeds.ts`
2. Extract the domain from the feed URL
3. Add the domain to `ALLOWED_DOMAINS` array in `api/rss-proxy.js`
4. Deploy changes to Vercel

### AI API Keys

World Monitor uses AI services for summarization:
- **Groq API**: Primary summarization service
- **OpenRouter API**: Fallback service
- **Upstash Redis**: Cross-user caching

## 📊 Site Variants

World Monitor supports two variants controlled by `VITE_VARIANT` environment variable:

- `full` (default): Geopolitical focus - worldmonitor.app
- `tech`: Tech/startup focus - startups.worldmonitor.app

### Running Variants Locally

```bash
# Full variant (geopolitical)
npm run dev

# Tech variant (startups)
npm run dev:tech
```

## 🤝 Contribution Guidelines

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Follow existing code patterns and conventions
- Use TypeScript for type safety
- Ensure all tests pass before submitting
- Run `npm run lint` to check code quality

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test across all three applications when making cross-app changes

### Security

- Never commit API keys or sensitive information
- Follow the RSS proxy allowlist guidelines when adding new feeds
- Review security implications of any new dependencies

### Documentation

- Update README.md when adding new features
- Document new environment variables
- Add inline comments for complex logic

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [MapLibre GL](https://maplibre.org/) - Mapping library
- [Deck.gl](https://deck.gl/) - Data visualization
- [D3.js](https://d3js.org/) - Data-driven documents
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vite](https://vitejs.dev/) - Build tool and dev server

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the individual app documentation
- Review the system reminders in each application directory

## 🚨 Important Notes

### Git Branch Rules

- **NEVER merge or push to a different branch without explicit user permission**
- If on `beta`, only push to `beta` - never merge to `main` without asking
- If on `main`, stay on `main` - never switch branches and push without asking
- NEVER merge branches without explicit request
- Pushing to the CURRENT branch after commits is OK when continuing work

### Model Preferences for World Monitor

For ALL coding tasks in WorldMonitor, ALWAYS use:
- **Coding**: `openrouter/anthropic/claude-sonnet-4-5` (sonnet)
- **Coding**: `openai/gpt-5-2` (codex)

Never default to MiniMax for coding tasks.

### RSS Feed Debugging

If a panel shows "No news available":
1. Open browser DevTools → Console
2. Look for `HTTP 403` or "Domain not allowed" errors
3. Check if the domain is in `api/rss-proxy.js` allowlist

### Service Status Panel

Status page URLs in `api/service-status.js` must match the actual status page endpoint. Common formats:
- Statuspage.io: `https://status.example.com/api/v2/status.json`
- Atlassian: `https://example.status.atlassian.com/api/v2/status.json`
- incident.io: Same endpoint but returns HTML, handled by `incidentio` parser

## 🔄 Continuous Integration

This project uses standard npm scripts for development workflows. Ensure all scripts pass before submitting changes.

## 📈 Performance Considerations

- World Monitor uses Redis caching for AI API calls
- Delta Intel uses optimized MapLibre GL rendering
- All applications follow Next.js/Vite best practices for performance

---

**Intel Hub** - Your gateway to comprehensive intelligence and analysis.