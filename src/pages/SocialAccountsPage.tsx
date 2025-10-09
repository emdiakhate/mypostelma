/**
 * Page de gestion des comptes sociaux
 * Phase 2: Gestion Multi-Comptes Sociaux
 */

import React, { useState, useMemo } from 'react';
import { SocialAccount, ConnectionStatus, MOCK_CONNECTED_ACCOUNTS, MOCK_CONNECTION_STATUS, PLATFORM_CONFIG } from '@/types/socialAccount';
import { useSocialAccounts } from '@/hooks/usePersistentState';
import { MOCK_SOCIAL_ACCOUNTS, getRecommendations } from '@/data/mockSocialAccounts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlatformCard from '@/components/PlatformCard';
import ConnectedAccountCard from '@/components/ConnectedAccountCard';
import ConnectAccountModal from '@/components/ConnectAccountModal';
import DisconnectAccountModal from '@/components/DisconnectAccountModal';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  Settings,
  BarChart3,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SocialAccountsPage: React.FC = () => {
  const { accounts: connectedAccounts, syncAllAccounts } = useSocialAccounts(MOCK_SOCIAL_ACCOUNTS);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus[]>(MOCK_CONNECTION_STATUS);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accountToDisconnect, setAccountToDisconnect] = useState<SocialAccount | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    platform: 'all' as string,
    status: 'all' as string
  });

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalConnected = connectedAccounts.length;
    const totalAvailable = connectionStatus.filter(s => s.isAvailable).length;
    const maxAccounts = connectionStatus.reduce((sum, s) => sum + s.maxAccounts, 0);
    
    const platformStats = connectionStatus.map(status => ({
      platform: status.platform,
      connected: status.accountCount,
      max: status.maxAccounts,
      available: status.isAvailable
    }));

    return {
      totalConnected,
      totalAvailable,
      maxAccounts,
      platformStats
    };
  }, [connectedAccounts, connectionStatus]);

  // Filtrer les comptes connectés
  const filteredAccounts = useMemo(() => {
    let filtered = [...connectedAccounts];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(account => 
        account.username.toLowerCase().includes(searchLower) ||
        account.displayName.toLowerCase().includes(searchLower) ||
        account.platform.toLowerCase().includes(searchLower)
      );
    }

    if (filters.platform !== 'all') {
      filtered = filtered.filter(account => account.platform === filters.platform);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(account => account.status === filters.status);
    }

    return filtered;
  }, [connectedAccounts, filters]);

  const handleConnectPlatform = (platform: string) => {
    setSelectedPlatform(platform);
    setShowConnectModal(true);
  };

  const handleConnectSuccess = (accountData: any) => {
    // La gestion est maintenant faite par useSocialAccounts
    console.log('Compte connecté:', accountData);
    
    // Mettre à jour le statut de connexion
    setConnectionStatus(prev => prev.map(status => 
      status.platform === accountData.platform 
        ? { ...status, isConnected: true, accountCount: status.accountCount + 1 }
        : status
    ));
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    
    try {
      // Simulation du délai de synchronisation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Synchroniser tous les comptes
      syncAllAccounts();
      
      // Toast de confirmation
      console.log(`✓ ${connectedAccounts.length} comptes synchronisés`);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshAccount = (accountId: string) => {
    // La gestion est maintenant faite par useSocialAccounts via le hook
    syncAllAccounts();
  };

  const handleRenameAccount = (accountId: string) => {
    const newName = prompt('Nouveau nom pour ce compte:');
    if (newName) {
      // Update via the hook - useSocialAccounts gère la persistence
      const account = connectedAccounts.find(a => a.id === accountId);
      if (account) {
        console.log('Renaming account:', accountId, newName);
      }
    }
  };

  const handleDisconnectAccount = (accountId: string) => {
    const account = connectedAccounts.find(a => a.id === accountId);
    if (account) {
      setAccountToDisconnect(account);
      setShowDisconnectModal(true);
    }
  };

  const handleConfirmDisconnect = (accountId: string) => {
    const account = connectedAccounts.find(a => a.id === accountId);
    if (account) {
      // Déjà géré par le modal qui modifie localStorage
      // Mettre à jour le statut de connexion
      setConnectionStatus(prev => prev.map(status => 
        status.platform === account.platform 
          ? { 
              ...status, 
              isConnected: status.accountCount - 1 > 0,
              accountCount: Math.max(0, status.accountCount - 1)
            }
          : status
      ));
      
      // Toast de confirmation
      console.log(`✓ ${account.platform} @${account.username} déconnecté`);
    }
  };

  const handleViewStats = (accountId: string) => {
    // TODO: Naviguer vers la page d'analytics filtrée
    console.log('Voir les stats pour:', accountId);
  };

  const handleUpgrade = () => {
    // TODO: Naviguer vers la page de pricing
    console.log('Passer à Pro');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptes Sociaux</h1>
          <p className="text-gray-600">
            Gérez vos comptes sociaux connectés et leurs permissions
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {stats.totalConnected}/{stats.maxAccounts} comptes connectés
          </Badge>
          
          <Button 
            onClick={handleSyncAll}
            disabled={isSyncing}
            variant="outline" 
            size="sm"
            className="transition-all duration-200 hover:bg-blue-50"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? 'Synchronisation...' : 'Rafraîchir tous les comptes'}
          </Button>
          
          {stats.totalConnected >= stats.maxAccounts && (
            <Button onClick={handleUpgrade} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Améliorer mon plan
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Connectés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConnected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAvailable}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Max</p>
                <p className="text-2xl font-bold text-gray-900">{stats.maxAccounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <RefreshCw className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dernière sync</p>
                <p className="text-2xl font-bold text-gray-900">2h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plateformes disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Plateformes Disponibles</span>
          </CardTitle>
          <CardDescription>
            Connectez vos comptes sociaux pour publier du contenu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.values(PLATFORM_CONFIG).map((config) => {
              const status = connectionStatus.find(s => s.platform === config.platform);
              if (!status) return null;
              
              return (
                <PlatformCard
                  key={config.platform}
                  platform={config.platform}
                  connectionStatus={status}
                  onConnect={handleConnectPlatform}
                  onUpgrade={handleUpgrade}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      {connectedAccounts.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <BarChart3 className="w-5 h-5" />
              <span>Recommandations</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Optimisez votre présence sur les réseaux sociaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecommendations(connectedAccounts, 'food').map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Connectez {rec.platform} pour élargir votre portée
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {rec.reason}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    Connecter
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comptes connectés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Comptes Connectés</span>
              </CardTitle>
              <CardDescription>
                Gérez vos comptes sociaux connectés
              </CardDescription>
            </div>
            
            {connectedAccounts.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un compte..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9 w-64"
                  />
                </div>
                
                <Select
                  value={filters.platform}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, platform: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Plateforme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {Object.values(PLATFORM_CONFIG).map(config => (
                      <SelectItem key={config.platform} value={config.platform}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="connected">Connecté</SelectItem>
                    <SelectItem value="reconnect_needed">Reconnexion</SelectItem>
                    <SelectItem value="disconnected">Déconnecté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {connectedAccounts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun compte connecté
              </h3>
              <p className="text-gray-600 mb-4">
                Connectez vos premiers comptes sociaux pour commencer à publier.
              </p>
              <Button onClick={() => setShowConnectModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Connecter un compte
              </Button>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucun compte ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAccounts.map((account) => (
                <ConnectedAccountCard
                  key={account.id}
                  account={account}
                  onRefresh={handleRefreshAccount}
                  onRename={handleRenameAccount}
                  onDisconnect={handleDisconnectAccount}
                  onViewStats={handleViewStats}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de connexion */}
      <ConnectAccountModal
        isOpen={showConnectModal}
        onClose={() => {
          setShowConnectModal(false);
          setSelectedPlatform(null);
        }}
        onSuccess={handleConnectSuccess}
        platform={selectedPlatform as any}
      />

      {/* Modal de déconnexion */}
      <DisconnectAccountModal
        isOpen={showDisconnectModal}
        onClose={() => {
          setShowDisconnectModal(false);
          setAccountToDisconnect(null);
        }}
        onConfirm={handleConfirmDisconnect}
        account={accountToDisconnect}
      />
    </div>
  );
};

export default SocialAccountsPage;
