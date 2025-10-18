import { subDays, format } from 'date-fns';

// Générer des données pour les 30 derniers jours
const generateDailyData = (days: number = 30) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      engagement: Math.floor(Math.random() * 500) + 200,
      impressions: Math.floor(Math.random() * 5000) + 2000,
      likes: Math.floor(Math.random() * 300) + 100,
      comments: Math.floor(Math.random() * 50) + 10,
      shares: Math.floor(Math.random() * 80) + 20,
    });
  }
  return data;
};

export const mockAnalyticsData = {
  // KPIs principaux
  overview: {
    likes: {
      total: 2847,
      change: 23.5,
      previousPeriod: 2308
    },
    views: {
      total: 45623,
      change: 15.8,
      previousPeriod: 39401
    },
    avgEngagement: {
      total: 3.7,
      change: -0.3,
      previousPeriod: 4.0,
      unit: '%'
    },
    growth: {
      total: 1456,
      change: 12.5,
      previousPeriod: 1295
    }
  },

  // Évolution de l'engagement (graphique ligne)
  engagementEvolution: generateDailyData(30),

  // Répartition des impressions par plateforme (graphique donut)
  impressionsByPlatform: [
    { platform: 'Instagram', value: 18500, color: '#E4405F', percentage: 40.5 },
    { platform: 'Facebook', value: 12300, color: '#1877F2', percentage: 26.9 },
    { platform: 'LinkedIn', value: 8400, color: '#0A66C2', percentage: 18.4 },
    { platform: 'TikTok', value: 4200, color: '#000000', percentage: 9.2 },
    { platform: 'Twitter', value: 2223, color: '#1DA1F2', percentage: 4.9 }
  ],

  // Taux d'engagement par plateforme (graphique barres)
  engagementByPlatform: [
    { platform: 'Instagram', rate: 4.2, color: '#E4405F' },
    { platform: 'TikTok', rate: 5.8, color: '#000000' },
    { platform: 'Facebook', rate: 2.1, color: '#1877F2' },
    { platform: 'LinkedIn', rate: 3.5, color: '#0A66C2' },
    { platform: 'Twitter', rate: 1.9, color: '#1DA1F2' }
  ],

  // Publications les plus performantes
  topPosts: [
    {
      id: '1',
      content: 'Lancement de notre nouvelle collection printemps 🌸',
      platform: 'instagram',
      publishedAt: subDays(new Date(), 2).toISOString(),
      metrics: {
        likes: 847,
        comments: 92,
        shares: 45,
        views: 12400,
        engagementRate: 7.8
      },
      thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
    },
    {
      id: '2',
      content: '5 astuces pour booster votre productivité 💼',
      platform: 'linkedin',
      publishedAt: subDays(new Date(), 5).toISOString(),
      metrics: {
        likes: 623,
        comments: 78,
        shares: 156,
        views: 9800,
        engagementRate: 8.7
      },
      thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400'
    },
    {
      id: '3',
      content: 'Transformation avant/après incroyable ! 😍',
      platform: 'tiktok',
      publishedAt: subDays(new Date(), 7).toISOString(),
      metrics: {
        likes: 1245,
        comments: 234,
        shares: 89,
        views: 28500,
        engagementRate: 5.5
      },
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400'
    },
    {
      id: '4',
      content: 'Nos valeurs : authenticité, qualité, durabilité 🌱',
      platform: 'facebook',
      publishedAt: subDays(new Date(), 10).toISOString(),
      metrics: {
        likes: 534,
        comments: 67,
        shares: 123,
        views: 8200,
        engagementRate: 8.8
      },
      thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400'
    },
    {
      id: '5',
      content: 'Concours : tentez de gagner un pack complet ! 🎁',
      platform: 'instagram',
      publishedAt: subDays(new Date(), 14).toISOString(),
      metrics: {
        likes: 956,
        comments: 412,
        shares: 78,
        views: 15600,
        engagementRate: 9.3
      },
      thumbnail: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400'
    }
  ],

  // Performance par type de contenu
  contentTypePerformance: [
    { type: 'Image', count: 45, avgEngagement: 4.2, totalViews: 125000 },
    { type: 'Vidéo', count: 23, avgEngagement: 6.8, totalViews: 98000 },
    { type: 'Carrousel', count: 18, avgEngagement: 5.5, totalViews: 87000 },
    { type: 'Story', count: 67, avgEngagement: 3.1, totalViews: 56000 },
    { type: 'Reel', count: 12, avgEngagement: 7.2, totalViews: 145000 }
  ],

  // Meilleurs moments pour publier (heatmap)
  bestTimesToPost: {
    // Format: { day: { hour: performance_score (0-100) } }
    'Dim': { 
      '00h': 15, '01h': 12, '02h': 10, '03h': 8, '04h': 7, '05h': 9, 
      '06h': 14, '07h': 22, '08h': 35, '09h': 48, '10h': 62, '11h': 71,
      '12h': 85, '13h': 78, '14h': 72, '15h': 68, '16h': 75, '17h': 82,
      '18h': 88, '19h': 92, '20h': 95, '21h': 87, '22h': 68, '23h': 42
    },
    'Lun': {
      '00h': 18, '01h': 14, '02h': 11, '03h': 9, '04h': 8, '05h': 12,
      '06h': 28, '07h': 45, '08h': 68, '09h': 82, '10h': 88, '11h': 85,
      '12h': 79, '13h': 72, '14h': 75, '15h': 78, '16h': 82, '17h': 85,
      '18h': 88, '19h': 90, '20h': 86, '21h': 75, '22h': 58, '23h': 35
    },
    'Mar': {
      '00h': 16, '01h': 13, '02h': 10, '03h': 8, '04h': 9, '05h': 15,
      '06h': 32, '07h': 52, '08h': 72, '09h': 85, '10h': 90, '11h': 87,
      '12h': 82, '13h': 78, '14h': 80, '15h': 83, '16h': 86, '17h': 88,
      '18h': 91, '19h': 93, '20h': 89, '21h': 78, '22h': 62, '23h': 38
    },
    'Mer': {
      '00h': 17, '01h': 14, '02h': 11, '03h': 9, '04h': 10, '05h': 16,
      '06h': 35, '07h': 55, '08h': 75, '09h': 87, '10h': 92, '11h': 89,
      '12h': 85, '13h': 82, '14h': 84, '15h': 86, '16h': 88, '17h': 90,
      '18h': 93, '19h': 95, '20h': 91, '21h': 80, '22h': 65, '23h': 40
    },
    'Jeu': {
      '00h': 16, '01h': 13, '02h': 10, '03h': 8, '04h': 9, '05h': 14,
      '06h': 30, '07h': 50, '08h': 70, '09h': 84, '10h': 89, '11h': 86,
      '12h': 80, '13h': 75, '14h': 78, '15h': 81, '16h': 84, '17h': 87,
      '18h': 90, '19h': 92, '20h': 88, '21h': 76, '22h': 60, '23h': 36
    },
    'Ven': {
      '00h': 18, '01h': 15, '02h': 12, '03h': 10, '04h': 11, '05h': 17,
      '06h': 28, '07h': 42, '08h': 62, '09h': 76, '10h': 82, '11h': 78,
      '12h': 72, '13h': 68, '14h': 65, '15h': 70, '16h': 75, '17h': 80,
      '18h': 85, '19h': 88, '20h': 90, '21h': 85, '22h': 75, '23h': 58
    },
    'Sam': {
      '00h': 22, '01h': 18, '02h': 15, '03h': 12, '04h': 10, '05h': 12,
      '06h': 18, '07h': 28, '08h': 42, '09h': 58, '10h': 72, '11h': 82,
      '12h': 88, '13h': 85, '14h': 82, '15h': 80, '16h': 83, '17h': 86,
      '18h': 90, '19h': 93, '20h': 95, '21h': 90, '22h': 78, '23h': 52
    }
  },

  // Insights et recommandations
  insights: [
    {
      type: 'positive',
      title: 'Excellent engagement sur les carrousels',
      description: 'Les carrousels génèrent +45% d\'engagement par rapport aux images simples',
      action: 'Créer plus de carrousels'
    },
    {
      type: 'info',
      title: 'Meilleur moment pour publier',
      description: 'Vos posts entre 18h-21h obtiennent 67% plus de vues',
      action: 'Planifier aux heures optimales'
    },
    {
      type: 'warning',
      title: 'Baisse d\'engagement sur Facebook',
      description: 'Engagement en baisse de 12% sur Facebook ce mois-ci',
      action: 'Revoir la stratégie Facebook'
    }
  ],

  // Recommandations
  recommendations: [
    {
      priority: 'high',
      title: 'Augmentez la fréquence des vidéos',
      description: 'Vos vidéos atteignent 2x plus de personnes. Continuez sur cette voie !',
      impact: '+35% de portée estimée'
    },
    {
      priority: 'medium',
      title: 'Optimisez vos horaires de publication',
      description: 'Publiez entre 18h-21h pour maximiser l\'engagement',
      impact: '+28% d\'engagement'
    },
    {
      priority: 'medium',
      title: 'Diversifiez vos hashtags',
      description: 'Testez de nouveaux hashtags pour toucher une audience plus large',
      impact: '+15% de portée'
    }
  ]
};
