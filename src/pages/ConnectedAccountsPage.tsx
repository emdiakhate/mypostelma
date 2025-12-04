import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, Send, Phone, CheckCircle, AlertCircle, Loader2, Trash2, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getConnectedAccountsWithStats,
  disconnectAccount,
  testConnection,
  syncAccountMessages,
} from '@/services/connectedAccounts';
import type { ConnectedAccountWithStats, Platform } from '@/types/inbox';
import ConnectGmailModal from '@/components/inbox/ConnectGmailModal';
import ConnectOutlookModal from '@/components/inbox/ConnectOutlookModal';
import ConnectTelegramModal from '@/components/inbox/ConnectTelegramModal';
import ConnectWhatsAppModal from '@/components/inbox/ConnectWhatsAppModal';

// Platform configurations
const PLATFORM_CONFIG: Record<
  Platform,
  {
    name: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    available: boolean;
  }
> = {
  gmail: {
    name: 'Gmail',
    icon: <Mail className="w-6 h-6" />,
    color: 'bg-red-500',
    description: 'Recevez et répondez aux emails Gmail',
    available: true,
  },
  outlook: {
    name: 'Outlook',
    icon: <Mail className="w-6 h-6" />,
    color: 'bg-blue-500',
    description: 'Recevez et répondez aux emails Outlook',
    available: true,
  },
  telegram: {
    name: 'Telegram',
    icon: <Send className="w-6 h-6" />,
    color: 'bg-sky-500',
    description: 'Connectez votre bot Telegram',
    available: true,
  },
  whatsapp_twilio: {
    name: 'WhatsApp (Twilio)',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'bg-green-500',
    description: 'Connectez WhatsApp via Twilio',
    available: true,
  },
  instagram: {
    name: 'Instagram',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    description: 'Bientôt disponible',
    available: false,
  },
  facebook: {
    name: 'Facebook',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'bg-blue-600',
    description: 'Bientôt disponible',
    available: false,
  },
  twitter: {
    name: 'Twitter / X',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'bg-black',
    description: 'Bientôt disponible',
    available: false,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'bg-blue-700',
    description: 'Bientôt disponible',
    available: false,
  },
  tiktok: {
    name: 'TikTok',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'bg-black',
    description: 'Bientôt disponible',
    available: false,
  },
};

export default function ConnectedAccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccountWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState<Platform | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  // Auto-sync every 30 seconds for email accounts
  useEffect(() => {
    if (!user || accounts.length === 0) return;

    const syncAllEmailAccounts = async () => {
      const emailAccounts = accounts.filter(acc => ['gmail', 'outlook'].includes(acc.platform) && acc.status === 'active');
      for (const account of emailAccounts) {
        try {
          await syncAccountMessages(account.id);
        } catch (error) {
          console.error('Auto-sync error for account:', account.id, error);
        }
      }
    };

    // Initial sync
    syncAllEmailAccounts();

    // Set up interval for periodic sync
    const interval = setInterval(syncAllEmailAccounts, 30000);

    return () => clearInterval(interval);
  }, [user, accounts.length]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getConnectedAccountsWithStats(user!.id);
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter ce compte ?')) return;

    try {
      setActionLoading(accountId);
      await disconnectAccount(accountId);
      await loadAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      alert('Erreur lors de la déconnexion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTest = async (accountId: string) => {
    try {
      setActionLoading(accountId);
      const result = await testConnection(accountId);
      if (result.success) {
        alert('Connexion réussie !');
        await loadAccounts();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Erreur lors du test');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (accountId: string) => {
    try {
      setActionLoading(accountId);
      const result = await syncAccountMessages(accountId);
      alert(`${result.synced} messages synchronisés`);
      await loadAccounts();
    } catch (error) {
      console.error('Error syncing messages:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setActionLoading(null);
    }
  };

  const getConnectedAccount = (platform: Platform) => {
    return accounts.find((acc) => acc.platform === platform);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comptes connectés</h1>
        <p className="text-gray-600">
          Connectez vos comptes email et messagerie pour centraliser toutes vos conversations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Comptes connectés</div>
          <div className="text-3xl font-bold text-gray-900">{accounts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Messages reçus</div>
          <div className="text-3xl font-bold text-gray-900">
            {accounts.reduce((sum, acc) => sum + acc.messages_received, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Messages envoyés</div>
          <div className="text-3xl font-bold text-gray-900">
            {accounts.reduce((sum, acc) => sum + acc.messages_sent, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Conversations actives</div>
          <div className="text-3xl font-bold text-gray-900">
            {accounts.reduce((sum, acc) => sum + (acc.active_conversations || 0), 0)}
          </div>
        </div>
      </div>

      {/* Available Platforms */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plateformes disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => {
            const config = PLATFORM_CONFIG[platform];
            const connectedAccount = getConnectedAccount(platform);
            const isConnected = !!connectedAccount;
            const isLoading = actionLoading === connectedAccount?.id;

            return (
              <div
                key={platform}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                  isConnected ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'
                } ${!config.available && 'opacity-50'}`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${config.color} text-white p-3 rounded-lg`}>
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{config.name}</h3>
                        {isConnected && (
                          <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Connecté</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {connectedAccount && (
                      <div className="flex items-center gap-2">
                        {connectedAccount.status === 'active' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {connectedAccount.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{config.description}</p>

                  {/* Connected Account Info */}
                  {connectedAccount && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Compte: </span>
                        <span className="font-medium text-gray-900">
                          {connectedAccount.account_name}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Messages: </span>
                        <span className="font-medium text-gray-900">
                          ↓ {connectedAccount.messages_received} ↑ {connectedAccount.messages_sent}
                        </span>
                      </div>
                      {connectedAccount.unread_conversations > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-600">Non lues: </span>
                          <span className="font-medium text-orange-600">
                            {connectedAccount.unread_conversations}
                          </span>
                        </div>
                      )}
                      {connectedAccount.status === 'error' && (
                        <div className="text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {connectedAccount.error_message || 'Erreur de connexion'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!isConnected && config.available && (
                      <button
                        onClick={() => setShowConnectModal(platform)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Connecter
                      </button>
                    )}

                    {isConnected && connectedAccount && (
                      <>
                        {['gmail', 'outlook'].includes(platform) && (
                          <button
                            onClick={() => handleSync(connectedAccount.id)}
                            disabled={isLoading}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Sync
                          </button>
                        )}

                        <button
                          onClick={() => handleDisconnect(connectedAccount.id)}
                          disabled={isLoading}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Déconnecter
                        </button>
                      </>
                    )}

                    {!config.available && (
                      <div className="flex-1 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-center cursor-not-allowed">
                        Bientôt disponible
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showConnectModal === 'gmail' && (
        <ConnectGmailModal
          onClose={() => setShowConnectModal(null)}
          onSuccess={() => {
            setShowConnectModal(null);
            loadAccounts();
          }}
        />
      )}

      {showConnectModal === 'outlook' && (
        <ConnectOutlookModal
          onClose={() => setShowConnectModal(null)}
          onSuccess={() => {
            setShowConnectModal(null);
            loadAccounts();
          }}
        />
      )}

      {showConnectModal === 'telegram' && (
        <ConnectTelegramModal
          onClose={() => setShowConnectModal(null)}
          onSuccess={() => {
            setShowConnectModal(null);
            loadAccounts();
          }}
        />
      )}

      {showConnectModal === 'whatsapp_twilio' && (
        <ConnectWhatsAppModal
          onClose={() => setShowConnectModal(null)}
          onSuccess={() => {
            setShowConnectModal(null);
            loadAccounts();
          }}
        />
      )}
    </div>
  );
}
