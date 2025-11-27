/**
 * Formulaire de création/édition de campagne
 * Permet de configurer le ciblage, le message et la planification
 */

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Calendar, Users, Target, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSectors, useSegments, useCRMLeads } from '@/hooks/useCRM';
import { CampaignFormData, CampaignChannel, LeadStatus } from '@/types/crm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CampaignFormData>;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { sectors } = useSectors();
  const { segments } = useSegments();
  const { leads } = useCRMLeads();

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    channel: initialData?.channel || 'email',
    target: {
      sector_ids: initialData?.target?.sector_ids || [],
      segment_ids: initialData?.target?.segment_ids || [],
      cities: initialData?.target?.cities || [],
      tags: initialData?.target?.tags || [],
      status: initialData?.target?.status || [],
    },
    message: {
      subject: initialData?.message?.subject || '',
      content: initialData?.message?.content || '',
      variables: [],
    },
    scheduled_at: initialData?.scheduled_at,
  });

  // Villes disponibles
  const availableCities = [...new Set(leads.map(l => l.city).filter(Boolean))].sort();

  // Tags disponibles
  const availableTags = [...new Set(leads.flatMap(l => l.tags || []))].sort();

  // Compter les leads ciblés
  const getTargetedLeadsCount = () => {
    return leads.filter(lead => {
      const matchesSector = formData.target.sector_ids?.length === 0 ||
        (lead.sector_id && formData.target.sector_ids?.includes(lead.sector_id));
      const matchesSegment = formData.target.segment_ids?.length === 0 ||
        (lead.segment_id && formData.target.segment_ids?.includes(lead.segment_id));
      const matchesCity = formData.target.cities?.length === 0 ||
        formData.target.cities?.includes(lead.city);
      const matchesStatus = formData.target.status?.length === 0 ||
        formData.target.status?.includes(lead.status);
      const matchesTags = formData.target.tags?.length === 0 ||
        formData.target.tags?.some(tag => lead.tags?.includes(tag));

      return matchesSector && matchesSegment && matchesCity && matchesStatus && matchesTags;
    }).length;
  };

  const targetedCount = getTargetedLeadsCount();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert('Le nom de la campagne est requis');
      return;
    }
    if (!formData.message.content.trim()) {
      alert('Le message de la campagne est requis');
      return;
    }
    if (formData.channel === 'email' && !formData.message.subject?.trim()) {
      alert('Le sujet de l\'email est requis');
      return;
    }
    if (targetedCount === 0) {
      alert('Aucun lead ne correspond aux critères de ciblage');
      return;
    }

    onSubmit(formData);
  };

  const updateTarget = (key: keyof typeof formData.target, value: any) => {
    setFormData(prev => ({
      ...prev,
      target: { ...prev.target, [key]: value },
    }));
  };

  const toggleArrayItem = (key: keyof typeof formData.target, value: string) => {
    const currentArray = (formData.target[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateTarget(key, newArray);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la campagne *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Offre spéciale restaurants Dakar"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'objectif de cette campagne..."
              rows={2}
            />
          </div>

          <div>
            <Label>Canal de communication *</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Button
                type="button"
                variant={formData.channel === 'email' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, channel: 'email' })}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
              <Button
                type="button"
                variant={formData.channel === 'whatsapp' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, channel: 'whatsapp' })}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant={formData.channel === 'both' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, channel: 'both' })}
                className="gap-2"
              >
                <Mail className="w-3 h-3" />
                <MessageSquare className="w-3 h-3" />
                Les deux
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Ciblage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Ciblage des leads
              </CardTitle>
              <CardDescription className="mt-1">
                Sélectionnez les critères pour cibler vos leads
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {targetedCount} leads ciblés
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Secteurs */}
          {sectors.length > 0 && (
            <div>
              <Label>Secteurs</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sectors.map(sector => (
                  <Badge
                    key={sector.id}
                    variant={formData.target.sector_ids?.includes(sector.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('sector_ids', sector.id)}
                  >
                    {sector.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Segments */}
          {segments.length > 0 && (
            <div>
              <Label>Segments</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {segments.map(segment => (
                  <Badge
                    key={segment.id}
                    variant={formData.target.segment_ids?.includes(segment.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('segment_ids', segment.id)}
                  >
                    {segment.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Villes */}
          {availableCities.length > 0 && (
            <div>
              <Label>Villes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableCities.map(city => (
                  <Badge
                    key={city}
                    variant={formData.target.cities?.includes(city) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('cities', city)}
                  >
                    {city}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Statuts */}
          <div>
            <Label>Statuts des leads</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(['new', 'contacted', 'interested', 'qualified', 'client'] as LeadStatus[]).map(status => (
                <Badge
                  key={status}
                  variant={formData.target.status?.includes(status) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleArrayItem('status', status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={formData.target.tags?.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('tags', tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Message</CardTitle>
          <CardDescription>
            Rédigez le message qui sera envoyé à vos leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.channel === 'email' || formData.channel === 'both') && (
            <div>
              <Label htmlFor="subject">Sujet de l'email *</Label>
              <Input
                id="subject"
                value={formData.message.subject}
                onChange={(e) => setFormData({
                  ...formData,
                  message: { ...formData.message, subject: e.target.value },
                })}
                placeholder="Ex: Offre exclusive pour votre restaurant"
                required={formData.channel === 'email' || formData.channel === 'both'}
              />
            </div>
          )}

          <div>
            <Label htmlFor="content">Contenu du message *</Label>
            <Textarea
              id="content"
              value={formData.message.content}
              onChange={(e) => setFormData({
                ...formData,
                message: { ...formData.message, content: e.target.value },
              })}
              placeholder="Bonjour,&#10;&#10;Nous avons une offre spéciale pour vous...&#10;&#10;Cordialement"
              rows={8}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variables disponibles: {'{{nom}}'}, {'{{ville}}'}, {'{{email}}'}, {'{{telephone}}'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Planification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Planification (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="scheduled_at">Date et heure d'envoi</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({
                ...formData,
                scheduled_at: e.target.value ? new Date(e.target.value) : undefined,
              })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Laissez vide pour enregistrer en brouillon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
        <Button type="submit" className="gap-2">
          <Send className="w-4 h-4" />
          {formData.scheduled_at ? 'Planifier la campagne' : 'Enregistrer en brouillon'}
        </Button>
      </div>
    </form>
  );
};

export default CampaignForm;
