export interface LearningEvent {
  event_date: string;
  event_type: string;
  skill_name?: string;
  weight: number;
}

export interface ConsistencyReport {
  overall_score: number;
  activity_consistency: number;
  skill_growth: number;
  project_maintenance: number;
  recent_learning: number;
  monthly_activity: { month: string; score: number; primary_skill: string | null }[];
}

export function calculateConsistency(events: LearningEvent[]): ConsistencyReport {
  if (!events || events.length === 0) {
    return {
      overall_score: 0,
      activity_consistency: 0,
      skill_growth: 0,
      project_maintenance: 0,
      recent_learning: 0,
      monthly_activity: []
    };
  }

  // Group by month
  const monthlyData: Record<string, { weight: number, skills: Set<string> }> = {};
  const now = new Date();
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = { weight: 0, skills: new Set() };
  }

  const allSkills = new Set<string>();
  
  events.forEach(event => {
    const d = new Date(event.event_date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    // Only process last 6 months for timeline
    if (monthlyData[monthKey]) {
      let eventWeight = event.weight || 1;
      monthlyData[monthKey].weight += eventWeight;
      
      if (event.skill_name) {
        monthlyData[monthKey].skills.add(event.skill_name);
        allSkills.add(event.skill_name);
      }
    }
  });

  const monthKeys = Object.keys(monthlyData).sort();
  const weights = monthKeys.map(k => monthlyData[k].weight);
  
  // 1. Activity Consistency (Calculate variance)
  const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
  const variance = weights.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / weights.length;
  const stdDev = Math.sqrt(variance);
  
  // High mean and low stdDev = good consistency. Score out of 100
  let consistencyScore = 0;
  if (mean > 0) {
    const cv = stdDev / mean; // Coefficient of variation
    consistencyScore = Math.max(0, Math.min(100, 100 - (cv * 30)));
    // Add bonus for just having high mean
    consistencyScore = (consistencyScore * 0.7) + (Math.min(100, mean * 5) * 0.3);
  }

  // 2. Skill Growth
  const skillGrowthScore = Math.min(100, allSkills.size * 15);

  // 3. Project Maintenance
  const maintenanceScore = Math.min(100, mean * 10);

  // 4. Recent Learning (Decay weighting)
  const recentWeights = [0.1, 0.1, 0.2, 0.3, 0.4, 0.6]; // Last 6 months multiplier
  let recentScore = 0;
  weights.forEach((w, i) => {
    recentScore += w * recentWeights[i];
  });
  recentScore = Math.min(100, recentScore * 10);

  // Overall calculations (Weights: Cons 35%, Recent 30%, Skill 20%, Proj 15%)
  const overall = (consistencyScore * 0.35) + (recentScore * 0.30) + (skillGrowthScore * 0.20) + (maintenanceScore * 0.15);

  const monthly_activity = monthKeys.map(k => {
    const skillsArr = Array.from(monthlyData[k].skills);
    return {
      month: k,
      score: monthlyData[k].weight,
      primary_skill: skillsArr.length > 0 ? skillsArr[0] : null
    };
  });

  return {
    overall_score: Math.round(overall),
    activity_consistency: Math.round(consistencyScore),
    skill_growth: Math.round(skillGrowthScore),
    project_maintenance: Math.round(maintenanceScore),
    recent_learning: Math.round(recentScore),
    monthly_activity
  };
}
