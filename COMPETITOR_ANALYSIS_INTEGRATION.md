# Intégration - Analyse de Concurrents

## 📦 Fichiers Créés

1. ✅ `n8n-workflow-competitor-analysis.json` - Workflow N8N complet
2. ✅ `supabase-competitor-schema.sql` - Schema base de données
3. ✅ Ce fichier - Guide d'intégration

---

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Postelma React App                                          │
│ ┌─────────────┐           ┌──────────────────┐            │
│ │ LeadsPage   │──────────→│ Marquer comme    │            │
│ │             │           │ concurrent       │            │
│ └─────────────┘           └──────────────────┘            │
│                                    │                        │
│                                    ↓                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ CompetitorsPage                                     │   │
│ │ - Liste des concurrents                             │   │
│ │ - Bouton "Analyser Stratégie"                       │   │
│ │ - Affichage résultats IA                            │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ POST /webhook/analyze-competitor
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ N8N Workflow (srv837294.hstgr.cloud)                        │
│ 1. Scrape Instagram (Puppeteer)                             │
│ 2. Scrape Facebook (Puppeteer)                              │
│ 3. Scrape LinkedIn (Puppeteer)                              │
│ 4. Scrape Website (Puppeteer)                               │
│ 5. Merge Data                                               │
│ 6. OpenAI Analysis (GPT-4o-mini)                            │
│ 7. Save to Supabase                                         │
│ 8. Return JSON                                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Supabase Database                                           │
│ - competitors table                                         │
│ - competitor_analysis table                                 │
│ - competitor_posts table                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Instructions

### 1. Créer les Tables Supabase (5 min)

Allez dans votre projet Supabase → SQL Editor → Nouvelle requête

```sql
-- Copier-coller le contenu de supabase-competitor-schema.sql
```

**Ou utilisez ce script minimal**:

```sql
-- Tables principales uniquement
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  industry TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  instagram_followers TEXT,
  facebook_likes TEXT,
  linkedin_followers TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ
);

CREATE TABLE competitor_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID REFERENCES competitors(id),
  positioning TEXT,
  content_strategy TEXT,
  tone TEXT,
  target_audience TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities_for_us TEXT[],
  social_media_presence TEXT,
  estimated_budget TEXT,
  key_differentiators TEXT[],
  recommendations TEXT,
  summary TEXT,
  instagram_data JSONB,
  facebook_data JSONB,
  linkedin_data JSONB,
  website_data JSONB,
  tokens_used INT,
  analysis_cost FLOAT,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Importer le Workflow N8N (5 min)

1. Connectez-vous à N8N: `https://n8n.srv837294.hstgr.cloud`
2. **Workflows** → **Import from File**
3. Uploadez `n8n-workflow-competitor-analysis.json`
4. Configurez les credentials:
   - OpenAI API
   - Supabase API (service_role_key)
5. **Activez** le workflow

**URL du webhook**: `https://n8n.srv837294.hstgr.cloud/webhook/analyze-competitor`

---

## 💻 Code React - Services

### `src/services/competitorAnalytics.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

const N8N_WEBHOOK_URL = 'https://n8n.srv837294.hstgr.cloud/webhook/analyze-competitor';

export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  website_url?: string;
  instagram_followers?: string;
  facebook_likes?: string;
  linkedin_followers?: string;
  added_at: string;
  last_analyzed_at?: string;
}

export interface CompetitorAnalysis {
  id: string;
  competitor_id: string;
  positioning: string;
  content_strategy: string;
  tone: string;
  target_audience: string;
  strengths: string[];
  weaknesses: string[];
  opportunities_for_us: string[];
  social_media_presence: string;
  estimated_budget: string;
  key_differentiators: string[];
  recommendations: string;
  summary: string;
  instagram_data?: any;
  facebook_data?: any;
  linkedin_data?: any;
  website_data?: any;
  tokens_used: number;
  analysis_cost: number;
  analyzed_at: string;
}

// Create a competitor
export const createCompetitor = async (competitorData: {
  name: string;
  industry?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  website_url?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('competitors')
    .insert({
      ...competitorData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data as Competitor;
};

// Get all competitors for current user
export const getCompetitors = async (): Promise<Competitor[]> => {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .order('added_at', { ascending: false });

  if (error) throw error;
  return data as Competitor[];
};

// Analyze competitor strategy (calls N8N webhook)
export const analyzeCompetitorStrategy = async (competitor: Competitor) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      competitor_id: competitor.id,
      user_id: user.id,
      name: competitor.name,
      instagram_url: competitor.instagram_url,
      facebook_url: competitor.facebook_url,
      linkedin_url: competitor.linkedin_url,
      website_url: competitor.website_url
    })
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
};

// Get latest analysis for a competitor
export const getLatestAnalysis = async (competitorId: string): Promise<CompetitorAnalysis | null> => {
  const { data, error } = await supabase
    .from('competitor_analysis')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No analysis found
    throw error;
  }

  return data as CompetitorAnalysis;
};

