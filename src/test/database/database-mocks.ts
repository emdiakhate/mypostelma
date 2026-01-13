/**
 * Database Mocks - Données mock basées sur DATABASE_SCHEMA_COMPLETE.md
 *
 * Utilisé pour les tests unitaires et l'environnement de développement
 */

export const mockProfiles = {
  user1: {
    id: 'uuid-user-1',
    email: 'user1@test.com',
    name: 'John Doe',
    avatar: 'https://example.com/avatar1.jpg',
    is_active: true,
    beta_user: false,
    lead_generation_count: 3,
    lead_generation_limit: 5,
    ai_image_generation_count: 8,
    ai_image_generation_limit: 15,
    ai_video_generation_count: 2,
    ai_video_generation_limit: 5,
    quota_reset_date: new Date('2026-02-01'),
    posts_unlimited: true,
    last_login: new Date('2026-01-13'),
    created_at: new Date('2025-06-01'),
  },
};

export const mockUserRoles = {
  adminRole: {
    id: 'uuid-role-1',
    user_id: 'uuid-user-1',
    role: 'admin',
    created_at: new Date(),
  },
};

export const mockSubscriptions = {
  premiumSub: {
    id: 'uuid-sub-1',
    user_id: 'uuid-user-1',
    plan_type: 'premium',
    status: 'active',
    beta_user: false,
    trial_ends_at: null,
    created_at: new Date('2025-06-01'),
    updated_at: new Date(),
  },
};

