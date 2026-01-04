/**
 * Service Client Page
 *
 * Gestion des tickets de support client.
 * Suivi des demandes, incidents et SAV.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Headphones,
  Plus,
  Search,
  Eye,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: string;
  author: string;
  message: string;
  createdAt: Date;
  isStaff: boolean;
}

const CATEGORIES = [
  'Question produit',
  'Problème technique',
  'Demande de remboursement',
  'Facturation',
  'Livraison',
  'Autre',
];

export default function ServiceClientPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      number: 'TICKET-001',
      subject: 'Problème de connexion à la plateforme',
      description: 'Je ne parviens plus à me connecter depuis ce matin',
      clientName: 'Jean Dupont',
      clientEmail: 'jean@example.com',
      status: 'in_progress',
      priority: 'high',
      category: 'Problème technique',
      assignedTo: 'Support Team',
      createdAt: new Date(2026, 0, 8),
      updatedAt: new Date(2026, 0, 8, 14, 30),
      responses: [
        {
          id: '1',
          author: 'Support Team',
          message: 'Bonjour, nous avons bien reçu votre demande. Pouvez-vous nous préciser le navigateur que vous utilisez ?',
          createdAt: new Date(2026, 0, 8, 10, 15),
          isStaff: true,
        },
        {
          id: '2',
          author: 'Jean Dupont',
          message: "J'utilise Chrome version 120",
          createdAt: new Date(2026, 0, 8, 11, 0),
          isStaff: false,
        },
      ],
    },
    {
      id: '2',
      number: 'TICKET-002',
      subject: 'Question sur la facturation',
      description: 'Je souhaite obtenir une facture pour ma dernière commande',
      clientName: 'Marie Martin',
      clientEmail: 'marie@company.fr',
      status: 'resolved',
      priority: 'medium',
      category: 'Facturation',
      assignedTo: 'Admin',
      createdAt: new Date(2026, 0, 7),
      updatedAt: new Date(2026, 0, 7, 16, 0),
      responses: [
        {
          id: '1',
          author: 'Admin',
          message: 'Bonjour Marie, votre facture a été envoyée par email.',
          createdAt: new Date(2026, 0, 7, 15, 30),
          isStaff: true,
        },
      ],
    },
    {
      id: '3',
      number: 'TICKET-003',
      subject: 'Délai de livraison',
      description: 'Ma commande n\'est toujours pas arrivée',
      clientName: 'Pierre Durand',
      clientEmail: 'pierre@mail.com',
      status: 'open',
      priority: 'urgent',
      category: 'Livraison',
      createdAt: new Date(2026, 0, 9),
      updatedAt: new Date(2026, 0, 9),
      responses: [],
    },
    {
      id: '4',
      number: 'TICKET-004',
      subject: 'Demande d\'information sur les fonctionnalités',
      description: 'Est-il possible d\'intégrer avec Zapier ?',
      clientName: 'Sophie Bernard',
      clientEmail: 'sophie@startup.io',
      status: 'closed',
      priority: 'low',
      category: 'Question produit',
      assignedTo: 'Sales',
      createdAt: new Date(2026, 0, 5),
      updatedAt: new Date(2026, 0, 6),
      responses: [
        {
          id: '1',
          author: 'Sales',
          message: 'Oui, nous avons une intégration Zapier disponible dans le plan Pro.',
          createdAt: new Date(2026, 0, 5, 14, 0),
          isStaff: true,
        },
      ],
    },
  ]);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    clientName: '',
    clientEmail: '',
    priority: 'medium' as Ticket['priority'],
    category: CATEGORIES[0],
  });

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    avgResponseTime: '2h 15min', // Mock
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-yellow-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Nouveau
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Résolu
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="bg-gray-100">
            Fermé
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-gray-100">
            <ArrowDown className="h-3 w-3 mr-1" />
            Basse
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-blue-100">
            <Minus className="h-3 w-3 mr-1" />
            Moyenne
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-orange-100">
            <ArrowUp className="h-3 w-3 mr-1" />
            Haute
          </Badge>
        );
      case 'urgent':
        return (
          <Badge variant="destructive">
            <ArrowUp className="h-3 w-3 mr-1" />
            Urgente
          </Badge>
        );
    }
  };

  const handleCreateTicket = () => {
    const ticket: Ticket = {
      id: Date.now().toString(),
      number: `TICKET-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newTicket.subject,
      description: newTicket.description,
      clientName: newTicket.clientName,
      clientEmail: newTicket.clientEmail,
      status: 'open',
      priority: newTicket.priority,
      category: newTicket.category,
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
    };

    setTickets([ticket, ...tickets]);
    setIsCreateDialogOpen(false);
    setNewTicket({
      subject: '',
      description: '',
      clientName: '',
      clientEmail: '',
      priority: 'medium',
      category: CATEGORIES[0],
    });

    toast({
      title: 'Ticket créé',
      description: 'Le ticket de support a été créé avec succès.',
    });
  };

  const handleUpdateStatus = (ticketId: string, newStatus: Ticket['status']) => {
    setTickets(
      tickets.map((t) =>
        t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date() } : t
      )
    );
    toast({
      title: 'Statut mis à jour',
      description: 'Le statut du ticket a été modifié.',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Headphones className="h-8 w-8" />
            Service Client
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les demandes de support client
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un ticket de support</DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle demande client
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du client</Label>
                  <Input
                    value={newTicket.clientName}
                    onChange={(e) => setNewTicket({ ...newTicket, clientName: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newTicket.clientEmail}
                    onChange={(e) => setNewTicket({ ...newTicket, clientEmail: e.target.value })}
                    placeholder="jean@example.com"
                  />
                </div>
              </div>

              <div>
                <Label>Sujet</Label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Problème de connexion..."
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Décrivez le problème en détail..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priorité</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value: Ticket['priority']) =>
                      setNewTicket({ ...newTicket, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicket.subject || !newTicket.clientName}
              >
                Créer le ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nouveaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Urgents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Temps Réponse Moy.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.avgResponseTime}</div>
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
                  placeholder="Rechercher un ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="open">Nouveaux</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolus</SelectItem>
                <SelectItem value="closed">Fermés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <div className="font-mono font-semibold">{ticket.number}</div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {ticket.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{ticket.clientName}</div>
                    <div className="text-xs text-muted-foreground">{ticket.clientEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ticket.category}</Badge>
                </TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(ticket.createdAt, 'dd MMM yyyy', { locale: fr })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(ticket.createdAt, 'HH:mm', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" title="Voir détails">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Répondre">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    {ticket.status === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Prendre en charge"
                        onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Marquer comme résolu"
                        onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun ticket</h3>
            <p className="text-muted-foreground">
              Les tickets de support apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
