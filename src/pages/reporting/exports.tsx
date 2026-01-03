/**
 * Exports de Données Page
 *
 * Exportez vos données dans différents formats (CSV, Excel, JSON).
 * Configurez les colonnes, filtres et période d'export.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  FileText,
  Table as TableIcon,
  FileJson,
  Calendar,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DataType {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  availableColumns: { id: string; label: string; selected: boolean }[];
}

interface ExportHistory {
  id: string;
  dataType: string;
  format: string;
  period: string;
  recordsCount: number;
  status: 'completed' | 'processing' | 'failed';
  createdAt: Date;
  fileSize?: string;
}

const DATA_TYPES: DataType[] = [
  {
    id: 'leads',
    label: 'Leads CRM',
    description: 'Tous vos leads et prospects',
    icon: FileText,
    availableColumns: [
      { id: 'name', label: 'Nom', selected: true },
      { id: 'email', label: 'Email', selected: true },
      { id: 'phone', label: 'Téléphone', selected: true },
      { id: 'status', label: 'Statut', selected: true },
      { id: 'sector', label: 'Secteur', selected: true },
      { id: 'score', label: 'Score', selected: false },
      { id: 'city', label: 'Ville', selected: false },
      { id: 'created_at', label: 'Date création', selected: true },
    ],
  },
  {
    id: 'publications',
    label: 'Publications',
    description: 'Historique de vos publications sociales',
    icon: FileText,
    availableColumns: [
      { id: 'content', label: 'Contenu', selected: true },
      { id: 'platform', label: 'Plateforme', selected: true },
      { id: 'status', label: 'Statut', selected: true },
      { id: 'scheduled_date', label: 'Date planifiée', selected: true },
      { id: 'impressions', label: 'Impressions', selected: false },
      { id: 'likes', label: 'Likes', selected: false },
      { id: 'comments', label: 'Commentaires', selected: false },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Métriques de performance',
    icon: FileText,
    availableColumns: [
      { id: 'date', label: 'Date', selected: true },
      { id: 'platform', label: 'Plateforme', selected: true },
      { id: 'followers', label: 'Abonnés', selected: true },
      { id: 'reach', label: 'Portée', selected: true },
      { id: 'impressions', label: 'Impressions', selected: true },
      { id: 'engagement_rate', label: 'Taux engagement', selected: true },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    description: 'Liste de vos clients',
    icon: FileText,
    availableColumns: [
      { id: 'name', label: 'Nom', selected: true },
      { id: 'email', label: 'Email', selected: true },
      { id: 'phone', label: 'Téléphone', selected: true },
      { id: 'company', label: 'Entreprise', selected: true },
      { id: 'revenue', label: 'CA généré', selected: false },
      { id: 'conversion_date', label: 'Date conversion', selected: true },
    ],
  },
  {
    id: 'competitors',
    label: 'Concurrents',
    description: 'Données sur vos concurrents',
    icon: FileText,
    availableColumns: [
      { id: 'name', label: 'Nom', selected: true },
      { id: 'industry', label: 'Secteur', selected: true },
      { id: 'instagram_followers', label: 'Abonnés Instagram', selected: true },
      { id: 'facebook_likes', label: 'Likes Facebook', selected: false },
      { id: 'linkedin_followers', label: 'Abonnés LinkedIn', selected: false },
      { id: 'analysis_count', label: 'Nb analyses', selected: false },
    ],
  },
];

export default function ExportsPage() {
  const { toast } = useToast();
  const [selectedDataType, setSelectedDataType] = useState<string>('leads');
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [columns, setColumns] = useState<{ id: string; label: string; selected: boolean }[]>(
    DATA_TYPES[0].availableColumns
  );
  const [isExporting, setIsExporting] = useState(false);

  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([
    {
      id: '1',
      dataType: 'Leads CRM',
      format: 'CSV',
      period: 'Tous',
      recordsCount: 1247,
      status: 'completed',
      createdAt: new Date(2026, 0, 2, 14, 30),
      fileSize: '245 KB',
    },
    {
      id: '2',
      dataType: 'Analytics',
      format: 'Excel',
      period: '30 derniers jours',
      recordsCount: 90,
      status: 'completed',
      createdAt: new Date(2026, 0, 1, 10, 15),
      fileSize: '128 KB',
    },
    {
      id: '3',
      dataType: 'Publications',
      format: 'JSON',
      period: '7 derniers jours',
      recordsCount: 42,
      status: 'processing',
      createdAt: new Date(2026, 0, 3, 9, 0),
    },
  ]);

  const currentDataType = DATA_TYPES.find(dt => dt.id === selectedDataType) || DATA_TYPES[0];

  const handleDataTypeChange = (value: string) => {
    setSelectedDataType(value);
    const dataType = DATA_TYPES.find(dt => dt.id === value);
    if (dataType) {
      setColumns(dataType.availableColumns);
    }
  };

  const handleToggleColumn = (columnId: string) => {
    setColumns(columns.map(col =>
      col.id === columnId ? { ...col, selected: !col.selected } : col
    ));
  };

  const handleSelectAllColumns = () => {
    const allSelected = columns.every(col => col.selected);
    setColumns(columns.map(col => ({ ...col, selected: !allSelected })));
  };

  const handleExport = async () => {
    setIsExporting(true);

    // Simuler l'export
    setTimeout(() => {
      const newExport: ExportHistory = {
        id: Date.now().toString(),
        dataType: currentDataType.label,
        format: selectedFormat.toUpperCase(),
        period: getPeriodLabel(selectedPeriod),
        recordsCount: Math.floor(Math.random() * 2000),
        status: 'completed',
        createdAt: new Date(),
        fileSize: `${Math.floor(Math.random() * 500)}KB`,
      };

      setExportHistory([newExport, ...exportHistory]);
      setIsExporting(false);

      toast({
        title: 'Export terminé',
        description: `Votre fichier ${selectedFormat.toUpperCase()} est prêt à être téléchargé.`,
      });
    }, 2000);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'all':
        return 'Tous';
      case '7days':
        return '7 derniers jours';
      case '30days':
        return '30 derniers jours';
      case '90days':
        return '90 derniers jours';
      case '1year':
        return '1 an';
      default:
        return period;
    }
  };

  const getStatusBadge = (status: ExportHistory['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            En cours
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            Échec
          </Badge>
        );
    }
  };

  const selectedColumnsCount = columns.filter(col => col.selected).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Download className="h-8 w-8" />
          Exports de Données
        </h1>
        <p className="text-muted-foreground mt-1">
          Exportez vos données dans le format de votre choix
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de l'export</CardTitle>
              <CardDescription>
                Sélectionnez le type de données et le format souhaité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type de données */}
              <div>
                <Label className="mb-3">Type de données</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DATA_TYPES.map(dataType => (
                    <Card
                      key={dataType.id}
                      className={`cursor-pointer transition-all ${
                        selectedDataType === dataType.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleDataTypeChange(dataType.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedDataType === dataType.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <dataType.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{dataType.label}</h4>
                            <p className="text-xs text-muted-foreground">
                              {dataType.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Format et période */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <TableIcon className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Excel (.xlsx)
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Période</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les données</SelectItem>
                      <SelectItem value="7days">7 derniers jours</SelectItem>
                      <SelectItem value="30days">30 derniers jours</SelectItem>
                      <SelectItem value="90days">90 derniers jours</SelectItem>
                      <SelectItem value="1year">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Colonnes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>
                    Colonnes à exporter ({selectedColumnsCount}/{columns.length})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllColumns}
                  >
                    {columns.every(col => col.selected) ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                  {columns.map(column => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={column.selected}
                        onCheckedChange={() => handleToggleColumn(column.id)}
                      />
                      <label
                        htmlFor={column.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bouton d'export */}
              <Button
                onClick={handleExport}
                disabled={isExporting || selectedColumnsCount === 0}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Exporter {selectedColumnsCount} colonne{selectedColumnsCount > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Historique */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique
              </CardTitle>
              <CardDescription>
                Vos derniers exports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {exportHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun export pour le moment
                </p>
              ) : (
                exportHistory.map(exp => (
                  <Card key={exp.id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{exp.dataType}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(exp.createdAt, 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                        {getStatusBadge(exp.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{exp.format}</span>
                        <span>•</span>
                        <span>{exp.recordsCount.toLocaleString()} lignes</span>
                        {exp.fileSize && (
                          <>
                            <span>•</span>
                            <span>{exp.fileSize}</span>
                          </>
                        )}
                      </div>
                      {exp.status === 'completed' && (
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          <Download className="h-3 w-3 mr-2" />
                          Télécharger
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">À propos des exports</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-900 space-y-2">
              <p>
                • Les exports sont limités à 10 000 lignes
              </p>
              <p>
                • Les fichiers sont disponibles pendant 7 jours
              </p>
              <p>
                • Les données sensibles sont automatiquement masquées
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
