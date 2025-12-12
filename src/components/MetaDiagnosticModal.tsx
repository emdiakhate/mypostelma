/**
 * Modal de diagnostic pour les connexions Meta (Facebook/Instagram)
 * Aide à identifier les problèmes de connexion et de permissions
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { runFullMetaDiagnostic, MetaDiagnosticResult } from '@/utils/metaDiagnostics';

interface MetaDiagnosticModalProps {
  platform: 'facebook' | 'instagram';
  accessToken: string;
  pageId?: string;
  onClose: () => void;
}

export default function MetaDiagnosticModal({
  platform,
  accessToken,
  pageId,
  onClose,
}: MetaDiagnosticModalProps) {
  const [loading, setLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const results = await runFullMetaDiagnostic(platform, accessToken, pageId);
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDiagnosticResult = (title: string, result: MetaDiagnosticResult) => {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-2">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{result.message}</p>

            {result.suggestions && result.suggestions.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-gray-700">💡 Suggestions:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  {result.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.details && (
              <details className="mt-3">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Détails techniques
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              Diagnostic {platform === 'facebook' ? 'Facebook' : 'Instagram'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Identifiez les problèmes de connexion et de permissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!diagnosticResults && !loading && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ce diagnostic vérifiera :
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>La validité de votre token d'accès</li>
                  <li>Les permissions accordées à l'application</li>
                  {platform === 'instagram' && (
                    <li>La présence d'un compte Instagram Business</li>
                  )}
                  {platform === 'facebook' && pageId && (
                    <li>Les permissions de publication sur la page</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">Analyse en cours...</p>
            </div>
          )}

          {diagnosticResults && (
            <div className="space-y-4">
              {/* Statut global */}
              <Alert
                variant={
                  diagnosticResults.overallStatus === 'success'
                    ? 'default'
                    : 'destructive'
                }
              >
                {diagnosticResults.overallStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {diagnosticResults.overallStatus === 'success'
                    ? 'Toutes les vérifications sont passées avec succès ✓'
                    : 'Des problèmes ont été détectés. Consultez les détails ci-dessous.'}
                </AlertDescription>
              </Alert>

              {/* Résultats détaillés */}
              {renderDiagnosticResult(
                'Vérification du token d\'accès',
                diagnosticResults.tokenCheck
              )}

              {diagnosticResults.instagramCheck &&
                renderDiagnosticResult(
                  'Compte Instagram Business',
                  diagnosticResults.instagramCheck
                )}

              {diagnosticResults.pageCheck &&
                renderDiagnosticResult(
                  'Permissions de la page Facebook',
                  diagnosticResults.pageCheck
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {!loading && (
            <Button onClick={runDiagnostic} disabled={loading}>
              {diagnosticResults ? 'Relancer le diagnostic' : 'Lancer le diagnostic'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
