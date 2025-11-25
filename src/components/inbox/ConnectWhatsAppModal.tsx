import React, { useState } from 'react';
import { X, MessageCircle, ExternalLink, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { connectWhatsAppTwilio } from '@/services/connectedAccounts';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectWhatsAppModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!accountSid.trim() || !authToken.trim() || !phoneNumber.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      setError('Le numéro doit commencer par + (ex: +221771234567)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await connectWhatsAppTwilio(user!.id, {
        account_sid: accountSid.trim(),
        auth_token: authToken.trim(),
        phone_number: phoneNumber.trim(),
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error connecting WhatsApp:', err);
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 text-white p-3 rounded-lg">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Connecter WhatsApp (Twilio)</h2>
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
            Connectez WhatsApp via Twilio pour recevoir et envoyer des messages WhatsApp depuis
            Postelma.
          </p>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Comment obtenir vos identifiants Twilio ?
            </h3>
            <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
              <li>
                Créez un compte sur{' '}
                <a
                  href="https://www.twilio.com/try-twilio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Twilio
                </a>
              </li>
              <li>
                Activez le{' '}
                <a
                  href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  WhatsApp Sandbox
                </a>{' '}
                ou configurez un numéro WhatsApp Business
              </li>
              <li>
                Récupérez votre <strong>Account SID</strong> et <strong>Auth Token</strong> depuis
                le{' '}
                <a
                  href="https://console.twilio.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Dashboard
                </a>
              </li>
              <li>
                Notez votre numéro WhatsApp (format: +14155238886 pour sandbox ou votre propre
                numéro)
              </li>
            </ol>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account SID
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              placeholder="AC********************************"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Commence par "AC" + 32 caractères</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auth Token
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="********************************"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">32 caractères alphanumériques</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro WhatsApp
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+14155238886"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Sandbox: +14155238886 | Production: votre numéro (ex: +221771234567)
            </p>
          </div>

          {/* What we can do */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Ce que nous pouvons faire :</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Recevoir tous les messages WhatsApp</li>
              <li>• Envoyer des messages texte</li>
              <li>• Envoyer des images et médias</li>
              <li>• Recevoir des notifications en temps réel</li>
            </ul>
          </div>

          {/* Sandbox vs Production */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">💡 Sandbox vs Production :</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <div>
                <strong>Sandbox (Gratuit) :</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>
                    • Les utilisateurs doivent d'abord envoyer "join [code]" au numéro Twilio
                  </li>
                  <li>• Limité à quelques contacts de test</li>
                  <li>• Parfait pour tester</li>
                </ul>
              </div>
              <div>
                <strong>Production (Payant) :</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Votre propre numéro WhatsApp Business</li>
                  <li>• Pas de limitation de contacts</li>
                  <li>• Validation Facebook Business requise</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Ressources :</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                •{' '}
                <a
                  href="https://www.twilio.com/docs/whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline inline-flex items-center gap-1"
                >
                  Documentation WhatsApp Twilio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                •{' '}
                <a
                  href="https://console.twilio.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline inline-flex items-center gap-1"
                >
                  Console Twilio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                •{' '}
                <a
                  href="https://www.twilio.com/docs/whatsapp/sandbox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline inline-flex items-center gap-1"
                >
                  Guide WhatsApp Sandbox
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
            disabled={loading || !accountSid.trim() || !authToken.trim() || !phoneNumber.trim()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Connecter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
