import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Filter, Search, Calendar as CalendarIcon,
  Download, Trash2, Eye, Copy, MoreVertical, X,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Music
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import PublicationCard from '@/components/PublicationCard';
import { toast } from 'sonner';

type PostStatus = 'published' | 'draft' | 'failed';
type SortBy = 'date-desc' | 'date-asc' | 'engagement' | 'platform';

export default function PublicationsPage() {
  // État
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<PostStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);

  const POSTS_PER_PAGE = 12;

  // Données mock avec 7 publiés, 2 brouillons, 1 échec
  const mockPosts = [
    // 7 Publications "Publié"
    {
      id: 'pub-1',
      content: '🥩 Découvrez notre sélection premium de viandes fraîches chez Mata Viande ! Nos steaks de bœuf sont parfaits pour vos grillades du weekend. Livraison gratuite dès 50€ ! #MataViande #QualitéPremium #BoucherieEnLigne',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop',
      platforms: ['instagram', 'facebook'],
      status: 'published',
      scheduledTime: new Date('2024-01-15T09:00:00'),
      createdAt: new Date('2024-01-14T08:00:00'),
      author: 'Mata Viande',
      engagement: 150, likes: 120, comments: 20, shares: 10, engagementRate: 0.05
    },
    {
      id: 'pub-2',
      content: '🍗 Nos poulets fermiers élevés en plein air arrivent frais chaque matin ! Parfait pour un repas familial de qualité. Commandez maintenant et profitez de notre offre spéciale !',
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop',
      platforms: ['facebook', 'twitter'],
      status: 'published',
      scheduledTime: new Date('2024-01-14T14:30:00'),
      createdAt: new Date('2024-01-13T13:00:00'),
      author: 'Mata Viande',
      engagement: 200, likes: 180, comments: 15, shares: 5, engagementRate: 0.07
    },
    {
      id: 'pub-3',
      content: '🥓 Bacon artisanal fumé au bois de hêtre - Une saveur incomparable ! Nos charcuteries sont préparées selon les méthodes traditionnelles. Disponible en magasin et en ligne.',
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop',
      platforms: ['instagram'],
      status: 'published',
      scheduledTime: new Date('2024-01-13T11:00:00'),
      createdAt: new Date('2024-01-12T10:00:00'),
      author: 'Mata Viande',
      engagement: 180, likes: 150, comments: 25, shares: 5, engagementRate: 0.06
    },
    {
      id: 'pub-4',
      content: '🐟 Poisson frais du jour ! Saumon, cabillaud, dorade... Tous nos poissons sont sélectionnés avec soin pour leur fraîcheur. Idéal pour un dîner sain et savoureux.',
      image: 'https://images.unsplash.com/photo-1574781330855-d0f35f2e55ed?w=400&h=400&fit=crop',
      platforms: ['linkedin'],
      status: 'published',
      scheduledTime: new Date('2024-01-12T10:00:00'),
      createdAt: new Date('2024-01-11T09:00:00'),
      author: 'Mata Viande',
      engagement: 90, likes: 70, comments: 15, shares: 5, engagementRate: 0.03
    },
    {
      id: 'pub-5',
      content: '🍖 Côte de bœuf maturée 28 jours - Un délice pour les amateurs de viande ! Accompagnée de nos légumes de saison. Réservez votre table pour ce weekend.',
      image: 'https://images.unsplash.com/photo-1588347818501-0d0b0b0b0b0b?w=400&h=400&fit=crop',
      platforms: ['instagram', 'facebook'],
      status: 'published',
      scheduledTime: new Date('2024-01-11T16:00:00'),
      createdAt: new Date('2024-01-10T15:00:00'),
      author: 'Mata Viande',
      engagement: 160, likes: 130, comments: 20, shares: 10, engagementRate: 0.055
    },
    {
      id: 'pub-6',
      content: 'Un grand merci à tous nos clients fidèles ! Votre soutien nous motive chaque jour. 🙏 #CustomerLove #ThankYou',
      image: 'https://images.unsplash.com/photo-1509785307050-dc87a7f0633e?w=400&h=400&fit=crop',
      platforms: ['facebook'],
      status: 'published',
      scheduledTime: new Date('2024-01-10T12:00:00'),
      createdAt: new Date('2024-01-09T11:00:00'),
      author: 'Mata Viande',
      engagement: 190, likes: 160, comments: 20, shares: 10, engagementRate: 0.06
    },
    {
      id: 'pub-7',
      content: 'Notre équipe est passionnée par la qualité et ça se voit ! Venez nous rencontrer. 😊 #QualityTeam #Passion',
      image: 'https://images.unsplash.com/photo-1509785307050-dc87a7f0633e?w=400&h=400&fit=crop',
      platforms: ['instagram', 'twitter'],
      status: 'published',
      scheduledTime: new Date('2024-01-09T10:00:00'),
      createdAt: new Date('2024-01-08T09:00:00'),
      author: 'Mata Viande',
      engagement: 170, likes: 140, comments: 20, shares: 10, engagementRate: 0.058
    },
    // 2 Publications "Brouillon"
    {
      id: 'draft-1',
      content: 'Idée de post pour la nouvelle collection de saucisses artisanales. À revoir avec le chef.',
      image: 'https://images.unsplash.com/photo-1509785307050-dc87a7f0633e?w=400&h=400&fit=crop',
      platforms: ['instagram'],
      status: 'draft',
      scheduledTime: null,
      createdAt: new Date('2024-01-08T14:00:00'),
      author: 'Mata Viande',
      engagement: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0
    },
    {
      id: 'draft-2',
      content: 'Promotion spéciale hiver. Texte à finaliser et image à choisir.',
      image: 'https://images.unsplash.com/photo-1509785307050-dc87a7f0633e?w=400&h=400&fit=crop',
      platforms: ['facebook', 'twitter'],
      status: 'draft',
      scheduledTime: null,
      createdAt: new Date('2024-01-07T10:00:00'),
      author: 'Mata Viande',
      engagement: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0
    },
    // 1 Publication "Échec"
    {
      id: 'failed-1',
      content: 'Problème de connexion lors de la publication. À vérifier.',
      image: 'https://images.unsplash.com/photo-1509785307050-dc87a7f0633e?w=400&h=400&fit=crop',
      platforms: ['linkedin'],
      status: 'failed',
      scheduledTime: new Date('2024-01-06T11:00:00'),
      createdAt: new Date('2024-01-06T10:59:00'),
      author: 'Mata Viande',
      engagement: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0
    }
  ];

  // Force l'utilisation des données mock pour cette démo
  // En production, vous pourriez vouloir charger depuis localStorage
  const allPosts = mockPosts;

  // Filtres et tri
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = [...allPosts];

    // Filtre recherche
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre plateforme
    if (filterPlatform !== 'all') {
      filtered = filtered.filter(post =>
        post.platforms?.includes(filterPlatform)
      );
    }

    // Filtre statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(post => post.status === filterStatus);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return getDateValue(b) - getDateValue(a);
        case 'date-asc':
          return getDateValue(a) - getDateValue(b);
        case 'engagement':
          return (b.engagement || 0) - (a.engagement || 0);
        case 'platform':
          return (a.platforms?.[0] || '').localeCompare(b.platforms?.[0] || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allPosts, searchTerm, filterPlatform, filterStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredAndSortedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  // Reset page si filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPlatform, filterStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Publications</h1>
          <p className="text-muted-foreground mt-1">
            {filteredAndSortedPosts.length} publication{filteredAndSortedPosts.length > 1 ? 's' : ''}
            {filteredAndSortedPosts.length !== allPosts.length && (
              <span> (sur {allPosts.length} total)</span>
            )}
          </p>
        </div>

        <Button onClick={exportPublications}>
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Ligne 1: Recherche */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les publications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Bouton reset filtres */}
            {(searchTerm || filterPlatform !== 'all' || filterStatus !== 'all' || sortBy !== 'date-desc') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterPlatform('all');
                  setFilterStatus('all');
                  setSortBy('date-desc');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Ligne 2: Filtres avancés */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Filtre Plateforme */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Plateforme:</span>
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      Instagram
                    </div>
                  </SelectItem>
                  <SelectItem value="facebook">
                    <div className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </div>
                  </SelectItem>
                  <SelectItem value="linkedin">
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      LinkedIn
                    </div>
                  </SelectItem>
                  <SelectItem value="twitter">
                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      X (Twitter)
                    </div>
                  </SelectItem>
                  <SelectItem value="youtube">
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-600" />
                      YouTube
                    </div>
                  </SelectItem>
                  <SelectItem value="tiktok">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      TikTok
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Statut */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Statut:</span>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as PostStatus | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="published">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Publié
                    </div>
                  </SelectItem>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      Brouillon
                    </div>
                  </SelectItem>
                  <SelectItem value="failed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Échec
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trier par:</span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Plus récent</SelectItem>
                  <SelectItem value="date-asc">Plus ancien</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="platform">Plateforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Badges filtres actifs */}
          {(filterPlatform !== 'all' || filterStatus !== 'all' || searchTerm) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtres actifs:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="w-3 h-3" />
                  "{searchTerm}"
                </Badge>
              )}
              {filterPlatform !== 'all' && (
                <Badge variant="secondary">
                  Plateforme: {filterPlatform}
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary">
                  Statut: {getStatusLabel(filterStatus)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Grille de publications */}
      {paginatedPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedPosts.map(post => (
            <PublicationCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune publication trouvée</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterPlatform !== 'all' || filterStatus !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Créez votre première publication pour commencer'}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setFilterPlatform('all');
              setFilterStatus('all');
            }}
          >
            Réinitialiser les filtres
          </Button>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, arr) => {
                const prevPage = arr[index - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <div key={page} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-9 h-9 p-0"
                    >
                      {page}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusLabel(status: string): string {
  const labels = {
    published: 'Publié',
    draft: 'Brouillon',
    failed: 'Échec'
  };
  return labels[status] || status;
}

function exportPublications() {
  // TODO: Implémenter export CSV
  toast.success('Export en cours...');
}

// Helper function pour obtenir la valeur de date de manière sécurisée
function getDateValue(post: any): number {
  try {
    const dateStr = post.scheduledTime || post.createdAt;
    if (!dateStr) return 0;
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  } catch (error) {
    console.error('Erreur de conversion de date:', error);
    return 0;
  }
}