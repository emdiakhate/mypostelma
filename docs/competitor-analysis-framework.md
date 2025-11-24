# Framework d'Analyse Concurrentielle Étendu

## Vue d'ensemble

Ce document décrit le framework complet d'analyse concurrentielle utilisé dans Postelma. Ce framework permet une analyse approfondie et structurée des concurrents, ainsi qu'une comparaison avec le business de l'utilisateur pour fournir des recommandations actionnables.

## Structure du Framework

### 1. Contexte et Objectifs

**Objectif**: Établir le contexte de l'analyse et définir les objectifs stratégiques.

**Champs**:
- `brand_presentation` (string): Présentation rapide de la marque ou du concurrent (activité, histoire, positionnement actuel)
- `target_audience` (string): Cible principale (démographie, psychographie, besoins)
- `main_offering` (string): Offre principale (produits/services clés)
- `analysis_objectives` (string[]): Objectifs de l'analyse
  - Ex: "Mieux se positionner face à X"
  - Ex: "Préparer un lancement produit"
  - Ex: "Optimiser la communication digitale"

**Sources de données**:
- Site web (About, Mission, Vision)
- Réseaux sociaux (Bio, descriptions)
- Articles de presse

---

### 2. Identité de Marque

**Objectif**: Analyser l'univers visuel et le ton de communication de la marque.

#### 2.1 Univers Visuel

**Champs**:
- `logo_style` (string): Description du style du logo (moderne, classique, minimaliste, vintage, etc.)
- `primary_colors` (string[]): Couleurs principales utilisées (ex: ["Bleu marine", "Orange vif", "Blanc"])
- `typography` (string): Style typographique (serif, sans-serif, script, etc.)
- `image_style` (string): Style des images utilisées (photos lifestyle, illustrations, 3D, minimaliste, etc.)
- `visual_consistency` (string): Évaluation de la cohérence visuelle entre site web, réseaux sociaux et supports physiques

**Analyse requise**:
- Examiner le site web, les profils sociaux, les publications
- Identifier les patterns visuels récurrents
- Évaluer la cohérence de l'identité visuelle

#### 2.2 Ton et Messages Clés

**Champs**:
- `communication_tone` (string): Manière de parler
  - Options: "Formel", "Casual/Fun", "Expert/Technique", "Inspirant", "Humoristique", "Premium/Luxe"
- `main_promise` (string): Promesse principale de la marque
- `core_values` (string[]): Valeurs mises en avant
- `storytelling` (string): Narrative ou histoire de la marque

**Analyse requise**:
- Analyser le ton des publications sociales
- Identifier les messages récurrents
- Extraire la promesse de marque des communications

---

### 3. Analyse de l'Offre et du Positionnement

**Objectif**: Comprendre l'offre commerciale et le positionnement marché.

#### 3.1 Produits et Services

**Champs**:
- `product_range` (string[]): Liste des produits/services
- `price_levels` (string): Niveau de prix
  - Options: "Entrée de gamme", "Milieu de gamme", "Premium", "Luxe", "Variable"
- `differentiators` (string[]): Éléments différenciants clés
- `business_model` (string): Modèle économique
  - Options: "Abonnement", "One-shot", "Freemium", "Commission", "Licence", "Hybride"

#### 3.2 Positionnement

**Champs**:
- `segment` (string): Segment visé (entrée de gamme, premium, niche, mass market)
- `target_personas` (string[]): Personas cibles détaillées
- `value_proposition` (string): Proposition de valeur unique
- `vs_competitors` (string): Positionnement par rapport aux concurrents directs

**Analyse requise**:
- Examiner les pages produits/services
- Analyser les prix (si disponibles)
- Identifier les USP (Unique Selling Propositions)

---

### 4. Présence Digitale et Marketing

**Objectif**: Évaluer la présence digitale et l'efficacité du marketing en ligne.

#### 4.1 Site Web

**Champs**:
- `ux_quality` (number 1-10): Qualité de l'expérience utilisateur
- `user_journey_clarity` (string): Clarté du parcours utilisateur
- `content_quality` (string): Qualité des contenus (détaillés, superficiels, techniques, etc.)
- `loading_speed` (string): Vitesse de chargement perçue
- `seo_basics`:
  - `structure` (string): Structure SEO (titres, meta, URLs)
  - `keywords` (string[]): Mots-clés visibles/ciblés
  - `has_blog` (boolean): Présence d'un blog

