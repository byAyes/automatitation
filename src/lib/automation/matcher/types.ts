export interface MatchResult {
  score: number;            // 0-100
  matchedSkills: string[];  // Skills encontradas
  matchedInterests: string[]; // Intereses coincidentes
  missingSkills: string[]; // Skills requeridas que faltan
  reason: string;          // Explicación del score
}

export interface Matcher {
  calculateMatchScore(job: any, interests: string[]): Promise<MatchResult>;
}
