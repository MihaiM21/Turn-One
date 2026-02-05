/**
 * Enhanced SEO metadata for Home page
 */

import { generateSEO, generateGameSchema, generateFAQSchema } from "@/lib/seo"

export const metadata = generateSEO({
  title: "Turn One - Formula 1 Live Timing, Telemetry & Race Data",
  description: "Turn One: The ultimate Formula 1 platform for racing fans. Watch F1 races live with professional timing screens, real-time telemetry data, comprehensive race statistics, and advanced analytics. Follow all F1 2026 races, drivers, teams, and championship standings with live updates.",
  keywords: [
    "F1",
    "Formula 1",
    "F1 live",
    "F1 live timing",
    "Formula 1 live timing",
    "F1 races",
    "F1 telemetry",
    "F1 race data",
    "F1 live race",
    "Formula 1 platform",
    "F1 2026",
    "F1 championship",
  ],
  url: "/home",
})

// Structured data for the telemetry platform
export const gameSchema = generateGameSchema({
  name: "Turn One F1 Telemetry & Live Timing Platform",
  description: "Professional Formula 1 telemetry analysis and live timing platform with real-time race data, comprehensive analytics, and advanced F1 insights",
  url: "/home",
  imageUrl: "/og-images/turn-one-home.jpg",
  genre: "Sports Analytics & Data Platform",
})

// FAQ Schema for common questions
export const faqSchema = generateFAQSchema([
  {
    question: "What is Turn One?",
    answer: "Turn One is the ultimate Formula 1 platform for racing fans. Follow every F1 race live with professional timing screens, real-time telemetry data, comprehensive race statistics, and advanced analytics. Whether you're a casual F1 fan or data enthusiast, Turn One provides everything you need to experience Formula 1 racing.",
  },
  {
    question: "Does Turn One provide live F1 race data?",
    answer: "Yes! Turn One provides comprehensive real-time F1 race data including live timing, telemetry analysis, lap times, sector times, tire strategies, pit stop data, and detailed race statistics during all Grand Prix events. Access professional-grade F1 data in real-time.",
  },
  {
    question: "What telemetry data can I access on Turn One?",
    answer: "Turn One offers extensive F1 telemetry data including speed traces, throttle and brake inputs, gear changes, DRS usage, tire temperatures, fuel loads, and comprehensive performance metrics for all drivers throughout race sessions.",
  },
  {
    question: "Is Turn One free to use?",
    answer: "Yes! Turn One offers a free tier with access to core features including live race tracking, basic telemetry data, and live timing. Premium features unlock advanced analytics, historical data, and detailed telemetry insights.",
  },
  {
    question: "What additional features does Turn One offer?",
    answer: "Beyond telemetry and live timing, Turn One features championship predictions, race predictions, interactive trivia during races, and community leaderboards for competitive F1 fans.",
  },
  {
    question: "Can I compete with other F1 fans?",
    answer: "Absolutely! Turn One features global leaderboards, multiplayer predictions, live trivia competitions, and rewards for top performers. Join thousands of F1 fans competing for top positions.",
  },
])
