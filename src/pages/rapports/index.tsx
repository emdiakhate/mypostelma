/**
 * Rapports - Page de génération et export de rapports
 *
 * Permet de créer des rapports personnalisés et de les exporter
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  Package,
  DollarSign,
} from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { exportToExcel, exportToCSV } from '@/lib/exportUtils';
import { formatCurrency } from '@/types/compta';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type ReportType = 'sales' | 'invoices' | 'clients' | 'stock' | 'global';

export default function RapportsPage() {
  const { toast } = useToast();

  // Filtres
  const [reportType, setReportType] = useState<ReportType>('global');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  const filters = useMemo(
    () => ({
      type: reportType,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      groupBy,
    }),
    [reportType, dateFrom, dateTo, groupBy]
  );

  const { data, loading } = useReports(filters);

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucune donnée à exporter',
        variant: 'destructive',
      });
      return;
    }

    try {
      const fileName = `rapport_${reportType}_${format(new Date(), 'yyyy-MM-dd')}`;
      exportToExcel(data, fileName);
      toast({
        title: 'Export réussi',
        description: 'Le rapport a été exporté en Excel',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucune donnée à exporter',
        variant: 'destructive',
      });
      return;
    }

    try {
      const fileName = `rapport_${reportType}_${format(new Date(), 'yyyy-MM-dd')}`;
      exportToCSV(data, fileName);
      toast({
        title: 'Export réussi',
        description: 'Le rapport a été exporté en CSV',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Rapports
          </h1>
          <p className="text-muted-foreground mt-1">
            Générez et exportez vos rapports d'activité
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={loading || !data}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          <Button onClick={handleExportExcel} disabled={loading || !data}>
            <Download className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Type de rapport</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Global
                    </div>
                  </SelectItem>
                  <SelectItem value="sales">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Ventes
                    </div>
                  </SelectItem>
                  <SelectItem value="invoices">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Factures
                    </div>
                  </SelectItem>
                  <SelectItem value="clients">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Clients
                    </div>
                  </SelectItem>
                  <SelectItem value="stock">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date de début</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Date de fin</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupBy">Regrouper par</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats</CardTitle>
          <CardDescription>
            {data?.length || 0} ligne(s) - Rapport {reportType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement des données...
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
              <p className="text-sm text-muted-foreground">
                Ajustez les filtres pour obtenir des résultats
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(data[0]).map((key) => (
                      <TableHead key={key} className="capitalize">
                        {key.replace(/_/g, ' ')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      {Object.entries(row).map(([key, value], i) => (
                        <TableCell key={i}>
                          {typeof value === 'number' && key.includes('total')
                            ? formatCurrency(value)
                            : typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)
                            ? format(new Date(value), 'dd/MM/yyyy', { locale: fr })
                            : String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
