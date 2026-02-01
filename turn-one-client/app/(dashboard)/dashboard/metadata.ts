/**
 * Enhanced SEO metadata for Dashboard page
 */

import { generateSEO } from "@/lib/seo"

export const metadata = generateSEO({
  title: "F1 Dashboard - Live Race Stats & Gaming Hub",
  description: "Access your personalized F1 gaming dashboard. Track your predictions, view live race statistics, monitor leaderboard positions, claim rewards, and manage your Turn One F1 gaming profile.",
  keywords: [
    "F1 dashboard",
    "Formula 1 stats",
    "F1 gaming profile",
    "race statistics",
    "F1 leaderboard",
    "F1 predictions tracker",
    "Formula 1 analytics",
  ],
  url: "/dashboard",
  noIndex: false, // Public page but requires login
})
