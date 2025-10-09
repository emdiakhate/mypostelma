import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Shield, Pencil, Eye, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { mockUsers as allMockUsers } from '@/data/mockUsers';
import type { User, UserRole } from '@/types/user';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Récupérer les utilisateurs mockés de chaque rôle
  const mockUsers = {
    owner: allMockUsers.find(u => u.role === 'owner')!,
    manager: allMockUsers.find(u => u.role === 'manager')!,
    creator: allMockUsers.find(u => u.role === 'creator')!,
    viewer: allMockUsers.find(u => u.role === 'viewer')!,
  };

  const handleLogin = (user: User) => {
    // Sauvegarde user dans context + localStorage
    login(user);

    // Toast de confirmation
    toast.success(`Connecté en tant que ${user.name}`, {
      description: `Rôle: ${getRoleLabel(user.role)}`
    });

    // Redirection
    navigate('/calendar');
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels = {
      owner: 'Propriétaire',
      manager: 'Manager',
      creator: 'Créateur',
      viewer: 'Observateur'
    };
    return labels[role];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Bienvenue sur Postelma</CardTitle>
          <CardDescription>
            Choisissez un profil de test pour continuer
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Profil 1: Propriétaire */}
          <button
            onClick={() => handleLogin(mockUsers.owner)}
            className="w-full p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Marie Dupont</div>
                <div className="text-sm text-muted-foreground">Propriétaire</div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                Tous les droits
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ✓ Gestion complète • Billing • Équipe • Analytics
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1" />
          </button>

          {/* Profil 2: Manager */}
          <button
            onClick={() => handleLogin(mockUsers.manager)}
            className="w-full p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Thomas Martin</div>
                <div className="text-sm text-muted-foreground">Manager</div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Gestion & Approbation
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ✓ Publier • Approuver • Gérer équipe • Analytics
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1" />
          </button>

          {/* Profil 3: Creator */}
          <button
            onClick={() => handleLogin(mockUsers.creator)}
            className="w-full p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Pencil className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Sophie Bernard</div>
                <div className="text-sm text-muted-foreground">Creator</div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Création seulement
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ✓ Créer posts • Voir analytics • Soumettre pour approbation
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1" />
          </button>

          {/* Profil 4: Viewer (Observateur) */}
          <button
            onClick={() => handleLogin(mockUsers.viewer)}
            className="w-full p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Lucas Petit</div>
                <div className="text-sm text-muted-foreground">Observateur</div>
              </div>
              <Badge className="bg-gray-100 text-gray-800">
                Lecture seule
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ✓ Voir analytics • Consulter posts • Pas de modification
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1" />
          </button>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <div className="text-xs text-center text-muted-foreground">
            🧪 Mode Test MVP • Connexion instantanée sans mot de passe
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}