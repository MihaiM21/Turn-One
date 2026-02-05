/**
 * Enhanced SEO metadata for Games page
 */

import { generateSEO, generateGameSchema } from "@/lib/seo"

export const metadata = generateSEO({
  title: "F1 Games - Trivia, Predictions & Multiplayer Challenges",
  description: "Play exciting Formula 1 games on Turn One. Test your F1 knowledge with trivia, predict race outcomes, compete in multiplayer challenges, and climb the global leaderboard. Free F1 gaming for all fans!",
  keywords: [
    "F1 trivia game",
    "Formula 1 quiz",
    "F1 prediction game",
    "F1 multiplayer games",
    "Formula 1 challenges",
    "F1 knowledge test",
    "Formula 1 gaming free",
    "F1 trivia online",
  ],
  url: "/games",
})

export const triviaGameSchema = generateGameSchema({
  name: "Turn One F1 Trivia Challenge",
  description: "Test your Formula 1 knowledge with challenging trivia questions about drivers, teams, circuits, and F1 history",
  url: "/games/trivia",
  imageUrl: "/og-images/turn-one-games.jpg",
  genre: "Trivia & Quiz Game",
})
