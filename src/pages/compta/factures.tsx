/**
 * Factures Page - Module Compta
 * Gestion des factures clients avec génération automatique
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Send, Download, Eye, AlertCircle, CheckCircle2, Clock, Euro } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Facture {
  id: string;
  number: string;
  clientName: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  totalHT: number;
  totalTTC: number;
  dueDate: Date;
  paidDate?: Date;
  createdAt: Date;
}

export default function FacturesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [factures] = useState<Facture[]>([
    {
      id: '1',
      number: 'FAC-2026-001',
      clientName: 'Entreprise ABC',
      status: 'paid',
      totalHT: 5000,
      totalTTC: 6000,
      dueDate: new Date(2026, 0, 30),
      paidDate: new Date(2026, 0, 15),
      createdAt: new Date(2026, 0, 5),
    },
    {
      id: '2',
      number: 'FAC-2026-002',
      clientName: 'Startup XYZ',
      status: 'sent',
      totalHT: 3500,
      totalTTC: 4200,
      dueDate: new Date(2026, 1, 5),
      createdAt: new Date(2026, 0, 8),
    },
    {
      id: '3',
      number: 'FAC-2026-003',
      clientName: 'Commerce Local',
      status: 'overdue',
      totalHT: 1200,
      totalTTC: 1440,
      dueDate: new Date(2026, 0, 10),
      createdAt: new Date(2025, 11, 28),
    },
  ]);

  const filteredFactures = factures.filter((f) => {
    const matchesSearch = f.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: factures.length,
    paid: factures.filter((f) => f.status === 'paid').length,
    overdue: factures.filter((f) => f.status === 'overdue').length,
    revenue: factures.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.totalTTC, 0),
  };

  const getStatusBadge = (status: Facture['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case 'sent':
        return <Badge className="bg-blue-600"><Send className="h-3 w-3 mr-1" />Envoyée</Badge>;
      case 'paid':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />En retard</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Annulée</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Factures
          </h1>
          <p className="text-muted-foreground mt-1">Gestion de la facturation client</p>
        </div>
        <Button><FileText className="mr-2 h-4 w-4" />Nouvelle facture</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Total Factures</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Payées</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.paid}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">En retard</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.overdue}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">CA Encaissé</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.revenue.toLocaleString()}€</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="sent">Envoyées</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Montant TTC</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFactures.map((facture) => (
              <TableRow key={facture.id}>
                <TableCell><div className="font-mono font-semibold">{facture.number}</div></TableCell>
                <TableCell>{facture.clientName}</TableCell>
                <TableCell>{getStatusBadge(facture.status)}</TableCell>
                <TableCell><div className="font-semibold text-green-600">{facture.totalTTC.toLocaleString()}€</div></TableCell>
                <TableCell>{format(facture.dueDate, 'dd MMM yyyy', { locale: fr })}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm"><Send className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
