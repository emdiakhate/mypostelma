# 🎯 Competitive Intelligence - Postelma

## **📋 Vue d'ensemble**

La page Competitive Intelligence permet d'analyser les concurrents et d'adapter leurs meilleures stratégies de contenu. Elle offre une vue complète des performances des concurrents avec des insights IA pour optimiser votre propre stratégie.

## **🚀 Fonctionnalités Principales**

### **1. Liste des Concurrents**
- **3-5 concurrents configurables** avec nom, plateforme et @handle
- **Sélection dynamique** pour analyser un concurrent spécifique
- **Métriques principales** : followers, posts/semaine, engagement

### **2. Analyse Détaillée par Concurrent**

#### **📊 Métriques Principales**
- **Posts par semaine** : Fréquence de publication
- **Engagement moyen** : Performance des posts
- **Followers** : Taille de l'audience
- **Taux d'engagement** : Efficacité du contenu

#### **📱 Posts Récents**
- **Top 5 posts** avec métriques complètes
- **Likes, comments, shares, views** pour chaque post
- **Hashtags utilisés** avec visualisation
- **Bouton "Adapter"** pour chaque post

#### **📈 Analytics Avancés**
- **Graphique d'engagement** sur 30 jours (Recharts)
- **Hashtags populaires** avec barres de progression
- **Meilleurs horaires** de publication
- **Formats préférés** (image, carousel, reel)

#### **🤖 Insights IA**
- **Analyse du tone** : Professionnel/Casual/Inspirant/Vendeur
- **Longueur moyenne** des captions
- **Utilisation d'emojis** et CTAs
- **Formats de contenu** préférés

### **3. Actions Rapides**

#### **🔄 Adaptation de Stratégie**
- **Bouton "Adapter cette stratégie"** sur chaque post
- **Ouverture du PostCreationModal** pré-rempli
- **Caption réécrite** par IA (webhook N8N)
- **Même style d'image** (UGC/professionnel)
- **Horaire suggéré** basé sur les performances
- **Hashtags recommandés** du concurrent

## **🏗️ Architecture Technique**

### **Types TypeScript**
```typescript
interface CompetitorPost {
  id: string;
  content: string;
  image: string;
  publishedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  hashtags: string[];
  engagement: number;
}

interface CompetitorMetrics {
  postsPerWeek: number;
  avgEngagement: number;
  totalFollowers: number;
  engagementRate: number;
  topHashtags: { tag: string; count: number }[];
  bestPostingTimes: { hour: number; day: string; engagement: number }[];
  toneAnalysis: {
    tone: 'Professionnel' | 'Casual' | 'Inspirant' | 'Vendeur';
    avgCaptionLength: number;
    emojiUsage: number;
    ctaUsage: number;
    preferredFormats: { format: string; percentage: number }[];
  };
}

interface Competitor {
  id: string;
  name: string;
  platform: string;
  handle: string;
  avatar: string;
  bio: string;
  posts: CompetitorPost[];
  metrics: CompetitorMetrics;
  engagementHistory: { date: string; engagement: number }[];
}
```

### **Composants Utilisés**
- **Cards** : Affichage des concurrents et métriques
- **Tabs** : Navigation entre Posts/Analytics/Insights
- **Charts** : Graphiques Recharts pour visualisation
- **Badges** : Hashtags et indicateurs
- **Modal** : Adaptation de stratégie

## **📊 Données Mockées**

### **Concurrents Inclus**
1. **Social Media Pro** (@socialmediapro)
   - **Plateforme** : Instagram
   - **Followers** : 125k
   - **Posts/semaine** : 5
   - **Tone** : Professionnel
   - **Engagement** : 4.1%

2. **Content Creator Hub** (@contentcreatorhub)
   - **Plateforme** : Instagram
   - **Followers** : 89k
   - **Posts/semaine** : 7
   - **Tone** : Inspirant
   - **Engagement** : 4.8%

3. **Marketing Insights** (@marketinginsights)
   - **Plateforme** : LinkedIn
   - **Followers** : 45k
   - **Posts/semaine** : 3
   - **Tone** : Professionnel
   - **Engagement** : 2.9%

### **Données Réalistes**
- **Posts avec métriques** complètes (likes, comments, shares, views)
- **Hashtags populaires** avec compteurs
- **Historique d'engagement** sur 30 jours
- **Analyse du tone** détaillée
- **Formats préférés** avec pourcentages

## **🎨 Interface Utilisateur**

### **Design System**
- **Tailwind CSS** : Classes utilitaires
- **Shadcn/ui** : Composants cohérents
- **Responsive** : Mobile-first design
- **Couleurs** : Palette cohérente avec l'app

### **Layout**
```
┌─────────────────────────────────────────┐
│ Header: Competitive Intelligence        │
├─────────────────────────────────────────┤
│ Sélecteur de concurrents (Cards)        │
├─────────────────────────────────────────┤
│ Métriques principales (4 cards)         │
├─────────────────────────────────────────┤
│ Tabs: Posts | Analytics | Insights     │
│ ┌─────────────────────────────────────┐ │
│ │ Contenu selon l'onglet sélectionné  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **États Visuels**
- **Sélection** : Ring bleu + background
- **Hover** : Shadow + transition
- **Loading** : Skeleton states
- **Empty** : Messages informatifs

## **🔧 Intégration N8N**

### **Webhooks Configurés**
```typescript
// Adaptation de stratégie
const ADAPT_STRATEGY_WEBHOOK = 'https://malick000.app.n8n.cloud/webhook/adapt-strategy';

