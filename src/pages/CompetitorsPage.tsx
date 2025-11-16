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
  RefreshCw,
  GitCompare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompetitorCard } from '@/components/CompetitorCard';
import { CompetitorFormModal } from '@/components/CompetitorFormModal';
import { useCompetitors } from '@/hooks/useCompetitors';
import type { Competitor } from '@/types/competitor';

export default function CompetitorsPage() {
  const navigate = useNavigate();
  const { competitors, loading, addCompetitor, updateCompetitor, refreshCompetitors } = useCompetitors();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);


  // Filter and sort competitors
  const filteredCompetitors = competitors
    .filter((competitor) => {
      const matchesSearch = competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           competitor.industry?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = filterIndustry === 'all' || competitor.industry === filterIndustry;
      
      const matchesPlatform = platformFilter === 'all' || 
        (platformFilter === 'instagram' && competitor.instagram_url) ||
        (platformFilter === 'facebook' && competitor.facebook_url) ||
        (platformFilter === 'linkedin' && competitor.linkedin_url) ||
        (platformFilter === 'twitter' && competitor.twitter_url) ||
        (platformFilter === 'tiktok' && competitor.tiktok_url);
      
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'analyzed' && competitor.last_analyzed_at) ||
        (statusFilter === 'not_analyzed' && !competitor.last_analyzed_at);
      
      return matchesSearch && matchesIndustry && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return b.added_at.getTime() - a.added_at.getTime();
        case 'date_asc':
          return a.added_at.getTime() - b.added_at.getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'analyzed_desc':
          return (b.last_analyzed_at?.getTime() || 0) - (a.last_analyzed_at?.getTime() || 0);
        case 'analyzed_asc':
          return (a.last_analyzed_at?.getTime() || 0) - (b.last_analyzed_at?.getTime() || 0);
        default:
          return 0;
      }
    });

  // Get unique industries for filter
  const industries = Array.from(new Set(competitors.map(c => c.industry).filter(Boolean)));

  // Stats
  const stats = {
    total: competitors.length,
    analyzed: competitors.filter(c => c.analysis_count > 0).length,
    pending: competitors.filter(c => c.analysis_count === 0).length,
  };

  // Handle submit (add or edit)
  const handleSubmitCompetitor = async (data: Partial<Competitor>) => {
    if (editingCompetitor) {
      await updateCompetitor(editingCompetitor.id, data);
    } else {
      // Ensure name is provided for adding
      if (!data.name) {
        throw new Error('Name is required');
      }
      await addCompetitor(data as Omit<Competitor, 'id' | 'user_id' | 'added_at' | 'last_analyzed_at' | 'analysis_count'>);
    }
    setEditingCompetitor(null);
  };

  const handleOpenAddModal = () => {
    setEditingCompetitor(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setIsFormModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Analyse Concurrentielle
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez et analysez vos concurrents avec des insights IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/app/competitors/compare')}
            variant="outline"
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Comparer
          </Button>
          <Button
            onClick={() => refreshCompetitors()}
            variant="outline"
            size="icon"
            title="Actualiser"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un concurrent
          </Button>
        </div>
      </div>

      {/* Competitor Form Modal */}
      <CompetitorFormModal
        open={isFormModalOpen}
        onOpenChange={(open) => {
          setIsFormModalOpen(open);
          if (!open) setEditingCompetitor(null);
        }}
        onSubmit={handleSubmitCompetitor}
        competitor={editingCompetitor}
        title={editingCompetitor ? "Modifier le concurrent" : "Ajouter un concurrent"}
        description={editingCompetitor ? "Modifiez les informations du concurrent." : "Renseignez les informations du concurrent à analyser."}
      />

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
          <div className="space-y-4">
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

              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Plateforme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les plateformes</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="analyzed">Analysés</SelectItem>
                  <SelectItem value="not_analyzed">Non analysés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Plus récent</SelectItem>
                  <SelectItem value="date_asc">Plus ancien</SelectItem>
                  <SelectItem value="name_asc">Nom A-Z</SelectItem>
                  <SelectItem value="name_desc">Nom Z-A</SelectItem>
                  <SelectItem value="analyzed_desc">Dernière analyse</SelectItem>
                  <SelectItem value="analyzed_asc">Analyse la plus ancienne</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || filterIndustry !== 'all' || platformFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'date_desc') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterIndustry('all');
                    setPlatformFilter('all');
                    setStatusFilter('all');
                    setSortBy('date_desc');
                  }}
                >
                  Effacer les filtres
                </Button>
              )}
            </div>
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
                <Button onClick={handleOpenAddModal}>
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
                onEdit={handleEdit}
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
              À propos de l'analyse concurrentielle
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Notre IA analyse la présence sur les réseaux sociaux, le site web et la stratégie de contenu
              de vos concurrents pour fournir des insights exploitables.
            </p>
            <p>
              <strong>L'analyse comprend :</strong> positionnement, stratégie de contenu, ton, forces, faiblesses,
              opportunités et recommandations stratégiques.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
