# Intel Hub

A unified intelligence dashboard that aggregates multiple monitoring services into a single, cohesive interface. Intel Hub provides a tabbed interface to seamlessly switch between World Monitor and Delta Intel services with real-time health status monitoring.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Initialize Submodules](#2-initialize-submodules)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Configure Environment Variables](#4-configure-environment-variables)
  - [5. Run the Development Server](#5-run-the-development-server)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
  - [Deploying to Vercel](#deploying-to-vercel)
  - [Manual Deployment](#manual-deployment)
  - [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

Intel Hub serves as a central dashboard that embeds multiple intelligence and monitoring services. It provides:

- **Tabbed Interface**: Switch between World Monitor and Delta Intel seamlessly
- **Health Monitoring**: Real-time status checks for each integrated service (every 15 seconds)
- **Persistent State**: Remembers your last active tab across sessions
- **Quick Actions**: Open services in new tabs or manually refresh status

## Architecture

```
intel-hub/
├── apps/
│   ├── intel-hub/          # Main Next.js dashboard application
│   ├── deltaintel/         # Delta Intelligence Dashboard (submodule)
│   └── worldmonitor/       # World Monitor service (submodule)
├── package.json            # Root package.json for monorepo
└── .gitmodules             # Git submodule configuration
```

The architecture follows a micro-frontend pattern where:

1. **Intel Hub (Main App)**: A Next.js 16 application that provides the container UI and orchestrates the embedded services
2. **World Monitor**: An external service embedded via iframe (default: `http://localhost:5173`)
3. **Delta Intel**: An external service embedded via iframe (default: `http://localhost:3000`)

## Prerequisites

Before setting up Intel Hub, ensure you have the following installed:

| Requirement | Version | Check Command |
|------------|---------|---------------|
| Node.js | >= 18.x | `node --version` |
| npm | >= 9.x | `npm --version` |
| Git | >= 2.x | `git --version` |

**Optional (for submodules):**
- Access to Delta Intelligence Dashboard repository
- Access to World Monitor repository

## Quick Start

For experienced developers, here's the fastest way to get started:

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/MoayadAlobaidi/intel-hub.git
cd intel-hub

# Install dependencies
cd apps/intel-hub && npm install

# Create environment file
cp .env.example .env.local  # Edit with your service URLs

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Detailed Setup

### 1. Clone the Repository

```bash
# Option A: Clone with submodules (recommended)
git clone --recurse-submodules https://github.com/MoayadAlobaidi/intel-hub.git

# Option B: Clone first, then initialize submodules
git clone https://github.com/MoayadAlobaidi/intel-hub.git
cd intel-hub
git submodule update --init --recursive
```

### 2. Initialize Submodules

If you didn't use `--recurse-submodules` during clone:

```bash
# Initialize and fetch all submodules
git submodule update --init --recursive

# Verify submodules are populated
ls -la apps/deltaintel
ls -la apps/worldmonitor
```

**Note**: The submodules (deltaintel and worldmonitor) are optional for running the main Intel Hub application. They can be deployed separately or pointed to existing deployments.

### 3. Install Dependencies

```bash
# Navigate to the main application
cd apps/intel-hub

# Install dependencies
npm install

# Or using your preferred package manager
yarn install
# or
pnpm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the `apps/intel-hub` directory:

```bash
cd apps/intel-hub
touch .env.local
```

Add the following environment variables:

```env
# Intel Hub Environment Configuration
# ====================================

# World Monitor Service URL
# The URL where your World Monitor instance is running
# Default: http://localhost:5173
WORLD_MONITOR_URL=http://localhost:5173

# Delta Intel Service URL  
# The URL where your Delta Intel instance is running
# Default: http://localhost:3000
DELTA_INTEL_URL=http://localhost:3001
```

**Important**: The application will use the following defaults if environment variables are not set:
- World Monitor: `http://localhost:5173`
- Delta Intel: `http://localhost:3000`

### 5. Run the Development Server

```bash
# From apps/intel-hub directory
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Note**: If Delta Intel uses the default port 3000, run Intel Hub on a different port:

```bash
# Run on port 3002
npm run dev -- -p 3002
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORLD_MONITOR_URL` | No | `http://localhost:5173` | URL of the World Monitor service |
| `DELTA_INTEL_URL` | No | `http://localhost:3000` | URL of the Delta Intel service |

### Environment File Locations

| Environment | File | Purpose |
|-------------|------|---------|
| Development | `.env.local` | Local development overrides |
| Production | `.env.production` | Production-specific values |
| All | `.env` | Shared defaults |

**Priority Order**: `.env.local` > `.env.production` > `.env`

### Example Configurations

**Local Development with All Services:**
```env
WORLD_MONITOR_URL=http://localhost:5173
DELTA_INTEL_URL=http://localhost:3001
```

**Production with Deployed Services:**
```env
WORLD_MONITOR_URL=https://worldmonitor.example.com
DELTA_INTEL_URL=https://deltaintel.example.com
```

## Project Structure

```
apps/intel-hub/
├── public/                 # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   └── app/
│       ├── api/
│       │   └── ping/
│       │       └── route.ts    # Health check API endpoint
│       ├── globals.css         # Global styles
│       ├── layout.tsx          # Root layout component
│       └── page.tsx            # Main dashboard page
├── .gitignore
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js configuration
├── package.json
├── README.md
└── tsconfig.json               # TypeScript configuration
```

## Available Scripts

Run these commands from the `apps/intel-hub` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server (requires build first) |
| `npm run lint` | Run ESLint to check for code issues |

## Deployment

### Deploying to Vercel

Vercel is the recommended platform for deploying Intel Hub, as it provides seamless integration with Next.js.

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `apps/intel-hub`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (default)

3. **Set Environment Variables**
   - Go to Settings > Environment Variables
   - Add the following:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `WORLD_MONITOR_URL` | `https://your-worldmonitor-url.com` | Production |
   | `DELTA_INTEL_URL` | `https://your-deltaintel-url.com` | Production |

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

#### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to the app directory
cd apps/intel-hub

# Login to Vercel
vercel login

# Deploy to preview environment
vercel

# Deploy to production
vercel --prod
```

During deployment, you'll be prompted to configure the project. Set environment variables using:

```bash
# Set environment variables
vercel env add WORLD_MONITOR_URL
vercel env add DELTA_INTEL_URL
```

#### Vercel Project Configuration

Create a `vercel.json` in `apps/intel-hub` for custom configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "WORLD_MONITOR_URL": "@world-monitor-url",
    "DELTA_INTEL_URL": "@delta-intel-url"
  }
}
```

### Manual Deployment

For self-hosted or non-Vercel deployments:

#### Build for Production

```bash
cd apps/intel-hub

# Install dependencies
npm ci

# Build the application
npm run build

# Start the production server
npm run start
```

#### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
cd apps/intel-hub
pm2 start npm --name "intel-hub" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Docker Deployment

Create a `Dockerfile` in `apps/intel-hub`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

**Note**: For Docker standalone output, add to `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... existing config
};
```

Build and run:

```bash
# Build the image
docker build -t intel-hub .

# Run the container
docker run -p 3000:3000 \
  -e WORLD_MONITOR_URL=https://worldmonitor.example.com \
  -e DELTA_INTEL_URL=https://deltaintel.example.com \
  intel-hub
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  intel-hub:
    build:
      context: ./apps/intel-hub
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - WORLD_MONITOR_URL=${WORLD_MONITOR_URL:-http://localhost:5173}
      - DELTA_INTEL_URL=${DELTA_INTEL_URL:-http://localhost:3001}
    restart: unless-stopped
```

## Troubleshooting

### Common Issues

#### Services Show "offline" Status

**Problem**: The dashboard shows services as offline even when they're running.

**Solutions**:
1. Verify the service URLs are correct in your environment variables
2. Check if the services are running and accessible
3. Ensure there are no CORS issues (Intel Hub uses a server-side proxy)
4. Check the browser console for errors

```bash
# Test service connectivity
curl -I http://localhost:5173  # World Monitor
curl -I http://localhost:3001  # Delta Intel
```

#### Port Conflicts

**Problem**: Port 3000 is already in use.

**Solution**: Run on a different port:
```bash
npm run dev -- -p 3002
```

Or set the PORT environment variable:
```bash
PORT=3002 npm run dev
```

#### Submodules Not Initialized

**Problem**: `apps/deltaintel` or `apps/worldmonitor` directories are empty.

**Solution**:
```bash
git submodule update --init --recursive
```

#### Build Errors

**Problem**: Build fails with TypeScript or ESLint errors.

**Solutions**:
1. Run lint to identify issues: `npm run lint`
2. Ensure all dependencies are installed: `npm ci`
3. Check TypeScript version compatibility
4. Clear Next.js cache: `rm -rf .next`

#### Environment Variables Not Loading

**Problem**: Environment variables are undefined.

**Solutions**:
1. Ensure `.env.local` is in `apps/intel-hub` directory (not root)
2. Restart the development server after changing env files
3. Verify variable names match exactly (case-sensitive)
4. For production builds, ensure variables are set in your hosting platform

### Getting Help

If you encounter issues not covered here:

1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Review the [project issues](https://github.com/MoayadAlobaidi/intel-hub/issues)
3. Create a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run lint and tests: `npm run lint`
5. Commit your changes: `git commit -m 'Add your feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Update documentation for new features
- Test changes locally before submitting PR

## License

ISC License - see [package.json](package.json) for details.

---

Built with [Next.js](https://nextjs.org/) | Deployed on [Vercel](https://vercel.com)
