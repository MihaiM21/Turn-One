'use client';

import { getAuthToken } from './auth-utils';

// Make sure to use the correct API URL with proper formatting
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api';

export interface LevelProgress {
  currentLevel: number;
  currentExperience: number;
  experienceRequired: number;
  progressPercentage: number;
}

export interface ExperienceResult {
  levelsGained: number;
  currentLevel: number;
  currentExperience: number;
  experienceRequired: number;
  progressPercentage: number;
}

/**
 * Get the user's level progress directly from the API
 */
export const getLevelProgress = async (token: string): Promise<LevelProgress> => {
  console.log(`Fetching level progress from ${API_URL}/levelsystem/progress`);
  const response = await fetch(`${API_URL}/levelsystem/progress`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get level progress: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Add experience to the user directly through the API
 */
export const addExperience = async (token: string, experience: number): Promise<ExperienceResult> => {
  console.log(`Adding ${experience} experience points`);
  const response = await fetch(`${API_URL}/levelsystem/add-experience`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ experience })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add experience: ${response.status}`);
  }
  
  return response.json();
};