**Métriques à évaluer**:
- Navigation intuitive (oui/non)
- Clarté des CTA (call-to-actions)
- Qualité du contenu (profondeur, originalité)

#### 4.2 Réseaux Sociaux

**Champs**:
- `platforms_used` (string[]): Plateformes actives
- `posting_frequency` (object): Fréquence de publication par plateforme
  - Ex: `{ "instagram": "2-3/jour", "linkedin": "3-5/semaine" }`
- `engagement_metrics` (object): Métriques d'engagement par plateforme
  - `likes_avg` (number): Moyenne de likes
  - `comments_avg` (number): Moyenne de commentaires
  - `shares_avg` (number): Moyenne de partages
  - `engagement_rate` (number): Taux d'engagement en %
- `content_types` (string[]): Types de contenu (photos produits, UGC, éducatif, divertissement, etc.)
- `brand_consistency` (string): Cohérence avec l'identité de marque

**Analyse requise**:
- Scraper ou analyser manuellement les derniers posts (10-20)
- Calculer les moyennes d'engagement
- Identifier les types de contenu les plus performants

---

### 5. Analyse SWOT

**Objectif**: Identifier forces, faiblesses, opportunités et menaces.

**Champs**:
- `strengths` (string[]): Forces
  - Ce que la marque fait mieux que les autres
  - Ex: "Forte communauté engagée", "Innovation produit", "Prix compétitifs"
- `weaknesses` (string[]): Faiblesses
  - Points faibles internes
  - Ex: "Site web lent", "Offre confuse", "Manque de preuves sociales"
- `opportunities` (string[]): Opportunités
  - Tendances marché ou comportements clients à saisir
  - Ex: "Nouveaux segments émergents", "Adoption de l'IA", "Nouveaux canaux (TikTok)"
- `threats` (string[]): Menaces
  - Nouveaux entrants, géants du secteur, risques réglementaires
  - Ex: "Amazon entre sur le marché", "Dépendance à Instagram", "Pression sur les prix"

**Méthodologie**:
1. Forces: Analyser les avantages compétitifs observés
2. Faiblesses: Identifier les gaps ou problèmes dans l'exécution
3. Opportunités: Analyser les tendances du secteur et les espaces vides
4. Menaces: Identifier les risques externes et la concurrence

---

### 6. Analyse Concurrentielle Directe

**Objectif**: Comparaison directe avec d'autres acteurs du marché.

**Champs**:
- `market_position` (string): Position sur le marché (leader, challenger, suiveur, niche)
- `market_share_estimate` (string): Estimation de part de marché (si possible)
- `advantages` (string[]): Avantages du concurrent
  - Où ils sont meilleurs que nous
- `disadvantages` (string[]): Inconvénients du concurrent
  - Où nous pouvons les dépasser

**Analyse requise**:
- Comparer sur les mêmes critères que le business de l'utilisateur
- Identifier les gaps concurrentiels
- Évaluer la position relative sur le marché

---

### 7. Insights et Recommandations

**Objectif**: Fournir des insights actionnables et des recommandations stratégiques.

#### 7.1 Insights Clés

**Champs**:
- `key_insights` (string[], 3-5 insights): Révélations principales de l'analyse
  - Ex: "La marque est forte sur l'image mais faible sur la conversion"
  - Ex: "Concurrent X domine Instagram mais néglige le SEO"
  - Ex: "Gap important sur le contenu éducatif"

#### 7.2 Recommandations Actionnables

**Champs**:
- `actionable_recommendations`:
  - `short_term` (string[]): Actions court terme (0-3 mois)
    - Ex: "Optimiser les CTA sur le site web"
    - Ex: "Lancer une campagne Instagram Reels"
  - `medium_term` (string[]): Actions moyen terme (3-6 mois)
    - Ex: "Développer un blog SEO-optimisé"
    - Ex: "Créer une ligne de produits premium"
  - `long_term` (string[]): Actions long terme (6-12 mois)
    - Ex: "Repositionnement de marque"
    - Ex: "Expansion internationale"

**Champs**:
- `priority_actions` (string[]): Top 3-5 actions prioritaires, indépendamment du timing

---

## 8. Métadonnées d'Analyse

**Champs**:
- `tokens_used` (number): Nombre de tokens utilisés par l'IA
- `analysis_cost` (number): Coût de l'analyse en euros
- `data_sources` (string[]): Sources de données utilisées
- `confidence_score` (number, 0-100): Score de confiance de l'analyse

