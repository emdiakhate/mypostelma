import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTestAuth } from './TestAuthBypass';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const { isTestMode } = useTestAuth();

  // En mode test, bypass l'authentification
  if (isTestMode) {
    console.log('🧪 ProtectedRoute: Mode test actif - Accès autorisé');
    return <>{children}</>;
  }

  // Affiche loader pendant vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirige vers /auth si pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Affiche contenu si authentifié
  return <>{children}</>;
}
