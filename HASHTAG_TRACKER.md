# 🏷️ Hashtag Performance Tracker - Postelma

## **📋 Vue d'ensemble**

Le Hashtag Performance Tracker est une fonctionnalité avancée d'analyse des hashtags qui permet d'optimiser la stratégie de contenu en analysant les performances, en suggérant des hashtags intelligents et en gérant des sets de hashtags prédéfinis.

## **🚀 Fonctionnalités Principales**

### **1. Analyse des Performances**
- **Extraction automatique** des hashtags depuis les posts
- **Calcul d'engagement** basé sur likes, comments, shares, views
- **Analyse de tendance** (croissance, baisse, stable)
- **Classification par performance** (high, medium, low)
- **Métriques détaillées** : reach, impressions, clicks

### **2. Interface Utilisateur Complète**
- **Top Performers** : Grid de cards avec les meilleurs hashtags
- **Tableau complet** : Tous les hashtags avec filtres et tri
- **Hashtag Sets** : Bibliothèque de sets prédéfinis
- **Suggestions IA** : Hashtags intelligents basés sur le contenu

### **3. Intégration PostCreationModal**
- **Suggestions en temps réel** lors de la création de posts
- **Sets de hashtags** disponibles via dropdown
- **Auto-complétion** quand l'utilisateur tape #
- **Top 5 du moment** avec métriques d'engagement

## **🏗️ Architecture Technique**

### **Service d'Analyse (hashtagAnalytics.ts)**
```typescript
export class HashtagAnalyticsService {
  /**
   * Extrait tous les hashtags d'un caption
   */
  static extractHashtags(caption: string): string[] {
    const hashtagRegex = /#[\w\u00c0-\u017f\u0100-\u017f\u0180-\u024f\u1e00-\u1eff]+/gi;
    return caption.match(hashtagRegex) || [];
  }

  /**
   * Calcule les performances de tous les hashtags
   */
  static calculateHashtagPerformance(posts: Post[]): HashtagStats[] {
    // Analyse complète des performances
    // Calcul d'engagement, reach, tendances
    // Classification par performance
  }

  /**
   * Génère des suggestions intelligentes
   */
  static generateHashtagSuggestions(
    content: string, 
    platform: SocialPlatform, 
    existingHashtags: string[] = []
  ): HashtagSuggestion[] {
    // Suggestions basées sur le contenu
    // Hashtags populaires par plateforme
    // Analyse des mots-clés
  }
}
```

### **Types TypeScript Stricts**
```typescript
interface HashtagStats {
  tag: string;
  usageCount: number;
  avgEngagement: number;
  avgReach: number;
  trend: 'up' | 'down' | 'stable';
  lastUsed: Date;
  performance: 'high' | 'medium' | 'low';
  platforms: SocialPlatform[];
  relatedHashtags: string[];
  engagementRate: number;
  reachRate: number;
}

interface HashtagSet {
  id: string;
  name: string;
  description: string;
  hashtags: string[];
  category: 'engagement' | 'reach' | 'sales' | 'awareness' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  avgEngagement: number;
  totalUsage: number;
}

interface HashtagSuggestion {
  hashtag: string;
  reason: string;
  confidence: number;
  category: string;
  expectedEngagement: number;
  relatedHashtags: string[];
}
```

### **Hooks Personnalisés (useHashtagStats.ts)**
```typescript
export const useHashtagStats = (
  posts: any[] = [],
  filters: HashtagFilters = {}
): HashtagAnalytics => {
  // Analyse complète des hashtags
  // Filtrage et tri
  // Calcul des métriques globales
};

export const useHashtagSuggestions = (
  content: string,
  platform: SocialPlatform | null,
  existingHashtags: string[] = []
): HashtagSuggestion[] => {
  // Suggestions intelligentes
  // Basées sur le contenu et la plateforme
};

export const useHashtagSets = (initialSets: HashtagSet[] = []) => {
  // Gestion des sets de hashtags
  // CRUD operations
};
```

## **📊 Interface Utilisateur**

