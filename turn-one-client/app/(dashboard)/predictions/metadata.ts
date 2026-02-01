/**
 * Enhanced SEO metadata for Predictions page
 */

import { generateSEO, generateGameSchema } from "@/lib/seo"

export const metadata = generateSEO({
  title: "F1 Predictions - Championship & Race Outcome Forecasts - Turn One",
  description: "Make your Formula 1 predictions and compete with fans worldwide. Predict race winners, podium finishes, fastest laps, championship outcomes, and earn rewards for accurate forecasts on Turn One.",
  keywords: [
    "F1 predictions",
    "Formula 1 predictions game",
    "F1 race predictions",
    "championship predictions",
    "F1 betting predictions",
    "race winner prediction",
    "F1 podium predictions",
    "Formula 1 forecasts",
  ],
  url: "/predictions",
})

export const predictionsGameSchema = generateGameSchema({
  name: "Turn One F1 Predictions Challenge",
  description: "Predict Formula 1 race outcomes, championship standings, and compete for rewards based on prediction accuracy",
  url: "/predictions",
  imageUrl: "/og-images/turn-one-predictions.jpg",
  genre: "Prediction & Strategy Game",
})
