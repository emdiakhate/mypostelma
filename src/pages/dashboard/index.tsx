/**
 * Dashboard Principal - Nouvelle Architecture V2
 * Vue d'ensemble complète de tous les modules MyPostelma
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ShoppingCart,
  Euro,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';

// Données de démonstration pour les graphiques
const revenueData = [
  { month: 'Jan', vente: 12000, compta: 15000 },
  { month: 'Fév', vente: 15000, compta: 18000 },
  { month: 'Mar', vente: 13000, compta: 16000 },
  { month: 'Avr', vente: 18000, compta: 22000 },
  { month: 'Mai', vente: 16000, compta: 20000 },
  { month: 'Jun', vente: 20000, compta: 25000 },
];

const leadsPipelineData = [
  { stage: 'Leads', count: 45 },
  { stage: 'Prospects', count: 28 },
  { stage: 'Clients', count: 15 },
];

const marketingData = [
  { platform: 'Facebook', engagement: 4500 },
  { platform: 'Instagram', engagement: 6200 },
  { platform: 'LinkedIn', engagement: 3800 },
  { platform: 'Twitter', engagement: 2100 },
];

interface Activity {
  id: string;
  type: 'lead' | 'publication' | 'commande' | 'facture' | 'paiement';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'info';
}

export default function DashboardPage() {
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'facture',
      title: 'Nouvelle facture payée',
      description: 'FAC-2026-001 - Entreprise ABC - 6,000€',
      timestamp: new Date(2026, 0, 4, 10, 30),
      status: 'success',
    },
    {
      id: '2',
      type: 'commande',
      title: 'Commande expédiée',
      description: 'CMD-2026-012 - Formation React avancé',
      timestamp: new Date(2026, 0, 4, 9, 15),
      status: 'info',
    },
    {
      id: '3',
      type: 'lead',
      title: 'Nouveau prospect qualifié',
      description: 'Sophie Martin - Startup Tech',
      timestamp: new Date(2026, 0, 4, 8, 45),
      status: 'success',
    },
    {
      id: '4',
      type: 'publication',
      title: 'Publication programmée',
      description: 'Post Instagram - Lancement nouveau produit',
      timestamp: new Date(2026, 0, 4, 8, 0),
      status: 'info',
    },
    {
      id: '5',
      type: 'paiement',
      title: 'Paiement en retard',
      description: 'FAC-2026-003 - Commerce Local - 1,440€',
      timestamp: new Date(2026, 0, 3, 16, 20),
      status: 'warning',
    },
  ]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lead':
        return <Users className="h-4 w-4" />;
      case 'publication':
        return <Send className="h-4 w-4" />;
      case 'commande':
        return <ShoppingCart className="h-4 w-4" />;
      case 'facture':
        return <FileText className="h-4 w-4" />;
      case 'paiement':
        return <Euro className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre activité MyPostelma
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Rapports
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Action rapide
          </Button>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CRM */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Leads Actifs</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12% ce mois
            </div>
            <Link to="/crm/leads" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Voir CRM →
            </Link>
          </CardContent>
        </Card>

        {/* Marketing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Publications ce mois</span>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8% engagement
            </div>
            <Link to="/marketing/publications" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Voir Marketing →
            </Link>
          </CardContent>
        </Card>

        {/* Vente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Commandes actives</span>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              3 à expédier
            </div>
            <Link to="/vente/commandes" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Voir Vente →
            </Link>
          </CardContent>
        </Card>

        {/* Compta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>CA ce mois</span>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">25K€</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              2 factures en retard
            </div>
            <Link to="/compta/factures" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Voir Compta →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Évolution du CA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Évolution du CA</span>
              <Badge variant="outline">6 derniers mois</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="vente" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Vente" />
                <Area type="monotone" dataKey="compta" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Compta" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline CRM */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pipeline CRM</span>
              <Badge variant="outline">88 total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={leadsPipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Nombre" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Performance Marketing par Plateforme</span>
            <Badge className="bg-blue-600">Social Media</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={marketingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="platform" type="category" />
              <Tooltip />
              <Bar dataKey="engagement" fill="#f59e0b" name="Engagement" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activité Récente et Actions Rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activité récente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {activity.timestamp.toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions Rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/crm/leads">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Nouveau lead
              </Button>
            </Link>
            <Link to="/marketing/creation">
              <Button variant="outline" className="w-full justify-start">
                <Send className="mr-2 h-4 w-4" />
                Créer publication
              </Button>
            </Link>
            <Link to="/vente/devis">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Nouveau devis
              </Button>
            </Link>
            <Link to="/compta/factures">
              <Button variant="outline" className="w-full justify-start">
                <Euro className="mr-2 h-4 w-4" />
                Créer facture
              </Button>
            </Link>
            <Link to="/reporting/analytics">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Voir analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Objectifs et Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Objectifs du mois */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Objectifs du mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CA mensuel</span>
                <span className="text-sm text-muted-foreground">25K€ / 30K€</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '83%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Nouveaux clients</span>
                <span className="text-sm text-muted-foreground">8 / 10</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Publications sociales</span>
                <span className="text-sm text-muted-foreground">28 / 40</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Alertes et Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-red-900">2 factures en retard</div>
                <div className="text-xs text-red-700">Relancer les clients impayés</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-orange-900">5 contrats à renouveler</div>
                <div className="text-xs text-orange-700">Échéance dans 15 jours</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-yellow-900">3 articles en stock faible</div>
                <div className="text-xs text-yellow-700">Réapprovisionner rapidement</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
