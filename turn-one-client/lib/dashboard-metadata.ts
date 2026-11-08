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
  /** All pages in this registry live behind the auth-gated (dashboard) route
   * group's ProtectedRoute wrapper, so they default to noindex. */
  noIndex?: boolean;
}

export const dashboardPagesMetadata: Record<string, DashboardPageConfig> = {
  dashboard: {
    title: 'Home - Sim Racing Telemetry',
    description: 'Your Turn One home: your Turn One Link rig, your last session, personal bests and leaderboard ranks across ACC, EA SPORTS F1 25/26 and iRacing.',
    keywords: [
      'sim racing dashboard',
      'sim racing telemetry',
      'ACC telemetry',
      'F1 25 telemetry',
      'iRacing telemetry',
    ],
    url: '/dashboard',
    noIndex: true,
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
    noIndex: true,
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
    noIndex: true,
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
    noIndex: true,
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
    noIndex: true,
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
    noIndex: true,
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
    noIndex: true,
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
    noIndex: true,
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
      noIndex: true,
    });
  }

  return generateSEO({
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    url: config.url,
    noIndex: config.noIndex ?? false,
  });
}
