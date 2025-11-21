/**
 * Page de détails d'un lead avec historique d'interactions
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Edit,
  Trash,
  MessageSquare,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Tag,
  FileText,
  Clock,
  User,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadsService } from '@/services/leads';
import { Lead, LeadStatus } from '@/types/leads';
import { useLeadStatus } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStatusColor, getStatusLabel } = useLeadStatus();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    if (id) {
      loadLead();
    }
  }, [id]);

  const loadLead = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const leadData = await LeadsService.getLeadById(id);
      if (leadData) {
        setLead(leadData);
        setNotes(leadData.notes);
      } else {
        toast.error('Lead introuvable');
        navigate('/app/leads');
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      toast.error('Erreur lors du chargement du lead');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!id || !lead) return;
    
    try {
      await LeadsService.updateLeadStatus(id, newStatus);
      setLead({ ...lead, status: newStatus });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleSaveNotes = async () => {
    if (!id || !lead) return;
    
    try {
      await LeadsService.updateLead(id, { notes });
      setLead({ ...lead, notes });
      setIsEditingNotes(false);
      toast.success('Notes sauvegardées');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des notes');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) {
      try {
        await LeadsService.deleteLead(id);
        toast.success('Lead supprimé');
        navigate('/app/leads');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">Lead introuvable</p>
        <Button onClick={() => navigate('/app/leads')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux leads
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/leads')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <p className="text-muted-foreground">{lead.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Statut */}
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <Select value={lead.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nouveau</SelectItem>
                      <SelectItem value="contacted">Contacté</SelectItem>
                      <SelectItem value="interested">Intéressé</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="not_interested">Pas intéressé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Adresse */}
                <div className="col-span-2 flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">{lead.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.postalCode} {lead.city}
                    </p>
                  </div>
                </div>

                {/* Téléphone */}
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Site web */}
                {lead.website && (
                  <div className="col-span-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Site web</p>
                      <a 
                        href={lead.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {lead.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Réseaux sociaux */}
              {(lead.socialMedia?.instagram || lead.socialMedia?.facebook || 
                lead.socialMedia?.linkedin || lead.socialMedia?.twitter) && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-3">Réseaux sociaux</p>
                    <div className="flex gap-2">
                      {lead.socialMedia?.instagram && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(lead.socialMedia?.instagram, '_blank')}
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          Instagram
                        </Button>
                      )}
                      {lead.socialMedia?.facebook && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(lead.socialMedia?.facebook, '_blank')}
                        >
                          <Facebook className="w-4 h-4 mr-2" />
                          Facebook
                        </Button>
                      )}
                      {lead.socialMedia?.linkedin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(lead.socialMedia?.linkedin, '_blank')}
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </Button>
                      )}
                      {lead.socialMedia?.twitter && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(lead.socialMedia?.twitter, '_blank')}
                        >
                          <Twitter className="w-4 h-4 mr-2" />
                          Twitter
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notes</CardTitle>
                {!isEditingNotes ? (
                  <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes}>
                      Enregistrer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setNotes(lead.notes);
                        setIsEditingNotes(false);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des notes sur ce lead..."
                  rows={6}
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {lead.notes || 'Aucune note'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Historique d'activité (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Historique d'activité</CardTitle>
              <CardDescription>Toutes les interactions avec ce lead</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="font-medium">Lead ajouté</p>
                    <p className="text-sm text-muted-foreground">
                      {format(lead.addedAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Source: {lead.source}
                    </p>
                  </div>
                </div>

                {lead.lastContactedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                    <div className="flex-1">
                      <p className="font-medium">Dernier contact</p>
                      <p className="text-sm text-muted-foreground">
                        {format(lead.lastContactedAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lead.tags.length > 0 ? (
                  lead.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun tag</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge className={getStatusColor(lead.status)}>
                  {getStatusLabel(lead.status)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ajouté</span>
                <span className="text-sm font-medium">
                  {format(lead.addedAt, 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
              {lead.lastContactedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dernier contact</span>
                  <span className="text-sm font-medium">
                    {format(lead.lastContactedAt, 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.phone && (
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open(`tel:${lead.phone}`)}>
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler
                </Button>
              )}
              {lead.email && (
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open(`mailto:${lead.email}`)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un email
                </Button>
              )}
              {lead.phone && (
                <Button variant="outline" className="w-full justify-start" onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPage;
