import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Search,
  Filter,
  Trash,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useCompetitors } from '@/hooks/useCompetitors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const CompetitorsPage: React.FC = () => {
  const { competitors, loading, deleteCompetitor } = useCompetitors();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompetitors = competitors.filter(comp =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Concurrents</h1>
          <p className="text-muted-foreground">
            Analysez et suivez vos concurrents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{competitors.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, catégorie ou ville..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Liste des concurrents en cards */}
      {filteredCompetitors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun concurrent</p>
            <p className="text-muted-foreground">
              Ajoutez des concurrents depuis la page de génération de leads
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitors.map((competitor) => (
            <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{competitor.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building className="w-3 h-3" />
                      {competitor.category}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
                {/* Adresse */}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{competitor.address}</span>
                </div>
                <div className="text-sm text-muted-foreground pl-6">
                  {competitor.city} {competitor.postal_code && `(${competitor.postal_code})`}
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  {competitor.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${competitor.phone}`} className="text-primary hover:underline">
                        {competitor.phone}
                      </a>
                    </div>
                  )}
                  {competitor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${competitor.email}`} className="text-primary hover:underline">
                        {competitor.email}
                      </a>
                    </div>
                  )}
                  {competitor.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={competitor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {competitor.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Réseaux sociaux */}
                {competitor.social_media && Object.keys(competitor.social_media).length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {Object.entries(competitor.social_media).map(([platform, url]) => (
                      url && (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            platform === 'instagram' && "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-80",
                            platform === 'facebook' && "bg-social-facebook text-white hover:opacity-80",
                            platform === 'linkedin' && "bg-social-linkedin text-white hover:opacity-80",
                            platform === 'twitter' && "bg-social-twitter text-white hover:opacity-80"
                          )}
                        >
                          {getSocialIcon(platform)}
                        </a>
                      )
                    ))}
                  </div>
                )}

                {/* Tags */}
                {competitor.tags && competitor.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {competitor.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompetitorsPage;