// Get all analyses for a competitor (history)
export const getCompetitorHistory = async (competitorId: string): Promise<CompetitorAnalysis[]> => {
  const { data, error } = await supabase
    .from('competitor_analysis')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('analyzed_at', { ascending: false });

  if (error) throw error;
  return data as CompetitorAnalysis[];
};

// Delete a competitor
export const deleteCompetitor = async (competitorId: string) => {
  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', competitorId);

  if (error) throw error;
};

// Mark a lead as competitor
export const convertLeadToCompetitor = async (lead: {
  name: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  industry?: string;
}) => {
  return createCompetitor({
    name: lead.name,
    industry: lead.industry,
    website_url: lead.website,
    instagram_url: lead.instagram,
    facebook_url: lead.facebook
  });
};
```

---

## 🎨 Code React - Components

### `src/components/CompetitorCard.tsx`

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, ExternalLink, Trash2 } from 'lucide-react';
import { analyzeCompetitorStrategy, getLatestAnalysis, deleteCompetitor } from '@/services/competitorAnalytics';
import { toast } from 'sonner';
import type { Competitor, CompetitorAnalysis } from '@/services/competitorAnalytics';

interface CompetitorCardProps {
  competitor: Competitor;
  onDelete: () => void;
}

export const CompetitorCard = ({ competitor, onDelete }: CompetitorCardProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Load existing analysis on mount
  useState(() => {
    getLatestAnalysis(competitor.id).then(data => {
      if (data) setAnalysis(data);
    });
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);

    try {
      const result = await analyzeCompetitorStrategy(competitor);

      toast.success(`Analyse de ${competitor.name} terminée!`);

      // Reload analysis from Supabase
      const latestAnalysis = await getLatestAnalysis(competitor.id);
      setAnalysis(latestAnalysis);
      setShowAnalysis(true);

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(`Erreur lors de l'analyse: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer ${competitor.name} ?`)) return;

    try {
      await deleteCompetitor(competitor.id);
      toast.success(`${competitor.name} supprimé`);
      onDelete();
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{competitor.name}</CardTitle>
            {competitor.industry && (
              <Badge variant="outline" className="mt-2">{competitor.industry}</Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Social Links */}
        <div className="space-y-2 mb-4">
          {competitor.instagram_url && (
            <a href={competitor.instagram_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3 w-3" />
              Instagram {competitor.instagram_followers && `(${competitor.instagram_followers})`}
            </a>
          )}
          {competitor.facebook_url && (
            <a href={competitor.facebook_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3 w-3" />
              Facebook {competitor.facebook_likes && `(${competitor.facebook_likes} likes)`}
            </a>
          )}
          {competitor.website_url && (
            <a href={competitor.website_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3 w-3" />
              Site web
            </a>
          )}
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full mb-4"
          variant={analysis ? "outline" : "default"}
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              {analysis ? 'Nouvelle analyse' : 'Analyser Stratégie'}
            </>
          )}
        </Button>

        {competitor.last_analyzed_at && (
          <p className="text-xs text-muted-foreground mb-4">
            Dernière analyse: {new Date(competitor.last_analyzed_at).toLocaleDateString('fr-FR')}
          </p>
        )}

        {/* Analysis Results */}
        {analysis && showAnalysis && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <h4 className="font-semibold mb-2">📊 Résumé</h4>
              <p className="text-sm">{analysis.summary}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🎯 Positionnement</h4>
              <p className="text-sm">{analysis.positioning}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🎨 Ton</h4>
              <Badge>{analysis.tone}</Badge>
            </div>

            <div>
              <h4 className="font-semibold mb-2">✅ Points Forts</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.strengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">⚠️ Points Faibles</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.weaknesses.map((weakness, i) => (
                  <li key={i}>{weakness}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">💡 Opportunités pour nous</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {analysis.opportunities_for_us.map((opp, i) => (
                  <li key={i} className="text-green-600 dark:text-green-400">{opp}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📈 Recommandations</h4>
              <p className="text-sm">{analysis.recommendations}</p>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Coût de l'analyse: {analysis.analysis_cost.toFixed(4)}€ | Tokens: {analysis.tokens_used}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### `src/pages/CompetitorsPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { getCompetitors, createCompetitor } from '@/services/competitorAnalytics';
import { CompetitorCard } from '@/components/CompetitorCard';
import { toast } from 'sonner';
import type { Competitor } from '@/services/competitorAnalytics';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    instagram_url: '',
    facebook_url: '',
    linkedin_url: '',
    website_url: ''
  });

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    try {
      const data = await getCompetitors();
      setCompetitors(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des concurrents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      await createCompetitor(formData);
      toast.success(`${formData.name} ajouté comme concurrent`);
      setIsDialogOpen(false);
      setFormData({ name: '', industry: '', instagram_url: '', facebook_url: '', linkedin_url: '', website_url: '' });
      loadCompetitors();
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Concurrents</h1>
          <p className="text-muted-foreground mt-2">
            Analysez la stratégie de vos concurrents avec l'IA
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter Concurrent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Concurrent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nike, Adidas, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="industry">Industrie</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  placeholder="Sportswear, Tech, etc."
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                  placeholder="https://instagram.com/nike"
                />
              </div>

              <div>
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input
                  id="facebook"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({...formData, facebook_url: e.target.value})}
                  placeholder="https://facebook.com/nike"
                />
              </div>

              <div>
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                  placeholder="https://linkedin.com/company/nike"
                />
              </div>

              <div>
                <Label htmlFor="website">Site Web</Label>
                <Input
                  id="website"
                  value={formData.website_url}
                  onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                  placeholder="https://nike.com"
                />
              </div>

              <Button type="submit" className="w-full">
                Ajouter
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {competitors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Aucun concurrent ajouté</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter votre premier concurrent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitors.map((competitor) => (
            <CompetitorCard
              key={competitor.id}
              competitor={competitor}
              onDelete={loadCompetitors}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔗 Modification de LeadsPage

Ajoutez un bouton pour marquer un lead comme concurrent:

```typescript
// Dans src/pages/LeadsPage.tsx
import { convertLeadToCompetitor } from '@/services/competitorAnalytics';

// Dans le composant LeadCard ou LeadRow:
const handleMarkAsCompetitor = async (lead) => {
  try {
    await convertLeadToCompetitor({
      name: lead.name,
      website: lead.website,
      instagram: lead.instagram_url,
      facebook: lead.facebook_url,
      industry: lead.industry
    });

    toast.success(`${lead.name} ajouté comme concurrent`);
    navigate('/competitors');
  } catch (error) {
    toast.error(`Erreur: ${error.message}`);
  }
};

// Bouton dans l'UI:
<Button variant="outline" size="sm" onClick={() => handleMarkAsCompetitor(lead)}>
  <Target className="mr-2 h-4 w-4" />
  Marquer comme concurrent
</Button>
```

---

## 📊 Résultat de l'Analyse

Exemple de réponse du webhook N8N:

```json
{
  "success": true,
  "competitor_id": "uuid-here",
  "name": "Nike",
  "summary": "Nike utilise une stratégie de contenu inspirante centrée sur l'athlète avec un ton motivant et des visuels de haute qualité.",
  "positioning": "Leader du sportswear premium avec un positionnement aspirationnel axé sur la performance et le dépassement de soi.",
  "tone": "Inspirant, motivant, empowering",
  "strengths": [
    "Storytelling émotionnel très fort",
    "Qualité visuelle exceptionnelle",
    "Engagement communautaire élevé"
  ],
  "weaknesses": [
    "Prix perçus comme élevés",
    "Communication parfois trop aspirationnelle pour clients moyens"
  ],
  "opportunities": [
    "Se positionner comme alternative accessible",
    "Créer contenu plus éducatif et pratique",
    "Cibler segments de marché négligés"
  ],
  "social_media_presence": "Très forte - présence omnicanale cohérente",
  "recommendations": "Différenciation par authenticité et accessibilité",
  "cost": 0.0025,
  "analyzed_at": "2025-11-10T12:30:00Z"
}
```

---

## 💰 Coût par Analyse

**Estimation réelle**:
- Scraping (Puppeteer): **0€** (serveur déjà payé)
- OpenAI GPT-4o-mini:
  - Input: ~3000 tokens × $0.15/1M = **$0.00045**
  - Output: ~1500 tokens × $0.60/1M = **$0.00090**
  - **Total: ~$0.0014** (≈ **0.0013€**)

**Pour 100 analyses/mois: ~0.13€** 🎉

---

## 🎯 Monétisation

Ajoutez dans vos plans:

| Plan | Concurrents | Analyses/mois | Prix |
|------|-------------|---------------|------|
| Free | 0 | 0 | 0€ |
| Pro | 5 | 20 | 19€ |
| Business | 20 | Illimité | 49€ |
| Enterprise | Illimité | Illimité | Custom |

**Votre coût**: ~0.13€/100 analyses
**Votre revenu**: 19-49€/user
**ROI**: 🚀🚀🚀

---

## ✅ Checklist d'Implémentation

- [ ] Exécuter SQL dans Supabase
- [ ] Importer workflow N8N
- [ ] Configurer credentials (OpenAI + Supabase)
- [ ] Activer workflow
- [ ] Créer `src/services/competitorAnalytics.ts`
- [ ] Créer `src/components/CompetitorCard.tsx`
- [ ] Créer `src/pages/CompetitorsPage.tsx`
- [ ] Ajouter route dans `App.tsx`
- [ ] Ajouter bouton dans `LeadsPage.tsx`
- [ ] Tester avec 1-2 vrais concurrents
- [ ] Ajuster UI selon vos besoins

---

**Temps d'implémentation estimé**: 4-6 heures

**Prêt à dominer le marché!** 🚀
