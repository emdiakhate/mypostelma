/**
 * Competitors Page
 *
 * Manage competitor tracking and AI-powered strategic analysis.
 * Integrates with Apify + Jina.ai workflow for web scraping and OpenAI analysis.
 */

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  TrendingUp,
  BarChart3,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompetitorCard } from '@/components/CompetitorCard';
import { useCompetitors } from '@/hooks/useCompetitors';

export default function CompetitorsPage() {
  const { competitors, loading, addCompetitor, refreshCompetitors } = useCompetitors();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    instagram_url: '',
    facebook_url: '',
    linkedin_url: '',
    twitter_url: '',
    tiktok_url: '',
    website_url: '',
  });


  // Filter competitors
  const filteredCompetitors = competitors.filter((competitor) => {
    const matchesSearch = competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         competitor.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = filterIndustry === 'all' || competitor.industry === filterIndustry;
    return matchesSearch && matchesIndustry;
  });

  // Get unique industries for filter
  const industries = Array.from(new Set(competitors.map(c => c.industry).filter(Boolean)));

  // Stats
  const stats = {
    total: competitors.length,
    analyzed: competitors.filter(c => c.analysis_count > 0).length,
    pending: competitors.filter(c => c.analysis_count === 0).length,
  };

  // Handle add competitor
  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addCompetitor({
        name: formData.name,
        industry: formData.industry || undefined,
        description: formData.description || undefined,
        instagram_url: formData.instagram_url || undefined,
        facebook_url: formData.facebook_url || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        twitter_url: formData.twitter_url || undefined,
        tiktok_url: formData.tiktok_url || undefined,
        website_url: formData.website_url || undefined,
      });

      // Reset form
      setFormData({
        name: '',
        industry: '',
        description: '',
        instagram_url: '',
        facebook_url: '',
        linkedin_url: '',
        twitter_url: '',
        tiktok_url: '',
        website_url: '',
      });

      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding competitor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('CompetitorsPage render, isAddDialogOpen:', isAddDialogOpen);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Analyse Concurrentielle
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez et analysez vos concurrents avec des insights IA
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau concurrent
        </Button>
      </div>

      {/* Add Competitor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un concurrent</DialogTitle>
              <DialogDescription>
                Entrez les informations du concurrent. Les URLs des réseaux sociaux et du site web sont utilisées pour l'analyse IA.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCompetitor}>
              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'entreprise *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom du concurrent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Secteur d'activité</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Technologie, Mode, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brève description du concurrent..."
                    rows={3}
                  />
                </div>

                {/* Social Media URLs */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Réseaux Sociaux & Site Web (pour l'analyse IA)
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram URL
                    </Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook_url" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook URL
                    </Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_url" className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Twitter/X URL
                    </Label>
                    <Input
                      id="twitter_url"
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/company/company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      TikTok URL
                    </Label>
                    <Input
                      id="tiktok_url"
                      type="url"
                      value={formData.tiktok_url}
                      onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                      placeholder="https://tiktok.com/@company"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website URL
                    </Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://company.com"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter le concurrent
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Concurrents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Analysés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.analyzed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En attente d'analyse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrer les concurrents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou secteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les secteurs</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry || ''}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || filterIndustry !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setFilterIndustry('all');
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competitors List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Concurrents ({filteredCompetitors.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompetitors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {competitors.length === 0 ? 'Aucun concurrent pour le moment' : 'Aucun concurrent trouvé'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {competitors.length === 0
                  ? 'Ajoutez votre premier concurrent pour commencer à suivre et analyser leur stratégie.'
                  : 'Essayez d\'ajuster vos filtres ou votre recherche.'}
              </p>
              {competitors.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre premier concurrent
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompetitors.map((competitor) => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                onUpdate={refreshCompetitors}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      {competitors.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              About Competitor Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Our AI analyzes your competitors' social media presence, website, and content strategy
              to provide actionable insights.
            </p>
            <p>
              <strong>Analysis includes:</strong> positioning, content strategy, tone, strengths, weaknesses,
              opportunities, and strategic recommendations.
            </p>
            <p className="text-xs">
              Cost: ~€0.0013 (OpenAI) + Apify credits • Duration: 1-5 minutes (powered by Apify + Jina.ai + OpenAI)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
