export interface PostingTime {
  time: string;
  label: string;
  reason: string;
  engagement: number; // Pourcentage d'engagement relatif
}

export interface BestPostingTimes {
  [platform: string]: {
    [domain: string]: PostingTime[];
  };
}

export const bestPostingTimes: BestPostingTimes = {
  instagram: {
    "mode-beaute": [
      { time: "09:00", label: "Matin", reason: "Routine beauté matinale", engagement: 35 },
      { time: "13:00", label: "Pause déjeuner", reason: "Navigation active", engagement: 28 },
      { time: "19:00", label: "Soirée", reason: "Pic d'engagement", engagement: 42 }
    ],
    "food-beverage": [
      { time: "12:00", label: "Déjeuner", reason: "Inspiration repas", engagement: 45 },
      { time: "18:00", label: "Avant dîner", reason: "Recherche recettes", engagement: 38 },
      { time: "20:00", label: "Soirée", reason: "Détente", engagement: 32 }
    ],
    "fitness-sport": [
      { time: "06:00", label: "Tôt matin", reason: "Motivation workout", engagement: 40 },
      { time: "12:00", label: "Midi", reason: "Pause gym", engagement: 30 },
      { time: "18:00", label: "Après-travail", reason: "Salle de sport", engagement: 48 }
    ],
    "business-entrepreneur": [
      { time: "08:00", label: "Début journée", reason: "Lecture matinale", engagement: 38 },
      { time: "12:00", label: "Pause", reason: "Veille professionnelle", engagement: 32 },
      { time: "17:00", label: "Fin journée", reason: "Réseautage", engagement: 35 }
    ],
    "tech-digital": [
      { time: "09:00", label: "Matin", reason: "Veille tech", engagement: 36 },
      { time: "14:00", label: "Après-midi", reason: "Pause café", engagement: 30 },
      { time: "20:00", label: "Soirée", reason: "Lecture tech", engagement: 38 }
    ],
    "default": [
      { time: "09:00", label: "Matin", reason: "Engagement élevé", engagement: 35 },
      { time: "13:00", label: "Midi", reason: "Pause déjeuner", engagement: 30 },
      { time: "19:00", label: "Soirée", reason: "Pic d'activité", engagement: 40 }
    ]
  },
  facebook: {
    "food-beverage": [
      { time: "12:00", label: "Déjeuner", reason: "Pause repas", engagement: 38 },
      { time: "19:00", label: "Soirée", reason: "Après travail", engagement: 35 },
      { time: "21:00", label: "Nuit", reason: "Détente", engagement: 30 }
    ],
    "business-entrepreneur": [
      { time: "09:00", label: "Matin", reason: "Début journée", engagement: 32 },
      { time: "13:00", label: "Pause", reason: "Mi-journée", engagement: 28 },
      { time: "17:00", label: "Fin journée", reason: "Networking", engagement: 30 }
    ],
    "default": [
      { time: "09:00", label: "Matin", reason: "Début journée", engagement: 30 },
      { time: "13:00", label: "Pause", reason: "Vérification feed", engagement: 28 },
      { time: "20:00", label: "Soirée", reason: "Détente", engagement: 35 }
    ]
  },
  tiktok: {
    "mode-beaute": [
      { time: "07:00", label: "Très tôt", reason: "Routine matinale", engagement: 35 },
      { time: "12:00", label: "Midi", reason: "Pause", engagement: 30 },
      { time: "19:00", label: "Soirée", reason: "Divertissement", engagement: 45 },
      { time: "22:00", label: "Tard soir", reason: "Avant sommeil", engagement: 38 }
    ],
    "fitness-sport": [
      { time: "06:00", label: "Matin", reason: "Motivation matinale", engagement: 40 },
      { time: "12:00", label: "Midi", reason: "Pause", engagement: 28 },
      { time: "18:00", label: "Soirée", reason: "Post-workout", engagement: 42 },
      { time: "21:00", label: "Nuit", reason: "Scroll nocturne", engagement: 35 }
    ],
    "default": [
      { time: "07:00", label: "Très tôt", reason: "Commute", engagement: 32 },
      { time: "12:00", label: "Midi", reason: "Pause", engagement: 30 },
      { time: "19:00", label: "Soirée", reason: "Divertissement", engagement: 40 },
      { time: "22:00", label: "Tard soir", reason: "Avant sommeil", engagement: 35 }
    ]
  },
  linkedin: {
    "business-entrepreneur": [
      { time: "08:00", label: "Début journée", reason: "Avant réunions", engagement: 42 },
      { time: "12:00", label: "Pause déjeuner", reason: "Navigation active", engagement: 38 },
      { time: "17:00", label: "Fin journée", reason: "Networking", engagement: 40 }
    ],
    "tech-digital": [
      { time: "08:30", label: "Matin", reason: "Veille tech", engagement: 38 },
      { time: "12:30", label: "Midi", reason: "Pause", engagement: 32 },
      { time: "17:30", label: "Fin journée", reason: "Partage d'articles", engagement: 36 }
    ],
    "default": [
      { time: "08:00", label: "Matin", reason: "Lecture pro", engagement: 38 },
      { time: "12:00", label: "Midi", reason: "Pause", engagement: 32 },
      { time: "17:00", label: "Après-midi", reason: "Fin de journée", engagement: 35 }
    ]
  },
  twitter: {
    "tech-digital": [
      { time: "09:00", label: "Matin", reason: "Actualités tech", engagement: 38 },
      { time: "13:00", label: "Midi", reason: "Pause", engagement: 30 },
      { time: "18:00", label: "Soirée", reason: "Discussions", engagement: 35 }
    ],
    "default": [
      { time: "09:00", label: "Matin", reason: "Actualités", engagement: 35 },
      { time: "13:00", label: "Midi", reason: "Pause", engagement: 28 },
      { time: "18:00", label: "Soirée", reason: "Débats", engagement: 32 }
    ]
  },
  youtube: {
    "education": [
      { time: "14:00", label: "Après-midi", reason: "Apprentissage", engagement: 35 },
      { time: "19:00", label: "Soirée", reason: "Tutoriels", engagement: 42 },
      { time: "21:00", label: "Nuit", reason: "Vidéos longues", engagement: 38 }
    ],
    "default": [
      { time: "14:00", label: "Après-midi", reason: "Pause vidéo", engagement: 32 },
      { time: "19:00", label: "Soirée", reason: "Divertissement", engagement: 40 },
      { time: "21:00", label: "Nuit", reason: "Détente", engagement: 35 }
    ]
  }
};