// Payload d'exemple
{
  originalPost: {
    content: string;
    hashtags: string[];
    engagement: number;
  },
  targetTone: 'Professionnel' | 'Casual' | 'Inspirant' | 'Vendeur';
  platform: 'Instagram' | 'LinkedIn' | 'Facebook';
}
```

### **Réponse Attendue**
```typescript
{
  success: boolean;
  adaptedContent: {
    caption: string;
    hashtags: string[];
    suggestedTime: string;
    suggestedDay: string;
    imageStyle: string;
  };
}
```

## **📱 Responsive Design**

### **Breakpoints**
- **Mobile** : < 768px (1 colonne)
- **Tablet** : 768px - 1024px (2 colonnes)
- **Desktop** : > 1024px (3+ colonnes)

### **Adaptations Mobile**
- **Cards empilées** verticalement
- **Graphiques redimensionnés** automatiquement
- **Navigation simplifiée** avec tabs
- **Boutons tactiles** optimisés

## **🚀 Roadmap Future**

### **Phase 1 - MVP (Actuel)**
- ✅ **Données mockées** réalistes
- ✅ **Interface complète** avec tous les composants
- ✅ **Actions rapides** fonctionnelles
- ✅ **Design responsive**

### **Phase 2 - Intégration APIs**
- 🔄 **APIs sociales** réelles (Instagram, LinkedIn, Facebook)
- 🔄 **Scraping automatisé** via N8N
- 🔄 **Synchronisation** en temps réel
- 🔄 **Alertes** de nouveaux posts

### **Phase 3 - IA Avancée**
- 🔄 **Analyse sémantique** des captions
- 🔄 **Détection de tendances** automatique
- 🔄 **Recommandations** personnalisées
- 🔄 **Prédictions** de performance

## **📚 Guide d'Ajout de Concurrents**

### **1. Ajouter un Nouveau Concurrent**
```typescript
const newCompetitor: Competitor = {
  id: '4',
  name: 'Nouveau Concurrent',
  platform: 'Instagram',
  handle: '@nouveauconcurrent',
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Description du concurrent...',
  posts: [/* Posts du concurrent */],
  metrics: {
    postsPerWeek: 4,
    avgEngagement: 3.5,
    totalFollowers: 75000,
    engagementRate: 2.8,
    topHashtags: [/* Hashtags populaires */],
    bestPostingTimes: [/* Meilleurs horaires */],
    toneAnalysis: {
      tone: 'Professionnel',
      avgCaptionLength: 150,
      emojiUsage: 70,
      ctaUsage: 40,
      preferredFormats: [/* Formats préférés */]
    }
  },
  engagementHistory: [/* Historique sur 30 jours */]
};
```

### **2. Configuration des APIs**
```typescript
// Configuration pour APIs réelles
const API_CONFIG = {
  instagram: {
    baseUrl: 'https://graph.instagram.com',
    accessToken: process.env.INSTAGRAM_TOKEN,
    fields: 'id,caption,media_type,media_url,like_count,comments_count'
  },
  linkedin: {
    baseUrl: 'https://api.linkedin.com/v2',
    accessToken: process.env.LINKEDIN_TOKEN,
    fields: 'id,text,created,likes,comments'
  }
};
```

### **3. Webhook N8N pour Scraping**
```typescript
// Configuration du webhook de scraping
const SCRAPING_WEBHOOK = 'https://malick000.app.n8n.cloud/webhook/scrape-competitor';

// Payload
{
  competitor: {
    handle: '@competitor',
    platform: 'Instagram',
    lastScraped: '2024-01-01T00:00:00Z'
  }
}
```

## **🧪 Tests et Validation**

### **Tests Fonctionnels**
1. **Sélection de concurrent** : Vérifier le changement d'affichage
2. **Navigation entre tabs** : Posts/Analytics/Insights
3. **Adaptation de stratégie** : Ouverture du modal
4. **Responsive** : Test sur différentes tailles d'écran

### **Tests de Performance**
1. **Chargement des graphiques** : Recharts optimisé
2. **Rendu des cards** : Lazy loading si nécessaire
3. **Navigation fluide** : Transitions CSS

### **Tests d'Intégration**
1. **Webhooks N8N** : Adaptation de stratégie
2. **APIs sociales** : Récupération de données
3. **Synchronisation** : Mise à jour automatique

## **📈 Métriques de Succès**

### **KPIs Utilisateur**
- **Temps passé** sur la page
- **Nombre d'adaptations** de stratégie
- **Taux de conversion** vers création de post
- **Satisfaction** utilisateur

### **KPIs Techniques**
- **Temps de chargement** < 2s
- **Taux d'erreur** < 1%
- **Disponibilité** > 99.9%
- **Performance** mobile > 90

## **🔒 Sécurité et Confidentialité**

### **Données Sensibles**
- **Tokens API** : Variables d'environnement
- **Données concurrents** : Chiffrement si nécessaire
- **Logs** : Anonymisation des données

### **Conformité**
- **RGPD** : Consentement utilisateur
- **APIs sociales** : Respect des ToS
- **Scraping** : Rate limiting et robots.txt

---

*Page Competitive Intelligence créée avec succès ! 🎉*
*Analyse des concurrents active*
*Actions rapides fonctionnelles*
*Interface complète et responsive*
