import { Lead } from '@/types/leads';

export const mockLeads: Lead[] = [
  // Lead avec email, téléphone et réseaux sociaux
  {
    id: 'lead-1',
    name: 'Le Bistrot du Coin',
    category: 'restaurant',
    address: '15 Rue de la République',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0478519208',
    email: 'contact@lebistrotducoin.com',
    website: 'https://lebistrotducoin.com',
    socialMedia: {
      instagram: 'bistrotducoin',
      facebook: 'https://facebook.com/bistrotducoin'
    },
    metrics: {
      instagramFollowers: 2400,
      facebookLikes: 1800
    },
    status: 'new',
    notes: '',
    tags: [],
    addedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec email et réseaux sociaux, SANS téléphone
  {
    id: 'lead-2',
    name: 'Salon Coiffure Élégance',
    category: 'salon',
    address: '28 Avenue Jean Jaurès',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: null,
    email: 'contact@saloncoiffureelegance.com',
    website: null,
    socialMedia: {
      linkedin: 'https://linkedin.com/in/salonelegance',
      twitter: 'https://twitter.com/salonelegance'
    },
    metrics: {
      linkedinFollowers: 890,
      twitterFollowers: 450
    },
    status: 'new',
    notes: '',
    tags: [],
    addedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec téléphone et réseaux sociaux, SANS email
  {
    id: 'lead-3',
    name: 'Coach Sportif Pro',
    category: 'coach',
    address: '42 Rue du Stade',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0640263628',
    email: null,
    website: 'https://coachsportifpro.com',
    socialMedia: {
      facebook: 'https://facebook.com/coachsportifpro',
      twitter: 'https://twitter.com/coachsportifpro'
    },
    metrics: {
      facebookLikes: 5600,
      twitterFollowers: 1200
    },
    status: 'contacted',
    notes: '',
    tags: ['premium'],
    addedAt: new Date('2025-01-04'),
    lastContactedAt: new Date('2025-01-06'),
    source: 'google_maps'
  },
  // Lead avec téléphone et email, SANS réseaux sociaux
  {
    id: 'lead-4',
    name: 'Boutique Mode Chic',
    category: 'boutique',
    address: '7 Place de la Mairie',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0148562341',
    email: 'contact@boutiquemodechic.com',
    website: 'https://boutiquemodechic.com',
    socialMedia: null,
    metrics: null,
    status: 'new',
    notes: '',
    tags: [],
    addedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec email uniquement
  {
    id: 'lead-5',
    name: 'Service à Domicile Plus',
    category: 'service',
    address: '23 Rue des Lilas',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: null,
    email: 'contact@servicedomicileplus.com',
    website: 'https://servicedomicileplus.com',
    socialMedia: null,
    metrics: null,
    status: 'interested',
    notes: 'Intéressé par nos services de marketing digital',
    tags: ['hot_lead'],
    addedAt: new Date('2025-01-03'),
    lastContactedAt: new Date('2025-01-07'),
    source: 'google_maps'
  },
  // Lead avec téléphone uniquement
  {
    id: 'lead-6',
    name: 'Restaurant Gastronomique',
    category: 'restaurant',
    address: '12 Boulevard de la Paix',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0148567890',
    email: null,
    website: 'https://restaurantgastronomique.com',
    socialMedia: null,
    metrics: null,
    status: 'client',
    notes: 'Client depuis 2 mois, très satisfait',
    tags: ['vip_client'],
    addedAt: new Date('2025-01-01'),
    lastContactedAt: new Date('2025-01-08'),
    source: 'google_maps'
  },
  // Lead avec réseaux sociaux uniquement
  {
    id: 'lead-7',
    name: 'Institut de Beauté Zen',
    category: 'salon',
    address: '35 Rue de la Gare',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: null,
    email: null,
    website: null,
    socialMedia: {
      linkedin: 'https://linkedin.com/company/institutbeautezen'
    },
    metrics: {
      linkedinFollowers: 1200
    },
    status: 'new',
    notes: '',
    tags: [],
    addedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec tout (email, téléphone, réseaux sociaux)
  {
    id: 'lead-8',
    name: 'Gym Fitness Center',
    category: 'coach',
    address: '8 Avenue des Sports',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0148561234',
    email: 'info@gymfitnesscenter.com',
    website: 'https://gymfitnesscenter.com',
    socialMedia: {
      instagram: 'gym_fitness_center',
      facebook: 'https://facebook.com/gymfitnesscenter',
      linkedin: 'https://linkedin.com/company/gymfitnesscenter'
    },
    metrics: {
      instagramFollowers: 4500,
      facebookLikes: 3200,
      linkedinFollowers: 680
    },
    status: 'contacted',
    notes: 'Premier contact effectué, en attente de réponse',
    tags: ['follow_up'],
    addedAt: new Date('2025-01-04'),
    lastContactedAt: new Date('2025-01-06'),
    source: 'google_maps'
  },
  // Lead avec téléphone et réseaux sociaux
  {
    id: 'lead-9',
    name: 'Boulangerie Artisanale',
    category: 'restaurant',
    address: '19 Rue du Commerce',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0148569876',
    email: null,
    website: null,
    socialMedia: {
      instagram: 'boulangerie_artisanale'
    },
    metrics: {
      instagramFollowers: 950
    },
    status: 'new',
    notes: '',
    tags: [],
    addedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec email et réseaux sociaux
  {
    id: 'lead-10',
    name: 'Café Culturel',
    category: 'restaurant',
    address: '31 Rue de la Culture',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: null,
    email: 'contact@cafeculturel.com',
    website: 'https://cafeculturel.com',
    socialMedia: {
      facebook: 'https://facebook.com/cafeculturel',
      linkedin: 'https://linkedin.com/company/cafeculturel'
    },
    metrics: {
      facebookLikes: 2800,
      linkedinFollowers: 1500
    },
    status: 'not_interested',
    notes: 'Pas intéressé par nos services pour le moment',
    tags: ['not_interested'],
    addedAt: new Date('2025-01-02'),
    lastContactedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec email et téléphone
  {
    id: 'lead-11',
    name: 'Agence Immobilière Premium',
    category: 'service',
    address: '45 Avenue des Champs',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0148567891',
    email: 'contact@agenceimmopremium.com',
    website: 'https://agenceimmopremium.com',
    socialMedia: null,
    metrics: null,
    status: 'interested',
    notes: 'Très intéressé par nos services, demande de devis',
    tags: ['hot_lead', 'quote_requested'],
    addedAt: new Date('2025-01-03'),
    lastContactedAt: new Date('2025-01-07'),
    source: 'google_maps'
  },
  // Lead sans aucune information de contact
  {
    id: 'lead-12',
    name: 'Pharmacie du Centre',
    category: 'service',
    address: '52 Rue de la Santé',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: null,
    email: null,
    website: null,
    socialMedia: null,
    metrics: null,
    status: 'new',
    notes: '',
    tags: [],
    addedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec email et réseaux sociaux
  {
    id: 'lead-13',
    name: 'Librairie Littéraire',
    category: 'boutique',
    address: '67 Rue des Livres',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: null,
    email: 'contact@librairielitteraire.com',
    website: 'https://librairielitteraire.com',
    socialMedia: {
      facebook: 'https://facebook.com/librairielitteraire',
      linkedin: 'https://linkedin.com/company/librairielitteraire'
    },
    metrics: {
      facebookLikes: 1800,
      linkedinFollowers: 900
    },
    status: 'new',
    notes: '',
    tags: [],
    addedAt: new Date('2025-01-05'),
    source: 'google_maps'
  },
  // Lead avec téléphone et réseaux sociaux
  {
    id: 'lead-14',
    name: 'Clinique Vétérinaire',
    category: 'service',
    address: '73 Rue des Animaux',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0148566789',
    email: null,
    website: 'https://cliniqueveterinaire.com',
    socialMedia: {
      instagram: 'clinique_veterinaire'
    },
    metrics: {
      instagramFollowers: 1200
    },
    status: 'contacted',
    notes: 'Contact initial, en attente de retour',
    tags: ['follow_up'],
    addedAt: new Date('2025-01-04'),
    lastContactedAt: new Date('2025-01-06'),
    source: 'google_maps'
  },
  // Lead avec tout (email, téléphone, réseaux sociaux)
  {
    id: 'lead-15',
    name: 'École de Danse Moderne',
    category: 'coach',
    address: '89 Rue de la Danse',
    city: 'Pierrefitte-sur-Seine',
    postalCode: '93380',
    phone: '0148563456',
    email: 'info@ecoledansemoderne.com',
    website: 'https://ecoledansemoderne.com',
    socialMedia: {
      instagram: 'ecole_danse_moderne',
      facebook: 'https://facebook.com/ecoledansemoderne',
      linkedin: 'https://linkedin.com/company/ecoledansemoderne'
    },
    metrics: {
      instagramFollowers: 3200,
      facebookLikes: 2400,
      linkedinFollowers: 350
    },
    status: 'interested',
    notes: 'Intéressé par nos services de communication',
    tags: ['hot_lead'],
    addedAt: new Date('2025-01-03'),
    lastContactedAt: new Date('2025-01-07'),
    source: 'google_maps'
  }
];