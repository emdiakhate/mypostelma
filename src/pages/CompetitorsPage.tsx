import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Building, 
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Search,
  Trash,
  Eye,
  MoreVertical,
  Youtube,
  TrendingUp
} from 'lucide-react';
import { useCompetitors } from '@/hooks/useCompetitors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CompetitorsPage: React.FC = () => {
  const { competitors, loading, deleteCompetitor } = useCompetitors();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompetitors = competitors.filter(comp =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (comp.industry && comp.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Intelligence Concurrentielle
          </h1>
          <p className="text-muted-foreground mt-2">
            Suivez et analysez vos concurrents
          </p>
        </div>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          Ajouter un concurrent
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un concurrent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des concurrents */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompetitors.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun concurrent trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredCompetitors.map((competitor) => (
            <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building className="w-5 h-5 text-primary" />
                      {competitor.name}
                    </CardTitle>
                    {competitor.industry && (
                      <Badge variant="secondary" className="mt-2">
                        {competitor.industry}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteCompetitor(competitor.id)}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Description */}
                {competitor.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {competitor.description}
                  </p>
                )}

                {/* Site web */}
                {competitor.website_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={competitor.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {competitor.website_url}
                    </a>
                  </div>
                )}

                {/* Réseaux sociaux */}
                <div className="flex flex-wrap gap-2">
                  {competitor.instagram_url && (
                    <a 
                      href={competitor.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {competitor.facebook_url && (
                    <a 
                      href={competitor.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {competitor.linkedin_url && (
                    <a 
                      href={competitor.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {competitor.twitter_url && (
                    <a 
                      href={competitor.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                      title="Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {competitor.youtube_url && (
                    <a 
                      href={competitor.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                      title="YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Followers stats */}
                <div className="pt-3 border-t space-y-1">
                  {competitor.instagram_followers && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Instagram</span>
                      <span className="font-medium">{competitor.instagram_followers} followers</span>
                    </div>
                  )}
                  {competitor.facebook_likes && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Facebook</span>
                      <span className="font-medium">{competitor.facebook_likes} likes</span>
                    </div>
                  )}
                  {competitor.linkedin_followers && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">LinkedIn</span>
                      <span className="font-medium">{competitor.linkedin_followers} followers</span>
                    </div>
                  )}
                </div>

                {/* Analysis info */}
                {competitor.analysis_count > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{competitor.analysis_count} analyse(s) effectuée(s)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CompetitorsPage;
