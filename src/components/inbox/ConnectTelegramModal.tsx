import React, { useState } from 'react';
import { X, Send, ExternalLink, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { connectTelegram } from '@/services/connectedAccounts';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectTelegramModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [botToken, setBotToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!botToken.trim()) {
      setError('Veuillez entrer un token de bot');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await connectTelegram(user!.id, {
        bot_token: botToken.trim(),
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error connecting Telegram:', err);
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
            <div className="bg-sky-500 text-white p-3 rounded-lg">
              <Send className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Connecter Telegram</h2>
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
            Connectez votre bot Telegram pour recevoir et répondre aux messages directement depuis
            Postelma.
          </p>

          {/* Instructions */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <h3 className="font-semibold text-sky-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Comment créer un bot Telegram ?
            </h3>
            <ol className="text-sm text-sky-800 space-y-2 list-decimal list-inside">
              <li>
                Ouvrez Telegram et cherchez{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  @BotFather
                </a>
              </li>
              <li>Envoyez la commande /newbot</li>
              <li>Choisissez un nom pour votre bot (ex: "Support Postelma")</li>
              <li>Choisissez un username (doit finir par "bot", ex: "postelma_support_bot")</li>
              <li>
                BotFather vous donnera un <strong>token</strong> - copiez-le et collez-le
                ci-dessous
              </li>
            </ol>
          </div>

          {/* Token Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bot Token
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: 10 chiffres, deux-points, 35 caractères alphanumériques
            </p>
          </div>

          {/* What we can do */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Ce que nous pouvons faire :</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Recevoir tous les messages envoyés au bot</li>
              <li>• Envoyer des messages aux utilisateurs</li>
              <li>• Envoyer des photos, documents et vidéos</li>
              <li>• Recevoir des notifications en temps réel</li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important :</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>
                • Les utilisateurs doivent <strong>démarrer</strong> une conversation avec votre
                bot (bouton "Start")
              </li>
              <li>• Votre bot ne peut pas envoyer de messages à des utilisateurs qui ne l'ont pas démarré</li>
              <li>
                • Gardez votre token <strong>secret</strong> - ne le partagez jamais publiquement
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Ressources :</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>
                •{' '}
                <a
                  href="https://core.telegram.org/bots#how-do-i-create-a-bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline inline-flex items-center gap-1"
                >
                  Documentation officielle Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                •{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline inline-flex items-center gap-1"
                >
                  @BotFather sur Telegram
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
            disabled={loading || !botToken.trim()}
            className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Connecter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
