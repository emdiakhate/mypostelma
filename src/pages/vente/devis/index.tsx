/**
 * Devis Page
 *
 * Gestion des devis commerciaux.
 * Création, édition, envoi et suivi des devis.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Search,
  Send,
  Download,
  Eye,
  Edit,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Euro,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Devis {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  totalHT: number;
  totalTTC: number;
  validUntil: Date;
  createdAt: Date;
  sentAt?: Date;
  items: DevisItem[];
}

interface DevisItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const TVA_RATE = 0.2; // 20%

export default function DevisPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [devisList, setDevisList] = useState<Devis[]>([
    {
      id: '1',
      number: 'DEV-2026-001',
      clientName: 'Entreprise ABC',
      clientEmail: 'contact@abc.com',
      status: 'sent',
      totalHT: 5000,
      totalTTC: 6000,
      validUntil: new Date(2026, 1, 15),
      createdAt: new Date(2026, 0, 2),
      sentAt: new Date(2026, 0, 3),
      items: [
        {
          id: '1',
          name: 'Formation Social Media Marketing',
          description: 'Formation complète sur 2 jours',
          quantity: 1,
          unitPrice: 1500,
          total: 1500,
        },
        {
          id: '2',
          name: 'Audit Réseaux Sociaux',
          description: 'Analyse complète',
          quantity: 1,
          unitPrice: 800,
          total: 800,
        },
        {
          id: '3',
          name: 'Gestion de Campagne',
          description: '20 heures de gestion',
          quantity: 20,
          unitPrice: 145,
          total: 2900,
        },
      ],
    },
    {
      id: '2',
      number: 'DEV-2026-002',
      clientName: 'Startup XYZ',
      clientEmail: 'hello@xyz.io',
      status: 'accepted',
      totalHT: 3500,
      totalTTC: 4200,
      validUntil: new Date(2026, 1, 20),
      createdAt: new Date(2026, 0, 5),
      sentAt: new Date(2026, 0, 5),
      items: [
        {
          id: '1',
          name: 'Abonnement MyPostelma Pro',
          description: '12 mois',
          quantity: 12,
          unitPrice: 99,
          total: 1188,
        },
        {
          id: '2',
          name: 'Formation',
          description: 'Formation équipe',
          quantity: 1,
          unitPrice: 2312,
          total: 2312,
        },
      ],
    },
    {
      id: '3',
      number: 'DEV-2026-003',
      clientName: 'Agency 360',
      clientEmail: 'team@360.fr',
      status: 'draft',
      totalHT: 12000,
      totalTTC: 14400,
      validUntil: new Date(2026, 1, 25),
      createdAt: new Date(2026, 0, 8),
      items: [
        {
          id: '1',
          name: 'Création de Site Web',
          description: 'Site responsive complet',
          quantity: 1,
          unitPrice: 8000,
          total: 8000,
        },
        {
          id: '2',
          name: 'SEO',
          description: 'Optimisation SEO',
          quantity: 1,
          unitPrice: 4000,
          total: 4000,
        },
      ],
    },
    {
      id: '4',
      number: 'DEV-2025-124',
      clientName: 'Commerce Local',
      clientEmail: 'info@local.com',
      status: 'rejected',
      totalHT: 2400,
      totalTTC: 2880,
      validUntil: new Date(2026, 0, 10),
      createdAt: new Date(2025, 11, 20),
      sentAt: new Date(2025, 11, 21),
      items: [
        {
          id: '1',
          name: 'Gestion de Campagne',
          description: '15 heures',
          quantity: 15,
          unitPrice: 160,
          total: 2400,
        },
      ],
    },
  ]);

  const filteredDevis = devisList.filter((devis) => {
    const matchesSearch =
      devis.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devis.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devis.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || devis.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: devisList.length,
    draft: devisList.filter((d) => d.status === 'draft').length,
    sent: devisList.filter((d) => d.status === 'sent').length,
    accepted: devisList.filter((d) => d.status === 'accepted').length,
    revenue: devisList
      .filter((d) => d.status === 'accepted')
      .reduce((sum, d) => sum + d.totalTTC, 0),
  };

  const getStatusBadge = (status: Devis['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-gray-100">
            <Edit className="h-3 w-3 mr-1" />
            Brouillon
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-blue-600">
            <Send className="h-3 w-3 mr-1" />
            Envoyé
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepté
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Refusé
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-orange-100">
            <Clock className="h-3 w-3 mr-1" />
            Expiré
          </Badge>
        );
    }
  };

  const handleSendDevis = (devisId: string) => {
    setDevisList(
      devisList.map((d) =>
        d.id === devisId ? { ...d, status: 'sent', sentAt: new Date() } : d
      )
    );
    toast({
      title: 'Devis envoyé',
      description: 'Le devis a été envoyé au client par email.',
    });
  };

  const handleDuplicateDevis = (devis: Devis) => {
    const newDevis: Devis = {
      ...devis,
      id: Date.now().toString(),
      number: `DEV-2026-${String(devisList.length + 1).padStart(3, '0')}`,
      status: 'draft',
      createdAt: new Date(),
      sentAt: undefined,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
    };
    setDevisList([newDevis, ...devisList]);
    toast({
      title: 'Devis dupliqué',
      description: 'Le devis a été dupliqué avec succès.',
    });
  };

  const conversionRate =
    stats.sent + stats.accepted > 0
      ? ((stats.accepted / (stats.sent + stats.accepted)) * 100).toFixed(1)
      : '0';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Devis
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos devis commerciaux
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau devis
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Devis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Acceptés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taux: {conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">CA Signé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.revenue.toLocaleString()}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="sent">Envoyés</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="rejected">Refusés</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Devis List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Montant HT</TableHead>
              <TableHead>Montant TTC</TableHead>
              <TableHead>Valide jusqu'au</TableHead>
              <TableHead>Date création</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevis.map((devis) => (
              <TableRow key={devis.id}>
                <TableCell>
                  <div className="font-mono font-semibold">{devis.number}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{devis.clientName}</div>
                    <div className="text-xs text-muted-foreground">{devis.clientEmail}</div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(devis.status)}</TableCell>
                <TableCell>
                  <div className="font-semibold">{devis.totalHT.toLocaleString()}€</div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-green-600">
                    {devis.totalTTC.toLocaleString()}€
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(devis.validUntil, 'dd MMM yyyy', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(devis.createdAt, 'dd MMM yyyy', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" title="Voir">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {devis.status === 'draft' && (
                      <>
                        <Button variant="ghost" size="sm" title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Envoyer"
                          onClick={() => handleSendDevis(devis.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Télécharger PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Dupliquer"
                      onClick={() => handleDuplicateDevis(devis)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredDevis.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun devis</h3>
            <p className="text-muted-foreground mb-6">
              Créez votre premier devis pour vos clients
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un devis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
