import React, { useEffect, useState } from 'react';
import { LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (logoutComplete) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [logoutComplete, navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Simuler un délai de déconnexion
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Effectuer la déconnexion
      await logout();
      
      setLogoutComplete(true);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, rediriger vers le login
      navigate('/login');
    }
  };

  if (logoutComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Déconnexion réussie</CardTitle>
            <CardDescription>
              Vous avez été déconnecté avec succès. Redirection vers la page de connexion...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{countdown}</div>
            <p className="text-sm text-gray-500">
              Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}
            </p>
            <Button 
              onClick={() => navigate('/login')} 
              className="mt-4"
              variant="outline"
            >
              Aller à la page de connexion maintenant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <LogOut className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Déconnexion</CardTitle>
          <CardDescription>
            Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Attention</p>
                <p className="text-yellow-700">
                  Vous perdrez l'accès à toutes vos données en cours. Assurez-vous d'avoir sauvegardé votre travail.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Déconnexion en cours...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline" 
              className="w-full"
              disabled={isLoggingOut}
            >
              Annuler
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Vous serez redirigé vers la page de connexion après la déconnexion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoutPage;