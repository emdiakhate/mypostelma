/**
 * Module Administration - Administration Système
 * Gestion du système, logs, sauvegardes, maintenance
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Server,
  Database,
  Activity,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Cpu,
  MemoryStick,
  Flag,
  FileText,
  Clock,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { FEATURE_FLAGS } from '@/config/featureFlags';

interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  module?: string;
}

export default function SystemePage() {
  const [logs] = useState<SystemLog[]>([
    {
      id: '1',
      timestamp: new Date(2026, 0, 4, 10, 30),
      level: 'info',
      message: 'Sauvegarde automatique effectuée avec succès',
      module: 'Backup',
    },
    {
      id: '2',
      timestamp: new Date(2026, 0, 4, 9, 15),
      level: 'warning',
      message: 'Utilisation mémoire élevée: 78%',
      module: 'System',
    },
    {
      id: '3',
      timestamp: new Date(2026, 0, 4, 8, 45),
      level: 'info',
      message: 'Déploiement de la nouvelle version v2.5.0',
      module: 'Deploy',
    },
    {
      id: '4',
      timestamp: new Date(2026, 0, 4, 8, 0),
      level: 'error',
      message: 'Échec de connexion à la base de données externe',
      module: 'Database',
    },
    {
      id: '5',
      timestamp: new Date(2026, 0, 3, 22, 30),
      level: 'info',
      message: 'Nettoyage des fichiers temporaires terminé',
      module: 'Maintenance',
    },
  ]);

  const getLogIcon = (level: SystemLog['level']) => {
    switch (level) {
      case 'info':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getLogColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'error':
        return 'text-red-600 bg-red-50';
    }
  };

  const systemInfo = {
    version: '2.5.0',
    environment: 'Production',
    uptime: '15 jours, 7 heures',
    lastBackup: new Date(2026, 0, 4, 2, 0),
    nextBackup: new Date(2026, 0, 5, 2, 0),
  };

  const resources = {
    cpu: 45,
    memory: 68,
    storage: 72,
    database: 55,
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Server className="h-8 w-8" />
            Administration Système
          </h1>
          <p className="text-muted-foreground mt-1">
            Surveillance et maintenance du système MyPostelma
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Informations Système */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Version</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo.version}</div>
            <Badge className="mt-2 bg-green-600">{systemInfo.environment}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Uptime</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{systemInfo.uptime}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>CPU</span>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.cpu}%</div>
            <Progress value={resources.cpu} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Mémoire</span>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.memory}%</div>
            <Progress value={resources.memory} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Stockage</span>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.storage}%</div>
            <Progress value={resources.storage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags
          </CardTitle>
          <CardDescription>
            État des fonctionnalités de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(FEATURE_FLAGS).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{key}</div>
                </div>
                <Badge className={value ? 'bg-green-600' : 'bg-gray-600'}>
                  {value ? 'ON' : 'OFF'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sauvegardes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sauvegardes
            </CardTitle>
            <CardDescription>
              Gestion des sauvegardes de données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dernière sauvegarde</span>
                <span className="font-medium">
                  {systemInfo.lastBackup.toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prochaine sauvegarde</span>
                <span className="font-medium">
                  {systemInfo.nextBackup.toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fréquence</span>
                <span className="font-medium">Quotidienne (2h00)</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Télécharger la dernière sauvegarde
              </Button>
              <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Restaurer depuis une sauvegarde
              </Button>
              <Button className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Lancer une sauvegarde maintenant
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              État du Système
            </CardTitle>
            <CardDescription>
              Statut des services et composants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Base de données</span>
              </div>
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Opérationnel
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="text-sm font-medium">API Backend</span>
              </div>
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Opérationnel
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm font-medium">Stockage Cloud</span>
              </div>
              <Badge className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Opérationnel
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Cache Redis</span>
              </div>
              <Badge className="bg-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Dégradé
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs Système
          </CardTitle>
          <CardDescription>
            Dernières activités et événements du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${getLogColor(log.level)}`}
              >
                {getLogIcon(log.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.message}</span>
                    {log.module && (
                      <Badge variant="outline" className="text-xs">
                        {log.module}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {log.timestamp.toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            Voir tous les logs
          </Button>
        </CardContent>
      </Card>

      {/* Actions Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Actions de Maintenance
          </CardTitle>
          <CardDescription>
            Opérations système et maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Vider le cache
            </Button>
            <Button variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Optimiser BDD
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Nettoyer fichiers temp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
