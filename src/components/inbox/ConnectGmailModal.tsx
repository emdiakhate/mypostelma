import React, { useState } from 'react';
import { X, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { connectGmail } from '@/services/connectedAccounts';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectGmailModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth config (you need to set these up in Google Cloud Console)
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
  const REDIRECT_URI = `${window.location.origin}/oauth/google/callback`;
  const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ].join(' ');

  const handleConnect = () => {
    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      // Force Google to always show the account chooser
      prompt: 'consent select_account',
      state: user!.id, // Pass user ID for verification
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Open OAuth popup
    const popup = window.open(authUrl, 'gmail-oauth', 'width=600,height=700');

    // Listen for OAuth callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'gmail-oauth-success') {
        const { code } = event.data;

        try {
          setLoading(true);
          setError(null);

          await connectGmail(user!.id, {
            code,
            redirect_uri: REDIRECT_URI,
          });

          onSuccess();
        } catch (err: any) {
          console.error('Error connecting Gmail:', err);
          setError(err.message || 'Erreur lors de la connexion');
        } finally {
          setLoading(false);
        }
      } else if (event.data.type === 'gmail-oauth-error') {
        setError(event.data.error);
      }

      window.removeEventListener('message', handleMessage);
    };

    window.addEventListener('message', handleMessage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-white p-3 rounded-lg">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Connecter Gmail</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            Connectez votre compte Gmail pour recevoir et répondre aux emails directement depuis
            Postelma.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Ce que nous pouvons faire :</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Lire vos emails</li>
              <li>• Envoyer des emails en votre nom</li>
              <li>• Marquer les emails comme lus</li>
              <li>• Recevoir des notifications en temps réel</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Prérequis :</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Un compte Google actif</li>
              <li>• Configuration OAuth dans Google Cloud Console</li>
              <li>
                •{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline inline-flex items-center gap-1"
                >
                  Créer un projet OAuth
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Connecter Gmail
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
