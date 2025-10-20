import { Post, Campaign } from '@/types/Post';

export const campaigns: Campaign[] = [
  {
    id: 'morning-boost',
    name: 'Morning Boost',
    color: '#6F4E37',
    description: 'Commencez la journée avec énergie'
  },
  {
    id: 'afternoon-break',
    name: 'Pause Gourmande',
    color: '#CD853F',
    description: 'Le plaisir d\'une pause café'
  },
  {
    id: 'premium-selection',
    name: 'Sélection Premium',
    color: '#8B4513',
    description: 'Nos meilleurs cafés d\'origine'
  },
  {
    id: 'eco-friendly',
    name: 'Éco-responsable',
    color: '#228B22',
    description: 'Café bio et commerce équitable'
  }
];

export const samplePosts: Post[] = [
  // DIMANCHE - 3 posts
  {
    id: 'cafe-1',
    content: '☕ Démarrez votre dimanche en douceur avec notre Espresso Signature ! Torréfaction maison, arômes intenses. #CaféArtisanal #DimancheMatin #Espresso',
    scheduledTime: new Date(2025, 0, 19, 10, 0),
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800'],
    campaign: 'Morning Boost',
    campaignColor: '#6F4E37',
    author: 'Jean Dupont',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    dayColumn: 'dimanche',
    timeSlot: 0,
  },
  {
    id: 'cafe-2',
    content: '🌱 Nos grains 100% bio sont sélectionnés avec soin dans les meilleures plantations. Découvrez notre gamme équitable ! #BioCafé #CommerceÉquitable #DimancheChill',
    scheduledTime: new Date(2025, 0, 19, 14, 30),
    platforms: ['instagram', 'twitter'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800'],
    author: 'Marie Martin',
    authorAvatar: 'https://i.pravatar.cc/150?img=5',
    dayColumn: 'dimanche',
    timeSlot: 1,
  },
  {
    id: 'cafe-3',
    content: '🥤 La pause café parfaite existe ! Cappuccino crémeux avec notre lait d\'avoine artisanal. Venez découvrir ! #Cappuccino #VeganCoffee #CaféCosy',
    scheduledTime: new Date(2025, 0, 19, 18, 0),
    platforms: ['linkedin', 'facebook'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800'],
    campaign: 'Pause Gourmande',
    campaignColor: '#CD853F',
    author: 'Sophie Bernard',
    authorAvatar: 'https://i.pravatar.cc/150?img=9',
    dayColumn: 'dimanche',
    timeSlot: 2,
  },

  // LUNDI - 3 posts
  {
    id: 'cafe-4',
    content: '💪 Lundi motivant avec un bon café ! Notre Latte macchiato vous donne l\'énergie pour démarrer la semaine. #LundiMotivation #LatteArt #CaféDeQualité',
    scheduledTime: new Date(2025, 0, 20, 9, 0),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800'],
    author: 'Thomas Petit',
    authorAvatar: 'https://i.pravatar.cc/150?img=33',
    dayColumn: 'lundi',
    timeSlot: 0,
  },
  {
    id: 'cafe-5',
    content: '🎨 L\'art du café commence par la sélection des grains. Notre torréfacteur vous explique son savoir-faire unique ! #Torréfaction #CaféArtisanal #SavoirFaire',
    scheduledTime: new Date(2025, 0, 20, 13, 15),
    platforms: ['youtube', 'instagram'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
    campaign: 'Sélection Premium',
    campaignColor: '#8B4513',
    author: 'Lucas Dubois',
    authorAvatar: 'https://i.pravatar.cc/150?img=68',
    dayColumn: 'lundi',
    timeSlot: 1,
  },
  {
    id: 'cafe-6',
    content: '📚 Saviez-vous que le café a une histoire fascinante ? De l\'Éthiopie à votre tasse, découvrez son voyage ! #HistoireDuCafé #Culture #CaféPassion',
    scheduledTime: new Date(2025, 0, 20, 16, 45),
    platforms: ['instagram', 'tiktok'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800'],
    campaign: 'Morning Boost',
    campaignColor: '#6F4E37',
    author: 'Emma Rousseau',
    authorAvatar: 'https://i.pravatar.cc/150?img=10',
    dayColumn: 'lundi',
    timeSlot: 2,
  },

  // MARDI - 3 posts
  {
    id: 'cafe-7',
    content: '📱 Découvrez nos dernières créations ! Notre Cold Brew infusé 24h est parfait pour les après-midis. #ColdBrew #CaféGlacé #Rafraîchissant',
    scheduledTime: new Date(2025, 0, 21, 11, 30),
    platforms: ['youtube', 'facebook'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800'],
    author: 'Claire Durand',
    authorAvatar: 'https://i.pravatar.cc/150?img=44',
    dayColumn: 'mardi',
    timeSlot: 0,
  },
  {
    id: 'cafe-8',
    content: '🏆 Merci pour votre confiance ! Votre café préféré continue de vous surprendre avec de nouvelles saveurs. #Merci #CaféPassion #CommunautéCafé',
    scheduledTime: new Date(2025, 0, 21, 14, 0),
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800'],
    campaign: 'Pause Gourmande',
    campaignColor: '#CD853F',
    author: 'Antoine Lambert',
    authorAvatar: 'https://i.pravatar.cc/150?img=15',
    dayColumn: 'mardi',
    timeSlot: 1,
  },
  {
    id: 'cafe-9',
    content: '🎯 Notre équipe de baristas est là pour vous conseiller ! Posez-nous vos questions sur l\'extraction parfaite. #Barista #ConseilsCafé #ExpertsCafé',
    scheduledTime: new Date(2025, 0, 21, 17, 30),
    platforms: ['twitter', 'linkedin'],
    status: 'scheduled',
    author: 'Maxime Girard',
    authorAvatar: 'https://i.pravatar.cc/150?img=51',
    dayColumn: 'mardi',
    timeSlot: 2,
  },

  // MERCREDI - 4 posts
  {
    id: 'cafe-10',
    content: '📈 Honorés d\'être dans le top 10 des meilleurs cafés artisanaux ! Merci à notre communauté fidèle. #TopCafé #CaféArtisanal #Reconnaissance',
    scheduledTime: new Date(2025, 0, 22, 10, 15),
    platforms: ['facebook', 'linkedin'],
    status: 'published',
    images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800'],
    campaign: 'Éco-responsable',
    campaignColor: '#228B22',
    author: 'Julien Moreau',
    authorAvatar: 'https://i.pravatar.cc/150?img=60',
    engagement: {
      likes: 234,
      comments: 45,
      shares: 12,
      views: 1250
    },
    dayColumn: 'mercredi',
    timeSlot: 0,
  },
  {
    id: 'cafe-11',
    content: '☕ Pause déjeuner gourmande avec notre Americano signature ! Léger et savoureux pour bien digérer. #PauseDéjeuner #Americano #CaféSain',
    scheduledTime: new Date(2025, 0, 22, 12, 30),
    platforms: ['instagram'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=800'],
    author: 'Camille Leroy',
    authorAvatar: 'https://i.pravatar.cc/150?img=20',
    dayColumn: 'mercredi',
    timeSlot: 1,
  },
  {
    id: 'cafe-12',
    content: '🚚 Livraison express en 2h dans toute la ville ! Nos cafés fraîchement torréfiés arrivent chez vous. #Livraison #CaféFrais #ServiceRapide',
    scheduledTime: new Date(2025, 0, 22, 15, 45),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800'],
    campaign: 'Éco-responsable',
    campaignColor: '#228B22',
    author: 'Nicolas Fontaine',
    authorAvatar: 'https://i.pravatar.cc/150?img=70',
    dayColumn: 'mercredi',
    timeSlot: 2,
  },

  // JEUDI - 3 posts
  {
    id: 'cafe-13',
    content: '✨ Découvrez notre nouvelle collection de cafés d\'origine unique ! Ethiopie, Colombie, Kenya... voyagez avec nous ! #CaféOrigine #Découverte #TourDuMonde',
    scheduledTime: new Date(2025, 0, 23, 9, 30),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800'],
    author: 'Isabelle Roux',
    authorAvatar: 'https://i.pravatar.cc/150?img=25',
    dayColumn: 'jeudi',
    timeSlot: 0,
  },
  {
    id: 'cafe-14',
    content: '🍽️ Recette du jour : Café glacé au caramel ! Parfait pour les gourmands, découvrez la recette sur notre blog. #RecetteCafé #CaféGlacé #Gourmandise',
    scheduledTime: new Date(2025, 0, 23, 13, 0),
    platforms: ['instagram', 'youtube'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=800'],
    campaign: 'Sélection Premium',
    campaignColor: '#8B4513',
    author: 'Pierre Blanchard',
    authorAvatar: 'https://i.pravatar.cc/150?img=52',
    dayColumn: 'jeudi',
    timeSlot: 1,
  },
  {
    id: 'cafe-15',
    content: '💪 Le café, votre allié énergie et concentration ! Découvrez les bienfaits de la caféine naturelle. #Énergie #BienÊtre #CaféSanté',
    scheduledTime: new Date(2025, 0, 23, 16, 30),
    platforms: ['linkedin', 'facebook'],
    status: 'scheduled',
    author: 'Sarah Dupuis',
    authorAvatar: 'https://i.pravatar.cc/150?img=30',
    dayColumn: 'jeudi',
    timeSlot: 2,
  },

  // VENDREDI - 3 posts
  {
    id: 'cafe-16',
    content: '🎉 C\'est vendredi ! -25% sur toute notre gamme premium ce weekend. L\'excellence à prix doux ! #PromoWeekend #CaféPremium #VendrediCafé',
    scheduledTime: new Date(2025, 0, 24, 10, 0),
    platforms: ['instagram', 'facebook', 'twitter'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800'],
    campaign: 'Morning Boost',
    campaignColor: '#6F4E37',
    author: 'Alexandre Mercier',
    authorAvatar: 'https://i.pravatar.cc/150?img=13',
    dayColumn: 'vendredi',
    timeSlot: 0,
  },
  {
    id: 'cafe-17',
    content: '👨‍👩‍👧‍👦 Pack découverte famille ! 4 cafés différents pour satisfaire tous les goûts. Économisez 30% ! #PackFamille #DécouverteCafé #CaféPourTous',
    scheduledTime: new Date(2025, 0, 24, 14, 15),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
    campaign: 'Pause Gourmande',
    campaignColor: '#CD853F',
    author: 'Céline Garnier',
    authorAvatar: 'https://i.pravatar.cc/150?img=47',
    dayColumn: 'vendredi',
    timeSlot: 1,
  },
  {
    id: 'cafe-18',
    content: '🌙 Bon weekend à tous ! Profitez de votre café préféré pour un moment détente bien mérité. #BonWeekend #MomentDétente #CaféPlaisir',
    scheduledTime: new Date(2025, 0, 24, 18, 0),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    author: 'Olivier Vincent',
    authorAvatar: 'https://i.pravatar.cc/150?img=57',
    dayColumn: 'vendredi',
    timeSlot: 2,
  },

  // SAMEDI - 2 posts
  {
    id: 'cafe-19',
    content: '☀️ Bon samedi ! Un café filtre doux pour accompagner votre brunch du weekend. Commandez maintenant ! #SamediMatin #Brunch #CaféFiltre',
    scheduledTime: new Date(2025, 0, 25, 11, 0),
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    images: ['https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=800'],
    campaign: 'Morning Boost',
    campaignColor: '#6F4E37',
    author: 'Nathalie Perrin',
    authorAvatar: 'https://i.pravatar.cc/150?img=24',
    dayColumn: 'samedi',
    timeSlot: 0,
  },
  {
    id: 'cafe-20',
    content: '📞 Service client 7j/7 ! Notre équipe passionnée est là pour vous conseiller sur vos achats. Contactez-nous ! #ServiceClient #ConseilsCafé #ÉquipePassionnée',
    scheduledTime: new Date(2025, 0, 25, 15, 30),
    platforms: ['facebook', 'linkedin'],
    status: 'scheduled',
    author: 'Rémi Chevalier',
    authorAvatar: 'https://i.pravatar.cc/150?img=63',
    dayColumn: 'samedi',
    timeSlot: 1,
  }
];

// Helper function to get posts by day
export const getPostsByDay = (dayColumn: string): Post[] => {
  return samplePosts.filter(post => post.dayColumn === dayColumn);
};

// Helper function to get posts by status
export const getPostsByStatus = (status: string): Post[] => {
  return samplePosts.filter(post => post.status === status);
};

// Helper function to get posts by campaign
export const getPostsByCampaign = (campaignId: string): Post[] => {
  const campaign = campaigns.find(c => c.id === campaignId);
  return campaign ? samplePosts.filter(post => post.campaign === campaign.name) : [];
};
