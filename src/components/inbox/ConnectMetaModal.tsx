/**
 * Modal pour connecter Facebook ou Instagram via Meta OAuth
 */

import React, { useState } from 'react';
import { X, Facebook, Instagram, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ConnectMetaModalProps {
  platform: 'facebook' | 'instagram';
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectMetaModal({ platform, onClose, onSuccess }: ConnectMetaModalProps) {
  const [loading, setLoading] = useState(false);

  const platformConfig = {
    facebook: {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      scopes: 'pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata',
    },
    instagram: {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      scopes: 'instagram_basic,instagram_manage_messages,pages_show_list,pages_messaging',
    },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleConnect = async () => {
    try {
      setLoading(true);

      // Get Meta App ID from environment
      const metaAppId = import.meta.env.VITE_META_APP_ID;
      
      if (!metaAppId) {
        toast.error('Configuration Meta manquante. Contactez le support.');
        return;
      }

      // Build OAuth URL
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const state = JSON.stringify({ platform, returnUrl: window.location.pathname });
      
      const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      oauthUrl.searchParams.set('client_id', metaAppId);
      oauthUrl.searchParams.set('redirect_uri', redirectUri);
      oauthUrl.searchParams.set('scope', config.scopes);
      oauthUrl.searchParams.set('state', btoa(state));
      oauthUrl.searchParams.set('response_type', 'code');

      // Redirect to Meta OAuth
      window.location.href = oauthUrl.toString();
    } catch (error: any) {
      console.error('Error initiating Meta OAuth:', error);
      toast.error(error?.message || 'Erreur lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`${config.color} text-white p-2 rounded-lg`}>
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold">Connecter {config.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 mx-auto rounded-full ${config.color} flex items-center justify-center`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Connectez votre compte {config.name}
              </h3>
              <p className="text-gray-600 text-sm">
                Autorisez Postelma à accéder à vos messages {config.name} pour les centraliser dans votre boîte de réception unifiée.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Permissions requises :</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Lire vos messages</li>
              <li>• Répondre aux messages</li>
              <li>• Accéder à vos pages/profil</li>
            </ul>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Vous serez redirigé vers {config.name} pour autoriser l'accès. 
            Vos identifiants ne sont jamais stockés sur nos serveurs.
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConnect}
            disabled={loading}
            className={`flex-1 ${config.color} hover:opacity-90 text-white border-0`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connecter avec {config.name}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