---

## Analyse Comparative (Utilisateur vs Concurrents)

### Structure ComparativeAnalysis

#### Overall Comparison

**Champs**:
- `market_position` (string): Position de l'utilisateur par rapport aux concurrents
- `strengths_vs_competitors` (string[]): Forces par rapport aux concurrents
- `weaknesses_vs_competitors` (string[]): Points à améliorer
- `opportunities_identified` (string[]): Opportunités identifiées
- `threats_identified` (string[]): Menaces à surveiller

#### Domain Comparisons

Score de 0 à 100 pour chaque domaine avec explication:
- `brand_identity`: Score + comparaison textuelle
- `digital_presence`: Score + comparaison textuelle
- `content_strategy`: Score + comparaison textuelle
- `engagement`: Score + comparaison textuelle
- `seo_performance`: Score + comparaison textuelle

#### Personalized Recommendations

**Champs**:
- `quick_wins` (string[]): Actions rapides à fort impact
- `strategic_moves` (string[]): Mouvements stratégiques
- `areas_to_improve` (string[]): Domaines à améliorer en priorité
- `competitive_advantages` (string[]): Avantages compétitifs à exploiter

#### Data Insights

**Champs**:
- `vs_market_leader` (string): Comparaison avec le leader du marché
- `vs_average_competitor` (string): Comparaison avec la moyenne des concurrents
- `growth_potential` (string): Évaluation du potentiel de croissance
- `differentiation_opportunities` (string[]): Opportunités de différenciation

---

## Workflow d'Analyse Recommandé

### Étape 1: Collecte de Données
1. Scraper le site web (Jina.ai)
2. Scraper les profils sociaux (Apify)
3. Analyser les dernières publications (10-20 posts par plateforme)

### Étape 2: Analyse IA
1. Utiliser GPT-4o ou GPT-4o-mini pour analyser les données
2. Suivre le framework section par section
3. Générer des insights basés sur les données collectées

### Étape 3: Comparaison (si business de l'utilisateur configuré)
1. Comparer le business de l'utilisateur avec chaque concurrent
2. Identifier les gaps et opportunités
3. Générer des recommandations personnalisées

### Étape 4: Stockage
1. Sauvegarder l'analyse complète en JSONB
2. Mettre à jour last_analyzed_at et analysis_count
3. Générer une vue consolidée pour l'utilisateur

---

## Exemples de Prompts pour l'IA

### Prompt pour Context & Objectives
```
Analyze the following data about [Competitor Name] and provide:
1. Brand presentation (2-3 sentences about their activity, target, and main offering)
2. Target audience (who they serve)
3. Main offering (key products/services)
4. Suggest 2-3 analysis objectives based on their market position

Data: [Website content, social bios, etc.]
```

### Prompt pour Brand Identity
```
Analyze the visual identity and communication tone of [Competitor Name]:
1. Logo style and visual consistency across platforms
2. Primary colors used
3. Typography style
4. Image style (photos, illustrations, etc.)
5. Communication tone (formal, casual, expert, etc.)
6. Main promise and core values
7. Storytelling approach

Data: [Website screenshots, social posts, branding elements]
```

### Prompt pour SWOT
```
Based on the comprehensive data collected about [Competitor Name], provide a SWOT analysis:
- Strengths: What they do better than others (3-5 points)
- Weaknesses: Internal gaps or issues (3-5 points)
- Opportunities: Market trends they can leverage (3-5 points)
- Threats: External risks and competitive pressures (3-5 points)

Context: [Industry, market position, competitors]
Data: [All collected data]
```

---

## Bonnes Pratiques

1. **Précision**: Baser les analyses sur des données factuelles, pas des suppositions
2. **Actionabilité**: Toutes les recommandations doivent être actionnables
3. **Priorisation**: Identifier clairement les actions prioritaires
4. **Contexte**: Toujours contextualiser par rapport au marché et aux objectifs
5. **Mise à jour**: Re-analyser régulièrement (recommandé: tous les 1-3 mois)

---

## Limitations et Disclaimers

- Les données scrappées peuvent ne pas être à jour
- Les métriques d'engagement sont des estimations basées sur des échantillons
- Les parts de marché sont des estimations si non publiquement disponibles
- Le score de confiance reflète la qualité et quantité des données disponibles
