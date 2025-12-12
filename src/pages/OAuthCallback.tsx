import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * OAuth Callback Page
 * Handles OAuth redirects for Gmail, Outlook, Facebook, and Instagram
 */
export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connexion en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      // Parse URL parameters
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      const stateParam = params.get('state');

      console.log('[OAuth Callback] URL params:', { code: !!code, error, stateParam });

      // Try to parse state (may be Base64 encoded by Facebook)
      let state: { platform?: string; returnUrl?: string; originalOrigin?: string } = {};
      try {
        if (stateParam) {
          let decodedState = stateParam;
          
          // Try Base64 decode first (Facebook encodes the state parameter)
          try {
            decodedState = atob(stateParam);
            console.log('[OAuth Callback] Base64 decoded state:', decodedState);
          } catch {
            // Not Base64, use as-is
            console.log('[OAuth Callback] State is not Base64, using as-is');
          }
          
          state = JSON.parse(decodedState);
          console.log('[OAuth Callback] Parsed state:', state);
        }
      } catch (e) {
        console.error('[OAuth Callback] Failed to parse state:', e);
      }

      const platform = state.platform;
      const returnUrl = state.returnUrl || '/app/connections';

      console.log('[OAuth Callback] Detected platform:', platform);

      // Handle Meta OAuth (Facebook/Instagram)
      if (platform === 'facebook' || platform === 'instagram') {
        console.log('[OAuth Callback] Handling Meta OAuth for', platform);
        
        if (error) {
          setStatus('error');
          setMessage(`Erreur: ${error}`);
          toast.error(`Erreur de connexion ${platform}`);
          setTimeout(() => navigate(returnUrl), 2000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Aucun code d\'autorisation reçu');
          toast.error('Aucun code d\'autorisation reçu');
          setTimeout(() => navigate(returnUrl), 2000);
          return;
        }

        try {
          setMessage(`Connexion à ${platform === 'instagram' ? 'Instagram' : 'Facebook'}...`);

          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('Utilisateur non connecté');
          }

          // Build the redirect URI that was used (must match exactly)
          const currentHost = window.location.hostname;
          let redirectUri: string;
          
          if (currentHost.includes('preview--mypostelma.lovable.app')) {
            redirectUri = 'https://preview--mypostelma.lovable.app/oauth/callback';
          } else if (currentHost === 'postelma.com') {
            redirectUri = 'https://postelma.com/oauth/callback';
          } else {
            redirectUri = 'https://mypostelma.lovable.app/oauth/callback';
          }

          // Call the Edge Function to exchange code for token
          const { data, error: fnError } = await supabase.functions.invoke('meta-oauth-callback', {
            body: {
              code,
              redirect_uri: redirectUri,
              platform,
              user_id: user.id,
            },
          });

        if (fnError) {
          console.error('[OAuth Callback] Edge function error:', fnError);
          // Try to get the actual error response body
          let errorBody = null;
          try {
            // For FunctionsHttpError, the context is the Response object
            if (fnError.context) {
              errorBody = await fnError.context.json();
            }
          } catch (e) {
            console.log('[OAuth Callback] Could not parse error body:', e);
          }
          
          console.log('[OAuth Callback] Error body:', errorBody);
          
          if (errorBody?.error) {
            const errorMessage = errorBody.error;
            const errorDescription = errorBody.message || '';
            const hint = errorBody.hint || errorBody.details?.error?.message || '';
            const instructions = errorBody.instructions || [];

            let fullError = errorMessage;
            if (errorDescription) fullError += `\n\n${errorDescription}`;
            if (instructions.length > 0) fullError += `\n\n${instructions.join('\n')}`;
            if (hint) fullError += `\n\n💡 ${hint}`;

            throw new Error(fullError);
          }
          throw new Error(fnError.message || 'Erreur lors de la connexion');
        }

        if (data?.error) {
          console.error('[OAuth Callback] Response error:', data);
          const errorMessage = data.error;
          const errorDescription = data.message || '';
          const hint = data.hint || data.details?.error?.message || '';
          const instructions = data.instructions || [];

          let fullError = errorMessage;
          if (errorDescription) fullError += `\n\n${errorDescription}`;
          if (instructions.length > 0) fullError += `\n\n${instructions.join('\n')}`;
          if (hint) fullError += `\n\n💡 ${hint}`;

          throw new Error(fullError);
        }

          setStatus('success');
          setMessage(`${platform === 'instagram' ? 'Instagram' : 'Facebook'} connecté avec succès!`);
          toast.success(`${platform === 'instagram' ? 'Instagram' : 'Facebook'} connecté avec succès!`);
          
          setTimeout(() => navigate(returnUrl), 1500);

        } catch (err: any) {
          console.error('Meta OAuth error:', err);
          setStatus('error');
          setMessage(err.message || 'Erreur lors de la connexion');
          toast.error(err.message || 'Erreur lors de la connexion');
          setTimeout(() => navigate(returnUrl), 2000);
        }
        return;
      }

      // Handle Gmail/Outlook OAuth (via popup)
      const provider = location.pathname.includes('google') ? 'gmail' : 'outlook';

      if (error) {
        if (window.opener) {
          window.opener.postMessage(
            { type: `${provider}-oauth-error`, error },
            window.location.origin
          );
        }
        window.close();
        return;
      }

      if (code) {
        if (window.opener) {
          window.opener.postMessage(
            { type: `${provider}-oauth-success`, code, state: stateParam },
            window.location.origin
          );
        }
        setTimeout(() => window.close(), 500);
      } else {
        if (window.opener) {
          window.opener.postMessage(
            { type: `${provider}-oauth-error`, error: 'No authorization code received' },
            window.location.origin
          );
        }
        window.close();
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        {status === 'processing' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        )}
        {status === 'success' && (
          <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
