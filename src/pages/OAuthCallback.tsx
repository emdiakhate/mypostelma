import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * OAuth Callback Page
 * Handles OAuth redirects for Gmail and Outlook
 * Extracts authorization code and sends it to parent window
 */
export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');

    // Determine which OAuth provider based on the path
    const provider = location.pathname.includes('google') ? 'gmail' : 'outlook';

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: `${provider}-oauth-error`,
            error: error,
          },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    if (code) {
      // Send success to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: `${provider}-oauth-success`,
            code: code,
            state: state,
          },
          window.location.origin
        );
      }
      
      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // No code and no error - something went wrong
      if (window.opener) {
        window.opener.postMessage(
          {
            type: `${provider}-oauth-error`,
            error: 'No authorization code received',
          },
          window.location.origin
        );
      }
      window.close();
    }
  }, [location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
}
