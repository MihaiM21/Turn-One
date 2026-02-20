/**
 * Dashboard Pages SEO Configuration
 * Defines metadata for all dashboard pages for optimal SEO
 */

import { generateSEO } from '@/lib/seo';
import { Metadata } from 'next';

interface DashboardPageConfig {
  title: string;
  description: string;
  keywords: string[];
  url: string;
}

export const dashboardPagesMetadata: Record<string, DashboardPageConfig> = {
  dashboard: {
    title: 'F1 Dashboard - Live Timing & Telemetry',
    description: 'Your personalized Formula 1 dashboard with live timing, telemetry data, race statistics, and real-time F1 updates. Track your favorite drivers, manage predictions, and access comprehensive F1 analytics.',
    keywords: [
      'F1 dashboard',
      'Formula 1 dashboard',
      'F1 live timing dashboard',
      'F1 user dashboard',
      'F1 telemetry dashboard',
      'personal F1 hub',
      'F1 race dashboard',
    ],
    url: '/dashboard',
  },
  generator: {
    title: 'Telemetry Plot Generator - F1 Data Visualization',
    description: 'Create custom Formula 1 telemetry plots and data visualizations. Generate professional F1 data charts, compare driver performance, analyze lap times, and create detailed telemetry reports.',
    keywords: [
      'F1 telemetry generator',
      'Formula 1 plot generator',
      'F1 data visualization',
      'telemetry charts',
      'F1 lap analysis',
      'F1 data charts',
      'racing telemetry tools',
    ],
    url: '/generator',
  },
  predictions: {
    title: 'F1 Race Predictions - Formula 1 Prediction Game',
    description: 'Make Formula 1 race predictions and compete with fans worldwide. Predict race winners, podium finishes, fastest laps, and championship outcomes. Earn rewards and climb the leaderboard.',
    keywords: [
      'F1 predictions',
      'Formula 1 prediction game',
      'F1 race predictions',
      'predict F1 winner',
      'F1 betting predictions',
      'Formula 1 forecast',
      'F1 prediction competition',
    ],
    url: '/predictions',
  },
  live: {
    title: 'F1 Live Race - Real-Time Formula 1 Timing',
    description: 'Watch Formula 1 races live with real-time timing data, live telemetry, sector times, and comprehensive race tracking. Experience professional-grade F1 live timing screens with instant updates.',
    keywords: [
      'F1 live race',
      'Formula 1 live timing',
      'F1 real-time data',
      'live F1 telemetry',
      'F1 race tracking',
      'live race timing',
      'F1 live updates',
    ],
    url: '/live',
  },
  live2: {
    title: 'F1 Live Timing Screen - Advanced Race Tracking',
    description: 'Advanced Formula 1 live timing screen with comprehensive race data, gap analysis, pit stop information, and detailed driver positions. Professional F1 timing for serious racing fans.',
    keywords: [
      'F1 live timing screen',
      'Formula 1 timing tower',
      'F1 gap analysis',
      'live pit stops',
      'F1 timing data',
      'professional F1 timing',
    ],
    url: '/live2',
  },
  rewards: {
    title: 'F1 Rewards & Leveling - Earn Turn One Coins',
    description: 'Earn rewards, level up your profile, and collect Turn One Coins. Complete daily challenges, participate in F1 games, and unlock exclusive features. Track your progress and achievements.',
    keywords: [
      'F1 rewards',
      'Turn One rewards',
      'F1 gaming rewards',
      'F1 level system',
      'earn F1 coins',
      'F1 achievements',
      'racing rewards',
    ],
    url: '/rewards',
  },
  account: {
    title: 'Account Settings - Manage Your F1 Profile',
    description: 'Manage your Turn One account settings, preferences, and profile. Update your F1 team preferences, notification settings, privacy options, and subscription details.',
    keywords: [
      'F1 account settings',
      'Turn One profile',
      'F1 user settings',
      'account preferences',
      'F1 profile management',
      'user dashboard settings',
    ],
    url: '/account',
  },
  docs: {
    title: 'F1 API Documentation - Turn One Developer Docs',
    description: 'Comprehensive Formula 1 API documentation for Turn One platform. Access live F1 data, telemetry endpoints, timing information, and integration guides for developers.',
    keywords: [
      'F1 API documentation',
      'Formula 1 API',
      'F1 data API',
      'telemetry API',
      'F1 developer docs',
      'racing data API',
      'F1 integration',
    ],
    url: '/docs',
  },
  games: {
    title: 'F1 Game Hub - Predictions, Trivia & Competitions',
    description: 'Play Formula 1 games including race predictions, F1 trivia, and fantasy competitions. Compete with fans worldwide, earn rewards, and test your F1 knowledge.',
    keywords: [
      'F1 games',
      'Formula 1 game hub',
      'F1 trivia',
      'F1 prediction game',
      'F1 fantasy',
      'racing games online',
      'F1 competitions',
    ],
    url: '/games',
  },
};

/**
 * Get metadata for a specific dashboard page
 */
export function getDashboardMetadata(pageKey: string): Metadata {
  const config = dashboardPagesMetadata[pageKey];
  
  if (!config) {
    // Fallback metadata if page not found
    return generateSEO({
      title: 'Turn One Dashboard',
      description: 'Access your Formula 1 dashboard with live timing, telemetry, and race data.',
      url: '/dashboard',
    });
  }

  return generateSEO({
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    url: config.url,
  });
}
