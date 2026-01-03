/**
 * Rapports Personnalisés Page
 *
 * Créez, planifiez et gérez vos rapports personnalisés.
 * Génération automatique de rapports PDF/Excel avec métriques personnalisables.
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Plus,
  Download,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'analytics' | 'crm' | 'marketing' | 'global';
  format: 'pdf' | 'excel' | 'both';
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  status: 'active' | 'paused' | 'draft';
  lastGenerated?: Date;
  nextScheduled?: Date;
  metrics: string[];
  recipients: string[];
  createdAt: Date;
}

const AVAILABLE_METRICS = [
  { id: 'followers', label: 'Nombre d\'abonnés', category: 'analytics' },
  { id: 'reach', label: 'Portée', category: 'analytics' },
  { id: 'impressions', label: 'Impressions', category: 'analytics' },
  { id: 'engagement', label: 'Taux d\'engagement', category: 'analytics' },
  { id: 'leads', label: 'Nouveaux leads', category: 'crm' },
  { id: 'conversions', label: 'Conversions', category: 'crm' },
  { id: 'clients', label: 'Nouveaux clients', category: 'crm' },
  { id: 'publications', label: 'Publications', category: 'marketing' },
  { id: 'campaigns', label: 'Campagnes actives', category: 'marketing' },
  { id: 'revenue', label: 'Chiffre d\'affaires', category: 'global' },
];

const REPORT_TEMPLATES = [
  {
    id: 'weekly-social',
    name: 'Rapport Hebdomadaire Social Media',
    description: 'Performances de vos réseaux sociaux sur la semaine',
    type: 'analytics' as const,
    metrics: ['followers', 'reach', 'impressions', 'engagement'],
  },
  {
    id: 'monthly-crm',
    name: 'Rapport Mensuel CRM',
    description: 'Évolution du pipeline commercial',
    type: 'crm' as const,
    metrics: ['leads', 'conversions', 'clients'],
  },
  {
    id: 'monthly-global',
    name: 'Rapport de Direction',
    description: 'Vue d\'ensemble complète de l\'activité',
    type: 'global' as const,
    metrics: ['followers', 'leads', 'clients', 'publications', 'revenue'],
  },
];

export default function RapportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      name: 'Rapport Hebdomadaire Social Media',
      description: 'Performances des réseaux sociaux',
      type: 'analytics',
      format: 'pdf',
      frequency: 'weekly',
      status: 'active',
      lastGenerated: new Date(2026, 0, 1),
      nextScheduled: new Date(2026, 0, 8),
      metrics: ['followers', 'reach', 'impressions', 'engagement'],
      recipients: ['you@example.com'],
      createdAt: new Date(2025, 11, 1),
    },
    {
      id: '2',
      name: 'Rapport Mensuel CRM',
      description: 'Pipeline commercial et conversions',
      type: 'crm',
      format: 'excel',
      frequency: 'monthly',
      status: 'active',
      lastGenerated: new Date(2025, 11, 1),
      nextScheduled: new Date(2026, 1, 1),
      metrics: ['leads', 'conversions', 'clients'],
      recipients: ['sales@example.com', 'you@example.com'],
      createdAt: new Date(2025, 10, 15),
    },
    {
      id: '3',
      name: 'Rapport Concurrence',
      description: 'Analyse comparative avec concurrents',
      type: 'marketing',
      format: 'pdf',
      frequency: 'manual',
      status: 'draft',
      metrics: ['followers', 'engagement'],
      recipients: [],
      createdAt: new Date(2026, 0, 2),
    },
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    type: 'analytics' as Report['type'],
    format: 'pdf' as Report['format'],
    frequency: 'weekly' as Report['frequency'],
    metrics: [] as string[],
    recipients: '',
  });

  const handleCreateReport = () => {
    const report: Report = {
      id: Date.now().toString(),
      name: newReport.name,
      description: newReport.description,
      type: newReport.type,
      format: newReport.format,
      frequency: newReport.frequency,
      status: 'draft',
      metrics: newReport.metrics,
      recipients: newReport.recipients.split(',').map(r => r.trim()).filter(Boolean),
      createdAt: new Date(),
    };

    setReports([report, ...reports]);
    setIsCreateDialogOpen(false);
    setNewReport({
      name: '',
      description: '',
      type: 'analytics',
      format: 'pdf',
      frequency: 'weekly',
      metrics: [],
      recipients: '',
    });

    toast({
      title: 'Rapport créé',
      description: 'Le rapport a été créé avec succès.',
    });
  };

  const handleToggleMetric = (metricId: string) => {
    setNewReport(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId],
    }));
  };

  const handleUseTemplate = (template: typeof REPORT_TEMPLATES[0]) => {
    setNewReport(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      type: template.type,
      metrics: template.metrics,
    }));
  };

  const handleGenerateNow = (reportId: string) => {
    toast({
      title: 'Génération en cours',
      description: 'Le rapport est en cours de génération...',
    });

    // Simuler la génération
    setTimeout(() => {
      setReports(reports.map(r =>
        r.id === reportId ? { ...r, lastGenerated: new Date() } : r
      ));
      toast({
        title: 'Rapport généré',
        description: 'Le rapport a été généré et envoyé.',
      });
    }, 2000);
  };

  const handleToggleStatus = (reportId: string) => {
    setReports(reports.map(r =>
      r.id === reportId
        ? { ...r, status: r.status === 'active' ? 'paused' : 'active' }
        : r
    ));
  };

  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter(r => r.id !== reportId));
    toast({
      title: 'Rapport supprimé',
      description: 'Le rapport a été supprimé.',
    });
  };

  const getTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
      case 'crm':
        return <Users className="h-4 w-4" />;
      case 'marketing':
        return <TrendingUp className="h-4 w-4" />;
      case 'global':
        return <Target className="h-4 w-4" />;
    }
  };

  const getFrequencyLabel = (frequency: Report['frequency']) => {
    switch (frequency) {
      case 'daily':
        return 'Quotidien';
      case 'weekly':
        return 'Hebdomadaire';
      case 'monthly':
        return 'Mensuel';
      case 'manual':
        return 'Manuel';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Rapports Personnalisés
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez et planifiez vos rapports automatiques
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau rapport</DialogTitle>
              <DialogDescription>
                Personnalisez votre rapport avec les métriques et la fréquence de votre choix
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Templates */}
              <div>
                <Label className="mb-2">Modèles prédéfinis</Label>
                <div className="grid grid-cols-3 gap-2">
                  {REPORT_TEMPLATES.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="justify-start"
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      {template.name.split(' ')[0]}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="name">Nom du rapport</Label>
                <Input
                  id="name"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="Ex: Rapport Hebdomadaire..."
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Décrivez l'objectif du rapport..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type de rapport</Label>
                  <Select
                    value={newReport.type}
                    onValueChange={(value) => setNewReport({ ...newReport, type: value as Report['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Format</Label>
                  <Select
                    value={newReport.format}
                    onValueChange={(value) => setNewReport({ ...newReport, format: value as Report['format'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="both">PDF + Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Fréquence</Label>
                <Select
                  value={newReport.frequency}
                  onValueChange={(value) => setNewReport({ ...newReport, frequency: value as Report['frequency'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="manual">Manuel uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-3">Métriques à inclure</Label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_METRICS.map(metric => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={newReport.metrics.includes(metric.id)}
                        onCheckedChange={() => handleToggleMetric(metric.id)}
                      />
                      <label
                        htmlFor={metric.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {metric.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="recipients">Destinataires (emails séparés par virgule)</Label>
                <Input
                  id="recipients"
                  value={newReport.recipients}
                  onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateReport} disabled={!newReport.name || newReport.metrics.length === 0}>
                Créer le rapport
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Rapports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En pause</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reports.filter(r => r.status === 'paused').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {reports.filter(r => r.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mes rapports</h2>
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun rapport</h3>
              <p className="text-muted-foreground mb-6">
                Créez votre premier rapport personnalisé pour suivre vos performances
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un rapport
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        {getTypeIcon(report.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <CardDescription>{report.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(report.id)}
                      >
                        {report.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateNow(report.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <Badge
                        variant={
                          report.status === 'active'
                            ? 'default'
                            : report.status === 'paused'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={
                          report.status === 'active'
                            ? 'bg-green-600'
                            : report.status === 'paused'
                            ? 'bg-orange-600 text-white'
                            : ''
                        }
                      >
                        {report.status === 'active' ? 'Actif' : report.status === 'paused' ? 'En pause' : 'Brouillon'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Fréquence
                      </p>
                      <p className="font-medium">{getFrequencyLabel(report.frequency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">
                        <FileText className="inline h-3 w-3 mr-1" />
                        Format
                      </p>
                      <p className="font-medium uppercase">{report.format}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Dernière génération
                      </p>
                      <p className="font-medium">
                        {report.lastGenerated
                          ? report.lastGenerated.toLocaleDateString('fr-FR')
                          : 'Jamais'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {report.metrics.map(metricId => {
                      const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
                      return metric ? (
                        <Badge key={metricId} variant="outline">
                          {metric.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