### **Page HashtagTracker (/hashtags)**
```
┌─────────────────────────────────────────┐
│ 🏷️ Hashtag Performance Tracker         │
├─────────────────────────────────────────┤
│ [Métriques Globales - 4 Cards]          │
├─────────────────────────────────────────┤
│ [Onglets: Top Performers | Tous | Sets] │
├─────────────────────────────────────────┤
│ Top Performers:                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│ │ #tag│ │ #tag│ │ #tag│ │ #tag│          │
│ │ 4.2%│ │ 3.8%│ │ 3.5%│ │ 3.2%│          │
│ └─────┘ └─────┘ └─────┘ └─────┘          │
├─────────────────────────────────────────┤
│ Tous les Hashtags:                     │
│ [Filtres] [Recherche] [Tri]            │
│ ┌─────────────────────────────────────┐ │
│ │ Hashtag | Usage | Engagement | ... │ │
│ │ #marketing | 15 | 4.2% | ↗️ | ... │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Hashtag Sets:                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ │Engagement│ │  Reach  │ │  Sales  │     │
│ │ 5 tags  │ │ 5 tags  │ │ 5 tags  │     │
│ └─────────┘ └─────────┘ └─────────┘     │
└─────────────────────────────────────────┘
```

### **Intégration PostCreationModal**
```
┌─────────────────────────────────────────┐
│ 🏷️ Hashtags suggérés [IA]              │
├─────────────────────────────────────────┤
│ Top 5 du moment:                        │
│ [#marketing 4.2%] [#digital 3.8%] ...  │
├─────────────────────────────────────────┤
│ Utiliser un set:                       │
│ [Dropdown: Engagement (5 hashtags)]    │
│ [Ajouter]                              │
├─────────────────────────────────────────┤
│ Plus de suggestions:                   │
│ [#business] [#startup] [#innovation]   │
├─────────────────────────────────────────┤
│ 💡 Tapez # pour l'auto-complétion      │
└─────────────────────────────────────────┘
```

## **🎨 Design System**

### **Couleurs et Badges**
- **Vert** : Performance élevée (high)
- **Jaune** : Performance moyenne (medium)
- **Rouge** : Performance faible (low)
- **Bleu** : Hashtags suggérés
- **Violet** : Sets de hashtags

### **Icônes Lucide**
- **Hash** : Hashtags
- **TrendingUp** : Tendance positive
- **Copy** : Copier hashtag
- **Plus** : Ajouter hashtag
- **BarChart3** : Analytics
- **Eye** : Voir détails

### **Graphiques Recharts**
- **SparklineChart** : Tendance mini
- **BarChart** : Engagement par heure
- **LineChart** : Évolution temporelle

## **📈 Données Mock**

### **Hashtags Populaires par Plateforme**
```typescript
const platformHashtags = {
  instagram: [
    '#instagood', '#photooftheday', '#fashion', '#beautiful', '#happy',
    '#cute', '#tbt', '#like4like', '#followme', '#picoftheday'
  ],
  linkedin: [
    '#linkedin', '#career', '#business', '#networking', '#professional',
    '#leadership', '#innovation', '#success', '#motivation', '#entrepreneur'
  ],
  facebook: [
    '#facebook', '#news', '#viral', '#trending', '#community',
    '#local', '#business', '#events', '#life', '#family'
  ],
  twitter: [
    '#twitter', '#trending', '#news', '#viral', '#tech',
    '#politics', '#sports', '#entertainment', '#lifestyle', '#innovation'
  ],
  tiktok: [
    '#tiktok', '#fyp', '#viral', '#dance', '#comedy',
    '#trending', '#foryou', '#fun', '#music', '#creative'
  ],
  youtube: [
    '#youtube', '#video', '#tutorial', '#review', '#entertainment',
    '#education', '#music', '#gaming', '#lifestyle', '#tech'
  ]
};
```

### **Sets Prédéfinis**
```typescript
const defaultHashtagSets = [
  {
    name: 'Engagement',
    hashtags: ['#engagement', '#community', '#interaction', '#feedback', '#discussion'],
    category: 'engagement',
    avgEngagement: 4.2
  },
  {
    name: 'Reach',
    hashtags: ['#viral', '#trending', '#popular', '#discover', '#explore'],
    category: 'reach',
    avgEngagement: 3.8
  },
  {
    name: 'Vente',
    hashtags: ['#sale', '#offer', '#deal', '#promotion', '#buy'],
    category: 'sales',
    avgEngagement: 2.9
  },
  {
    name: 'Awareness',
    hashtags: ['#brand', '#company', '#business', '#professional', '#quality'],
    category: 'awareness',
    avgEngagement: 3.5
  }
];
```

## **🔧 Fonctionnalités Avancées**

### **1. Analyse des Combinaisons**
```typescript
static analyzeHashtagCombinations(posts: Post[]): Array<{
  combination: string[];
  avgEngagement: number;
  usageCount: number;
}> {
  // Analyse des hashtags qui fonctionnent ensemble
  // Exemple: #marketing + #digital = +23% engagement
}
```

