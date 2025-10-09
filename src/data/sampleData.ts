import { Post, Campaign } from '@/types/Post';
import halalMeatDisplay from '@/assets/halal-meat-display.jpg';
import lambChops from '@/assets/lamb-chops.jpg';
import grilledBeef from '@/assets/grilled-beef.jpg';
import butcherShopInterior from '@/assets/butcher-shop-interior.jpg';
import halalChicken from '@/assets/halal-chicken.jpg';

export const campaigns: Campaign[] = [
  {
    id: 'weekend-special',
    name: 'Weekend Gourmet',
    color: '#8B4513',
    description: 'Sélection premium pour vos repas du weekend'
  },
  {
    id: 'family-pack',
    name: 'Pack Famille',
    color: '#228B22',
    description: 'Offres spéciales pour les familles nombreuses'
  },
  {
    id: 'premium-cut',
    name: 'Découpes Premium',
    color: '#DC143C',
    description: 'Nos meilleures découpes de boucherie'
  },
  {
    id: 'delivery-promo',
    name: 'Livraison Express',
    color: '#FF6347',
    description: 'Livraison rapide et fraîcheur garantie'
  }
];

export const samplePosts: Post[] = [
  // DIMANCHE - 3 posts
  {
    id: 'mata-1',
    content: '🥩 Découvrez notre sélection premium de viandes fraîches chez Mata Viande ! Nos steaks de bœuf sont parfaits pour vos grillades du weekend. Livraison gratuite dès 50€ ! #MataViande #QualitéPremium #BoucherieEnLigne',
    scheduledTime: new Date(2025, 0, 5, 10, 0),
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    image: halalMeatDisplay,
    campaign: 'Weekend Gourmet',
    campaignColor: '#8B4513',
    author: 'Mata Viande',
    dayColumn: 'dimanche',
    timeSlot: 0,
  },
  {
    id: 'mata-2',
    content: '🍖 Nos côtelettes d\'agneau marinées aux herbes de Provence sont prêtes ! Commandez dès maintenant pour votre repas de famille. Fraîcheur garantie ! #Agneau #HerbesDeProvence #MataViande',
    scheduledTime: new Date(2025, 0, 5, 14, 30),
    platforms: ['instagram', 'twitter'],
    status: 'scheduled',
    image: lambChops,
    author: 'Mata Viande',
    dayColumn: 'dimanche',
    timeSlot: 1,
  },
  {
    id: 'mata-3',
    content: '🎯 Saviez-vous que nos viandes sont sélectionnées directement chez nos producteurs partenaires ? Qualité et traçabilité garanties depuis 2010. #Traçabilité #Qualité #MataViande',
    scheduledTime: new Date(2025, 0, 5, 18, 0),
    platforms: ['linkedin', 'facebook'],
    status: 'scheduled',
    image: butcherShopInterior,
    campaign: 'Pack Famille',
    campaignColor: '#228B22',
    author: 'Mata Viande',
    dayColumn: 'dimanche',
    timeSlot: 2,
  },

  // LUNDI - 3 posts
  {
    id: 'mata-4',
    content: '🔥 Nos bouchers spécialisés dans la découpe préparent vos commandes avec passion ! Rendez-vous sur mata-viande.fr ou commandez en ligne. #Bouchers #Passion #MataViande',
    scheduledTime: new Date(2025, 0, 6, 9, 0),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    image: grilledBeef,
    author: 'Mata Viande',
    dayColumn: 'lundi',
    timeSlot: 0,
  },
  {
    id: 'mata-5',
    content: '🎬 Découvrez les coulisses de notre boucherie en ligne ! Nos bouchers vous expliquent les différentes découpes et leur préparation traditionnelle. #Coulisses #Découpes #MataViande',
    scheduledTime: new Date(2025, 0, 6, 13, 15),
    platforms: ['youtube', 'instagram'],
    status: 'scheduled',
    image: grilledBeef,
    campaign: 'Découpes Premium',
    campaignColor: '#DC143C',
    author: 'Mata Viande',
    dayColumn: 'lundi',
    timeSlot: 1,
  },
  {
    id: 'mata-6',
    content: '🌟 Laissez-nous vous aider à préparer votre #Barbecue parfait ! Notre équipe sélectionne les meilleures pièces pour vos grillades. #Barbecue #Grillades #MataViande',
    scheduledTime: new Date(2025, 0, 6, 16, 45),
    platforms: ['instagram', 'tiktok'],
    status: 'scheduled',
    image: grilledBeef,
    campaign: 'Weekend Gourmet',
    campaignColor: '#8B4513',
    author: 'Mata Viande',
    dayColumn: 'lundi',
    timeSlot: 2,
  },

  // MARDI - 3 posts
  {
    id: 'mata-7',
    content: '📱 Découvrez nos dernières créations culinaires sur nos réseaux sociaux ! Suivez-nous pour ne rien manquer de nos nouveautés et promotions. #Recettes #Cuisine #MataViande',
    scheduledTime: new Date(2025, 0, 7, 11, 30),
    platforms: ['youtube', 'facebook'],
    status: 'scheduled',
    image: butcherShopInterior,
    author: 'Mata Viande',
    dayColumn: 'mardi',
    timeSlot: 0,
  },
  {
    id: 'mata-8',
    content: '🏆 Notre objectif : être votre boucherie en ligne de référence ! Merci pour votre confiance et vos témoignages qui nous motivent chaque jour. #Confiance #Témoignages #MataViande',
    scheduledTime: new Date(2025, 0, 7, 14, 0),
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    image: halalMeatDisplay,
    campaign: 'Pack Famille',
    campaignColor: '#228B22',
    author: 'Mata Viande',
    dayColumn: 'mardi',
    timeSlot: 1,
  },
  {
    id: 'mata-9',
    content: '🎯 Notre équipe de bouchers professionnels est à votre service pour vous conseiller dans vos achats. N\'hésitez pas à nous poser vos questions ! #Conseils #Service #MataViande',
    scheduledTime: new Date(2025, 0, 7, 17, 30),
    platforms: ['twitter', 'linkedin'],
    status: 'scheduled',
    author: 'Mata Viande',
    dayColumn: 'mardi',
    timeSlot: 2,
  },

  // MERCREDI - 3 posts
  {
    id: 'mata-10',
    content: '📈 Nous sommes honorés d\'être inclus dans cette liste des meilleures boucheries en ligne de France ! Merci à tous nos clients fidèles. #Reconnaissance #Clients #MataViande',
    scheduledTime: new Date(2025, 0, 8, 10, 15),
    platforms: ['facebook', 'linkedin'],
    status: 'published',
    image: butcherShopInterior,
    campaign: 'Livraison Express',
    campaignColor: '#FF6347',
    author: 'Mata Viande',
    engagement: {
      likes: 156,
      comments: 23,
      shares: 8,
      views: 890
    },
    dayColumn: 'mercredi',
    timeSlot: 0,
  },
  {
    id: 'mata-11',
    content: '🥩 Pause déjeuner avec une sélection de nos viandes les plus tendres ! Parfait pour un repas léger et savoureux en milieu de journée. #Déjeuner #Tendresse #MataViande',
    scheduledTime: new Date(2025, 0, 8, 12, 30),
    platforms: ['instagram'],
    status: 'scheduled',
    image: lambChops,
    author: 'Mata Viande',
    dayColumn: 'mercredi',
    timeSlot: 1,
  },
  {
    id: 'mata-12',
    content: '🚚 Livraison express en 24h partout en France ! Nos viandes sont emballées sous vide pour préserver leur fraîcheur. #Livraison #Express #MataViande',
    scheduledTime: new Date(2025, 0, 8, 15, 45),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    image: halalChicken,
    campaign: 'Livraison Express',
    campaignColor: '#FF6347',
    author: 'Mata Viande',
    dayColumn: 'mercredi',
    timeSlot: 2,
  },

  // JEUDI - 3 posts
  {
    id: 'mata-13',
    content: '✨ Notre sélection de volailles fraîches arrive directement de nos producteurs partenaires. Poulet, dinde, canard... tout pour vos recettes ! #Volailles #Fraîcheur #MataViande',
    scheduledTime: new Date(2025, 0, 9, 9, 30),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    image: halalChicken,
    author: 'Mata Viande',
    dayColumn: 'jeudi',
    timeSlot: 0,
  },
  {
    id: 'mata-14',
    content: '🍽️ Recette du jour : Côtelettes d\'agneau aux herbes de Provence ! Découvrez nos conseils de cuisson pour sublimer vos viandes. #Recette #Conseils #MataViande',
    scheduledTime: new Date(2025, 0, 9, 13, 0),
    platforms: ['instagram', 'youtube'],
    status: 'scheduled',
    image: lambChops,
    campaign: 'Découpes Premium',
    campaignColor: '#DC143C',
    author: 'Mata Viande',
    dayColumn: 'jeudi',
    timeSlot: 1,
  },
  {
    id: 'mata-15',
    content: '💪 Nos viandes sont riches en protéines et parfaites pour une alimentation équilibrée. Découvrez nos conseils nutrition ! #Nutrition #Protéines #MataViande',
    scheduledTime: new Date(2025, 0, 9, 16, 30),
    platforms: ['linkedin', 'facebook'],
    status: 'scheduled',
    author: 'Mata Viande',
    dayColumn: 'jeudi',
    timeSlot: 2,
  },

  // VENDREDI - 3 posts
  {
    id: 'mata-16',
    content: '🎉 Weekend spécial ! -20% sur toute notre sélection de viandes premium. Offre valable jusqu\'à dimanche soir. Ne ratez pas cette opportunité ! #Promotion #Weekend #MataViande',
    scheduledTime: new Date(2025, 0, 10, 10, 0),
    platforms: ['instagram', 'facebook', 'twitter'],
    status: 'scheduled',
    image: halalMeatDisplay,
    campaign: 'Weekend Gourmet',
    campaignColor: '#8B4513',
    author: 'Mata Viande',
    dayColumn: 'vendredi',
    timeSlot: 0,
  },
  {
    id: 'mata-17',
    content: '👨‍👩‍👧‍👦 Pack famille disponible ! Idéal pour les familles nombreuses, notre pack contient tout ce qu\'il faut pour la semaine. Économisez jusqu\'à 30% ! #PackFamille #Économies #MataViande',
    scheduledTime: new Date(2025, 0, 10, 14, 15),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    image: butcherShopInterior,
    campaign: 'Pack Famille',
    campaignColor: '#228B22',
    author: 'Mata Viande',
    dayColumn: 'vendredi',
    timeSlot: 1,
  },
  {
    id: 'mata-18',
    content: '🌙 Bonne soirée à tous ! N\'oubliez pas de commander vos viandes pour le weekend. Livraison gratuite dès 50€ d\'achat. #BonneSoirée #Weekend #MataViande',
    scheduledTime: new Date(2025, 0, 10, 18, 0),
    platforms: ['facebook', 'instagram'],
    status: 'scheduled',
    author: 'Mata Viande',
    dayColumn: 'vendredi',
    timeSlot: 2,
  },

  // SAMEDI - 2 posts
  {
    id: 'mata-19',
    content: '☀️ Bon weekend ! Nos viandes fraîches sont parfaites pour vos grillades en famille. Commandez maintenant pour une livraison demain ! #Weekend #Grillades #MataViande',
    scheduledTime: new Date(2025, 0, 11, 11, 0),
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    image: grilledBeef,
    campaign: 'Weekend Gourmet',
    campaignColor: '#8B4513',
    author: 'Mata Viande',
    dayColumn: 'samedi',
    timeSlot: 0,
  },
  {
    id: 'mata-20',
    content: '📞 Service client disponible 7j/7 ! Notre équipe est là pour vous conseiller et répondre à toutes vos questions. Contactez-nous ! #ServiceClient #Conseils #MataViande',
    scheduledTime: new Date(2025, 0, 11, 15, 30),
    platforms: ['facebook', 'linkedin'],
    status: 'scheduled',
    author: 'Mata Viande',
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