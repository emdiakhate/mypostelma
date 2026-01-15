/**
 * TestAuthBypass - Composant pour bypass l'authentification en mode test
 *
 * UTILISATION:
 * Ajouter ?testMode=true dans l'URL pour activer le mode test
 * Exemple: http://localhost:5173/?testMode=true
 *
 * ⚠️ Ce composant ne fonctionne QU'en développement
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Utilisateur test mocké
const TEST_USER = {
  id: 'test-user-id-123',
  email: 'test@mypostelma.com',
  user_metadata: {
    full_name: 'Utilisateur Test',
    avatar_url: null,
  },
};

// Session test mockée
const TEST_SESSION = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() / 1000 + 3600, // Expire dans 1 heure
  expires_in: 3600,
  token_type: 'bearer',
  user: TEST_USER,
};

export const TestAuthBypass: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('testMode') === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

    if (testMode && isDevelopment) {
      console.log('🧪 MODE TEST ACTIVÉ - Authentification bypassée');
      console.log('👤 Utilisateur test:', TEST_USER.email);

      // Stocker la session test dans localStorage (simuler Supabase)
      localStorage.setItem('test-mode', 'true');
      localStorage.setItem('test-user', JSON.stringify(TEST_USER));

      // Rediriger vers le dashboard si on est sur la page de login
      if (window.location.pathname === '/' || window.location.pathname === '/auth') {
        navigate('/app/dashboard');
      }
    }
  }, [navigate]);

  return <>{children}</>;
};

/**
 * Hook personnalisé pour utiliser l'utilisateur test en mode test
 */
export const useTestAuth = () => {
  const isTestMode = localStorage.getItem('test-mode') === 'true';
  const testUser = isTestMode ? JSON.parse(localStorage.getItem('test-user') || '{}') : null;

  return {
    isTestMode,
    testUser,
  };
};

/**
 * Fonction pour désactiver le mode test
 */
export const disableTestMode = () => {
  localStorage.removeItem('test-mode');
  localStorage.removeItem('test-user');
  window.location.href = '/';
};

// Exposer les fonctions de test dans la console en dev
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testMode = {
    enable: () => {
      window.location.href = '/?testMode=true';
    },
    disable: disableTestMode,
    isActive: () => localStorage.getItem('test-mode') === 'true',
  };

  console.log('🧪 Test mode available in console: window.testMode');
  console.log('   - window.testMode.enable() - Activer le mode test');
  console.log('   - window.testMode.disable() - Désactiver le mode test');
  console.log('   - window.testMode.isActive() - Vérifier si le mode test est actif');
}