### **2. Suggestions Intelligentes**
- **Basées sur le contenu** : Extraction des mots-clés
- **Hashtags populaires** : Par plateforme
- **Co-occurrence** : Hashtags qui apparaissent ensemble
- **Tendances** : Hashtags en croissance

### **3. Gestion des Sets**
- **Création** : Nouveaux sets personnalisés
- **Modification** : Ajout/suppression de hashtags
- **Statistiques** : Performance du set
- **Partage** : Export/import de sets

## **📱 Responsive Design**

### **Mobile (< 768px)**
- **Cards empilées** : Top performers en colonne
- **Tableau scrollable** : Horizontal scroll
- **Boutons compacts** : Actions réduites
- **Navigation simplifiée** : Onglets adaptés

### **Tablet (768px - 1024px)**
- **Grid 2x2** : Top performers
- **Tableau optimisé** : Colonnes essentielles
- **Filtres compacts** : Dropdowns empilés

### **Desktop (> 1024px)**
- **Grid 3x3** : Top performers
- **Tableau complet** : Toutes les colonnes
- **Filtres étendus** : Recherche + filtres
- **Graphiques détaillés** : Visualisations complètes

## **🚀 Intégration Future**

### **Phase 1 - APIs Réelles**
- **Instagram Basic Display API** : Métriques réelles
- **Facebook Graph API** : Données de reach
- **LinkedIn API** : Analytics professionnels
- **Twitter API v2** : Engagement détaillé

### **Phase 2 - IA Avancée**
- **Machine Learning** : Prédictions de performance
- **NLP** : Analyse sémantique du contenu
- **Recommandations** : Hashtags optimaux
- **A/B Testing** : Tests automatiques

### **Phase 3 - Collaboration**
- **Équipes** : Partage de sets
- **Commentaires** : Feedback sur hashtags
- **Historique** : Suivi des changements
- **Export** : Rapports détaillés

## **🧪 Tests et Validation**

### **Tests Fonctionnels**
1. **Extraction de hashtags** : Regex et normalisation
2. **Calcul d'engagement** : Formules et métriques
3. **Filtrage et tri** : Performance et exactitude
4. **Suggestions IA** : Pertinence et diversité

### **Tests d'Interface**
1. **Responsive** : Toutes les tailles d'écran
2. **Navigation** : Onglets et filtres
3. **Interactions** : Boutons et dropdowns
4. **Graphiques** : Rendu et performance

### **Tests d'Intégration**
1. **PostCreationModal** : Suggestions en temps réel
2. **Routing** : Navigation entre pages
3. **State Management** : Persistance des données
4. **Performance** : Chargement et réactivité

## **📊 Métriques de Succès**

### **KPIs Utilisateur**
- **Taux d'utilisation** des suggestions
- **Amélioration de l'engagement** des posts
- **Satisfaction** utilisateur
- **Temps de création** de post

### **KPIs Techniques**
- **Précision** des suggestions
- **Performance** des algorithmes
- **Disponibilité** du service
- **Temps de réponse** des analyses

## **🔒 Sécurité et Confidentialité**

### **Données Sensibles**
- **Hashtags** : Pas de données personnelles
- **Métriques** : Anonymisées
- **Sets** : Propriété utilisateur
- **Suggestions** : Basées sur des patterns généraux

### **Conformité**
- **RGPD** : Consentement utilisateur
- **APIs sociales** : Respect des ToS
- **Données personnelles** : Protection maximale

## **📚 Documentation API**

### **Endpoints Principaux**
```typescript
// Analyse des hashtags
POST /api/hashtags/analyze
Body: { posts: Post[] }
Response: { hashtagStats: HashtagStats[] }

// Suggestions
POST /api/hashtags/suggestions
Body: { content: string, platform: string }
Response: { suggestions: HashtagSuggestion[] }

// Sets de hashtags
GET /api/hashtags/sets
Response: { sets: HashtagSet[] }

POST /api/hashtags/sets
Body: { name: string, hashtags: string[] }
Response: { set: HashtagSet }
```

### **Webhooks N8N**
```typescript
// Analyse en temps réel
POST https://malick000.app.n8n.cloud/webhook/hashtag-analysis
Body: { postId: string, content: string, platform: string }

// Suggestions IA
POST https://malick000.app.n8n.cloud/webhook/hashtag-suggestions
Body: { content: string, platform: string, existingHashtags: string[] }
```

---

*Hashtag Performance Tracker implémenté avec succès ! 🎉*
*Analyse intelligente des hashtags*
*Suggestions IA en temps réel*
*Interface utilisateur complète*
*Intégration PostCreationModal fonctionnelle*
