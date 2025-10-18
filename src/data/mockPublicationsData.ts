import { Post } from '@/types/Post';

// Images par défaut pour garantir un affichage cohérent
const defaultImages = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', // Café 1
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', // Café 2
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400', // Café 3
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400', // Café 4
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', // Café 5
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400', // Café 6
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', // Café 7
  'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', // Café 8
  'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400', // Café 9
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', // Café 10
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400', // Café 11
  'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400', // Café 12
];

// Fonction pour générer des stats réalistes
function generateMockStats(): { likes: number; comments: number; shares: number; views: number; engagement: number } {
  const likes = Math.floor(Math.random() * 500) + 50;
  const comments = Math.floor(Math.random() * 50) + 5;
  const shares = Math.floor(Math.random() * 30) + 2;
  const views = likes * (Math.floor(Math.random() * 5) + 3); // 3-8x les likes
  const engagement = likes + comments + shares;

  return {
    likes,
    comments,
    shares,
    views,
    engagement
  };
}

// Fonction pour assigner une image par défaut
function getDefaultImage(index: number): string {
  return defaultImages[index % defaultImages.length];
}

// Données mockées complètes avec images et stats
export const mockPublicationsData: Post[] = [
  {
    id: 'pub-1',
    content: '☕ Bon weekend à tous ! Profitez de votre café préféré et détendez bien votre esprit. #BonWeekend #CaféArtisanal',
    scheduledTime: new Date(2025, 0, 19, 10, 0),
    platforms: ['instagram', 'facebook'],
    status: 'draft',
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-2',
    content: '🍂 Pack découverte famille ! 4 cafés différents pour satisfaire tous les goûts. Économisez 30% ! #PackFamille #CaféBio',
    scheduledTime: new Date(2025, 0, 19, 14, 0),
    platforms: ['instagram', 'facebook'],
    status: 'draft',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-3',
    content: '☕ Recette du jour : Café glacé au caramel ! Parfait pour les après-midi gourmands, découvrez la recette sur notre site. #RecetteCafé #CaféGlacé',
    scheduledTime: new Date(2025, 0, 19, 16, 0),
    platforms: ['instagram', 'youtube'],
    status: 'draft',
    images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-4',
    content: '💼 Service client 7j/7 ! Notre équipe est là pour vous accompagner dans votre découverte du café. Contactez-nous ! #ServiceClient #CaféPremium',
    scheduledTime: new Date(2025, 0, 18, 9, 0),
    platforms: ['facebook', 'linkedin'],
    status: 'draft',
    images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-5',
    content: '☀️ Bon samedi ! Un café filtre doux pour commencer la journée en douceur. Découvrez notre sélection premium. #SamediCafé #FiltreDoux',
    scheduledTime: new Date(2025, 0, 18, 11, 0),
    platforms: ['instagram', 'facebook'],
    status: 'draft',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-6',
    content: '🎨 L\'art du café commence par la sélection des grains. Notre torréfacteur vous explique son savoir-faire unique ! #Torréfaction #SavoirFaire',
    scheduledTime: new Date(2025, 0, 17, 14, 0),
    platforms: ['instagram', 'youtube'],
    status: 'published',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-7',
    content: '💰 -25% sur toute notre gamme premium ! Profitez de cette offre limitée pour découvrir nos meilleurs cafés. #Promotion #CaféPremium',
    scheduledTime: new Date(2025, 0, 17, 16, 0),
    platforms: ['instagram', 'twitter', 'youtube'],
    status: 'draft',
    images: ['https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400'],
    author: 'Adja Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=5',
    engagement: generateMockStats()
  },
  {
    id: 'pub-8',
    content: '💰 -25% sur toute notre gamme premium ! Profitez de cette offre limitée pour découvrir nos meilleurs cafés. #Promotion #CaféPremium',
    scheduledTime: new Date(2025, 0, 17, 18, 0),
    platforms: ['instagram', 'twitter', 'youtube'],
    status: 'published',
    images: ['https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-9',
    content: '⚡ Le café, votre allié énergie ! Découvrez comment notre café bio vous donne l\'énergie nécessaire pour votre journée. #CaféBio #Énergie',
    scheduledTime: new Date(2025, 0, 16, 8, 0),
    platforms: ['linkedin', 'facebook'],
    status: 'published',
    images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-10',
    content: '🚚 Livraison express en 2h ! Commandez avant 14h et recevez votre café fraîchement torréfié le jour même. #LivraisonExpress #CaféFrais',
    scheduledTime: new Date(2025, 0, 16, 12, 0),
    platforms: ['facebook', 'instagram'],
    status: 'published',
    images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-11',
    content: '🌿 Découvrez nos dernières créations ! Nouveaux mélanges exclusifs pour une expérience gustative unique. #Nouveautés #CaféExclusif',
    scheduledTime: new Date(2025, 0, 16, 15, 0),
    platforms: ['instagram', 'youtube'],
    status: 'published',
    images: ['https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  },
  {
    id: 'pub-12',
    content: '☕ Découvrez notre nouvelle collection ! Des cafés d\'exception sélectionnés dans les meilleures plantations du monde. #NouvelleCollection #CaféException',
    scheduledTime: new Date(2025, 0, 16, 18, 0),
    platforms: ['facebook', 'instagram'],
    status: 'published',
    images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400'],
    author: 'Malick Diakhate',
    authorAvatar: 'https://i.pravatar.cc/150?img=12',
    engagement: generateMockStats()
  }
];

// Fonction pour enrichir les posts avec des images et stats par défaut
export function enrichPostsWithDefaults(posts: Post[]): Post[] {
  return posts.map((post, index) => ({
    ...post,
    // Garantir qu'il y a toujours une image
    images: post.images && post.images.length > 0 
      ? post.images 
      : [getDefaultImage(index)],
    // Garantir qu'il y a toujours des stats
    engagement: post.engagement || generateMockStats()
  }));
}

// Export des images par défaut pour utilisation dans d'autres composants
export { defaultImages, generateMockStats, getDefaultImage };