// Facteurs d'engagement par jour de la semaine
export const dayFactors: Record<string, Record<string, number>> = {
  instagram: {
    monday: 0.95,
    tuesday: 1.0,
    wednesday: 1.05,
    thursday: 1.0,
    friday: 0.9,
    saturday: 1.1,
    sunday: 1.15
  },
  facebook: {
    monday: 0.92,
    tuesday: 0.95,
    wednesday: 1.0,
    thursday: 1.05,
    friday: 0.88,
    saturday: 1.08,
    sunday: 1.12
  },
  tiktok: {
    monday: 0.98,
    tuesday: 1.0,
    wednesday: 1.02,
    thursday: 1.05,
    friday: 1.08,
    saturday: 1.12,
    sunday: 1.1
  },
  linkedin: {
    monday: 1.1,
    tuesday: 1.15,
    wednesday: 1.12,
    thursday: 1.08,
    friday: 1.0,
    saturday: 0.7,
    sunday: 0.65
  },
  twitter: {
    monday: 1.0,
    tuesday: 1.05,
    wednesday: 1.08,
    thursday: 1.05,
    friday: 0.95,
    saturday: 0.9,
    sunday: 0.92
  },
  youtube: {
    monday: 0.95,
    tuesday: 0.98,
    wednesday: 1.0,
    thursday: 1.02,
    friday: 1.05,
    saturday: 1.15,
    sunday: 1.18
  }
};

export const getBestPostingTimes = (
  platform: string, 
  domain: string = 'default'
): PostingTime[] => {
  const platformTimes = bestPostingTimes[platform];
  if (!platformTimes) return [];
  
  return platformTimes[domain] || platformTimes.default || [];
};

export const getDayFactor = (platform: string, day: string): number => {
  const platformFactors = dayFactors[platform];
  if (!platformFactors) return 1.0;
  
  return platformFactors[day.toLowerCase()] || 1.0;
};

export const getBestDay = (platform: string): { day: string; boost: number } => {
  const platformFactors = dayFactors[platform];
  if (!platformFactors) return { day: 'sunday', boost: 15 };
  
  const entries = Object.entries(platformFactors);
  const best = entries.reduce((max, [day, factor]) => 
    factor > max.factor ? { day, factor } : max
  , { day: 'sunday', factor: 1.0 });
  
  return { 
    day: best.day, 
    boost: Math.round((best.factor - 1) * 100) 
  };
};