export const mockCrmSectors = {
  techSector: {
    id: 'uuid-sector-tech',
    user_id: 'uuid-user-1',
    name: 'Technologie',
    description: 'Secteur technologique et IT',
    icon: 'laptop',
    color: '#3B82F6',
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockLeads = {
  lead1: {
    id: 'uuid-lead-1',
    user_id: 'uuid-user-1',
    name: 'TechCorp SARL',
    category: 'B2B',
    address: '15 Avenue des Champs',
    city: 'Dakar',
    postal_code: '10200',
    phone: '+221 77 123 4567',
    email: 'contact@techcorp.sn',
    website: 'https://techcorp.sn',
    whatsapp: '+221 77 123 4567',
    status: 'qualified',
    score: 85,
    sector_id: 'uuid-sector-tech',
    segment_id: null,
    tags: ['VIP', 'Prospect chaud'],
    notes: 'Intéressé par nos services',
    source: 'linkedin',
    google_rating: 4.5,
    google_reviews_count: 127,
    social_media: { facebook: 'techcorp', linkedin: 'company/techcorp' },
    business_hours: { monday: '08:00-18:00', friday: '08:00-17:00' },
    metrics: { employees: 50, revenue: '500M XOF' },
    last_contacted_at: new Date('2026-01-10'),
    added_at: new Date('2025-12-01'),
    created_at: new Date('2025-12-01'),
    updated_at: new Date(),
  },
};

export const mockPosts = {
  post1: {
    id: 'uuid-post-1',
    author_id: 'uuid-user-1',
    content: 'Découvrez notre nouvelle offre! #promo #tech',
    captions: {
      instagram: 'Nouvelle offre 🚀 #tech',
      facebook: 'Découvrez notre nouvelle offre!',
    },
    platforms: ['instagram', 'facebook'],
    accounts: ['account-ig-1', 'account-fb-1'],
    images: ['https://storage.com/image1.jpg'],
    video: null,
    status: 'scheduled',
    scheduled_time: new Date('2026-01-15T14:00:00'),
    campaign: 'Lancement Produit',
    campaign_color: '#10B981',
    sentiment_score: 0.85,
    sentiment_label: 'positive',
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockCompetitors = {
  competitor1: {
    id: 'uuid-competitor-1',
    user_id: 'uuid-user-1',
    name: 'Concurrent Tech SA',
    industry: 'Technology',
    description: 'Leader du marché logiciel',
    website_url: 'https://concurrenttech.com',
    instagram_url: 'https://instagram.com/concurrenttech',
    instagram_followers: '15.3K',
    facebook_url: 'https://facebook.com/concurrenttech',
    facebook_likes: '22.1K',
    analysis_count: 3,
    last_analyzed_at: new Date('2026-01-10'),
    added_at: new Date('2025-10-01'),
  },
};

export const mockConversations = {
  conv1: {
    id: 'uuid-conv-1',
    user_id: 'uuid-user-1',
    connected_account_id: 'uuid-account-1',
    platform: 'instagram',
    platform_conversation_id: 'ig_thread_12345',
    participant_id: 'ig_user_67890',
    participant_name: 'Jean Dupont',
    participant_username: '@jeandupont',
    status: 'unread',
    sentiment: 'positive',
    tags: ['vip'],
    notes: 'Client intéressé par le produit Premium',
    assigned_to: null,
    last_message_at: new Date(),
    created_at: new Date('2026-01-10'),
    updated_at: new Date(),
  },
};

export const mockVenteProducts = {
  product1: {
    id: 'uuid-product-1',
    user_id: 'uuid-user-1',
    name: 'Ordinateur Portable HP',
    description: 'Ordinateur portable 15 pouces, Intel i5, 8GB RAM',
    type: 'product',
    category: 'Informatique',
    unit: 'unité',
    price: 450000,
    cost: 350000,
    stock: 25,
    sku: 'HP-LAP-001',
    status: 'active',
    is_stockable: true,
    track_inventory: true,
    min_stock_quantity: 5,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockVenteQuotes = {
  quote1: {
    id: 'uuid-quote-1',
    user_id: 'uuid-user-1',
    number: 'DEV-2026-001',
    client_name: 'TechCorp SARL',
    client_email: 'contact@techcorp.sn',
    client_phone: '+221 77 123 4567',
    status: 'sent',
    total_ht: 500000,
    total_ttc: 590000,
    tva_rate: 0.18,
    valid_until: new Date('2026-02-15'),
    notes: 'Offre valable 30 jours',
    sent_at: new Date('2026-01-15'),
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockVenteOrders = {
  order1: {
    id: 'uuid-order-1',
    user_id: 'uuid-user-1',
    quote_id: 'uuid-quote-1',
    warehouse_id: 'uuid-warehouse-1',
    number: 'CMD-2026-001',
    client_name: 'TechCorp SARL',
    client_email: 'contact@techcorp.sn',
    status: 'confirmed',
    payment_status: 'paid',
    moyen_paiement: 'bank_transfer',
    total_ht: 900000,
    total_ttc: 1062000,
    tva_rate: 0.18,
    tracking_number: 'TRK-2026-001',
    confirmed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockComptaInvoices = {
  invoice1: {
    id: 'uuid-invoice-1',
    user_id: 'uuid-user-1',
    client_id: 'uuid-lead-1',
    invoice_number: 'FAC-2026-001',
    status: 'sent',
    currency: 'XOF',
    issue_date: new Date('2026-01-15'),
    due_date: new Date('2026-02-15'),
    subtotal: 500000,
    tax_rate: 18.00,
    tax_amount: 90000,
    total: 590000,
    amount_paid: 0,
    balance_due: 590000,
    terms: 'Paiement à 30 jours',
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockStockWarehouses = {
  warehouse1: {
    id: 'uuid-warehouse-1',
    user_id: 'uuid-user-1',
    name: 'Entrepôt Principal Dakar',
    type: 'WAREHOUSE',
    address: 'Zone Industrielle',
    city: 'Dakar',
    postal_code: '10200',
    country: 'Senegal',
    phone: '+221 33 123 4567',
    manager_name: 'Mamadou Diop',
    is_active: true,
    is_default: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockStockMovements = {
  movement1: {
    id: 'uuid-movement-1',
    user_id: 'uuid-user-1',
    product_id: 'uuid-product-1',
    warehouse_id: 'uuid-warehouse-1',
    movement_type: 'IN',
    quantity: 50,
    unit_cost: 350000,
    total_cost: 17500000,
    reference_type: 'purchase_order',
    reference_id: 'PO-2026-001',
    reason: 'Réception commande fournisseur',
    performed_by: 'Magasinier',
    movement_date: new Date(),
    created_at: new Date(),
  },
};

export const mockSuppliers = {
  supplier1: {
    id: 'uuid-supplier-1',
    user_id: 'uuid-user-1',
    name: 'Distributeur Tech SARL',
    company: 'Distributeur Tech SARL',
    email: 'contact@distributeurtech.sn',
    phone: '+221 33 865 4321',
    address: 'Avenue Malick Sy',
    city: 'Dakar',
    country: 'Sénégal',
    tax_number: 'NIF-123456789',
    payment_terms: 'Net 30 jours',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockCaisses = {
  caisse1: {
    id: 'uuid-caisse-1',
    user_id: 'uuid-user-1',
    warehouse_id: 'uuid-warehouse-1',
    date: new Date('2026-01-15'),
    statut: 'ouverte',
    solde_ouverture: 50000,
    solde_theorique: 50000,
    heure_ouverture: new Date('2026-01-15T08:00:00'),
    ouvert_par: 'uuid-cashier-1',
    notes_ouverture: 'Caisse ouverte normalement',
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockMouvementsCaisse = {
  mouvement1: {
    id: 'uuid-mouvement-1',
    caisse_id: 'uuid-caisse-1',
    user_id: 'uuid-user-1',
    type: 'vente',
    montant: 120000,
    moyen_paiement: 'especes',
    reference_type: 'vente_order',
    reference_id: 'uuid-order-1',
    description: 'Vente produit HP Laptop',
    created_at: new Date(),
  },
};

export const mockTeams = {
  team1: {
    id: 'uuid-team-1',
    user_id: 'uuid-user-1',
    name: 'Équipe Support',
    description: 'Équipe dédiée au support client',
    color: '#3B82F6',
    member_count: 5,
    conversation_count: 234,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

export const mockTeamMembers = {
  member1: {
    id: 'uuid-member-1',
    team_id: 'uuid-team-1',
    user_id: 'uuid-user-1',
    email: 'member@entreprise.com',
    role: 'member',
    status: 'active',
    invited_by: 'uuid-owner',
    invited_at: new Date('2025-12-01'),
    accepted_at: new Date('2025-12-02'),
    created_at: new Date(),
  },
};

export const mockCompanySettings = {
  settings1: {
    id: 'uuid-settings-1',
    user_id: 'uuid-user-1',
    company_name: 'Ma Super Entreprise SARL',
    address: '15 Avenue Pompidou',
    city: 'Dakar',
    postal_code: '10200',
    country: 'Sénégal',
    phone: '+221 33 123 4567',
    email: 'contact@masuperentreprise.sn',
    website: 'https://masuperentreprise.sn',
    siret: 'SN-123456789',
    tva_number: 'FR-TVA-987654321',
    bank_name: 'Banque Internationale du Sénégal',
    bank_iban: 'SN08 SN001 01234567890123',
    bank_bic: 'BISNSNDA',
    default_payment_terms: 'Paiement à 30 jours',
    invoice_prefix: 'FAC',
    quote_prefix: 'DEV',
    default_invoice_template: 'modern',
    default_quote_template: 'classic',
    created_at: new Date(),
    updated_at: new Date(),
  },
};

// Export all mocks as a single object
export const databaseMocks = {
  profiles: mockProfiles,
  userRoles: mockUserRoles,
  subscriptions: mockSubscriptions,
  crmSectors: mockCrmSectors,
  leads: mockLeads,
  posts: mockPosts,
  competitors: mockCompetitors,
  conversations: mockConversations,
  venteProducts: mockVenteProducts,
  venteQuotes: mockVenteQuotes,
  venteOrders: mockVenteOrders,
  comptaInvoices: mockComptaInvoices,
  stockWarehouses: mockStockWarehouses,
  stockMovements: mockStockMovements,
  suppliers: mockSuppliers,
  caisses: mockCaisses,
  mouvementsCaisse: mockMouvementsCaisse,
  teams: mockTeams,
  teamMembers: mockTeamMembers,
  companySettings: mockCompanySettings,
};
