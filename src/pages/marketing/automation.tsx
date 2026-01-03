/**
 * Page Marketing Automation
 * Gestion des workflows, règles automatiques, et automatisations marketing
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Plus,
  Zap,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  Play,
  Pause,
  Edit,
  Trash,
  BarChart3,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types pour les automatisations (à définir proprement plus tard)
interface Automation {
  id: string;
  name: string;
  type: 'email' | 'message' | 'social' | 'lead';
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  executions: number;
  lastRun?: Date;
  createdAt: Date;
}

// Données de démo
const demoAutomations: Automation[] = [
  {
    id: '1',
    name: 'Bienvenue nouveau lead',
    type: 'email',
    trigger: 'Lead créé',
    status: 'active',
    executions: 145,
    lastRun: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 86400000 * 30),
  },
  {
    id: '2',
    name: 'Relance lead inactif',
    type: 'email',
    trigger: 'Lead inactif depuis 7 jours',
    status: 'active',
    executions: 82,
    lastRun: new Date(Date.now() - 7200000),
    createdAt: new Date(Date.now() - 86400000 * 15),
  },
  {
    id: '3',
    name: 'Message WhatsApp prospect',
    type: 'message',
    trigger: 'Prospect qualifié',
    status: 'paused',
    executions: 23,
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
];

export default function AutomationPage() {
  const [automations, setAutomations] = useState<Automation[]>(demoAutomations);

  const getStatusBadge = (status: Automation['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'paused':
        return <Badge variant="secondary">En pause</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const getTypeIcon = (type: Automation['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'social':
        return <Share2 className="w-4 h-4 text-purple-600" />;
      case 'lead':
        return <Users className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="container max-w-full mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Automation</h1>
          <p className="text-gray-600">
            Automatisez vos campagnes, relances et workflows marketing
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Automatisation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Automatisations</p>
                <p className="text-3xl font-bold text-gray-900">{automations.length}</p>
                <p className="text-xs text-green-600 mt-1">
                  {automations.filter(a => a.status === 'active').length} actives
                </p>
              </div>
              <Bot className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exécutions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {automations.reduce((sum, a) => sum + a.executions, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ce mois</p>
              </div>
              <Zap className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de conversion</p>
                <p className="text-3xl font-bold text-gray-900">24%</p>
                <p className="text-xs text-green-600 mt-1">+3% vs mois dernier</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Temps gagné</p>
                <p className="text-3xl font-bold text-gray-900">42h</p>
                <p className="text-xs text-gray-500 mt-1">Ce mois</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({automations.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Actives ({automations.filter(a => a.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            En pause ({automations.filter(a => a.status === 'paused').length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Brouillons ({automations.filter(a => a.status === 'draft').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Liste des automatisations */}
          <Card>
            <CardHeader>
              <CardTitle>Automatisations Actives</CardTitle>
              <CardDescription>
                Gérez vos workflows et règles automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Déclencheur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Exécutions</TableHead>
                    <TableHead>Dernière exécution</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell>{getTypeIcon(automation.type)}</TableCell>
                      <TableCell className="font-medium">{automation.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {automation.trigger}
                      </TableCell>
                      <TableCell>{getStatusBadge(automation.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{automation.executions}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {automation.lastRun
                          ? new Date(automation.lastRun).toLocaleString('fr-FR')
                          : 'Jamais'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {automation.status === 'active' ? (
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {automations.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucune automatisation
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Créez votre première automatisation pour gagner du temps
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une automatisation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Les autres onglets peuvent filtrer la même table */}
        <TabsContent value="active">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Automatisations actives - Même table avec filtre status='active'
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paused">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Automatisations en pause - Même table avec filtre status='paused'
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Brouillons - Même table avec filtre status='draft'
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Templates d'automatisation */}
      <Card>
        <CardHeader>
          <CardTitle>Templates d'Automatisation</CardTitle>
          <CardDescription>
            Créez rapidement des automatisations à partir de templates prêts à l'emploi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Bienvenue nouveau lead',
                description: 'Email automatique envoyé aux nouveaux leads',
                icon: Mail,
                color: 'text-blue-600',
              },
              {
                title: 'Relance inactifs',
                description: 'Relancer les leads inactifs après X jours',
                icon: Clock,
                color: 'text-orange-600',
              },
              {
                title: 'Nurturing email',
                description: 'Séquence d\'emails pour nurturing',
                icon: TrendingUp,
                color: 'text-green-600',
              },
            ].map((template, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <template.icon className={`w-8 h-8 ${template.color} mb-3`} />
                  <h3 className="font-semibold mb-2">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Utiliser ce template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Import manquant
import { Share2, Clock } from 'lucide-react';
