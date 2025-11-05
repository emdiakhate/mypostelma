import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Sparkles, Smartphone, BookOpen, Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyCalendarStateProps {
  hasConnectedAccounts: boolean;
  hasDrafts?: boolean;
  onCreatePost: () => void;
}

export const EmptyCalendarState: React.FC<EmptyCalendarStateProps> = ({
  hasConnectedAccounts,
  hasDrafts = false,
  onCreatePost,
}) => {
  const navigate = useNavigate();

  // Si aucun compte social connecté
  if (!hasConnectedAccounts) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/95 backdrop-blur-sm">
        <Card className="max-w-2xl mx-4 p-12 border-2 border-dashed border-primary/30 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Smartphone className="w-20 h-20 text-primary animate-pulse" />
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                <Sparkles className="w-6 h-6 text-yellow-900" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Connectez vos réseaux sociaux
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Pour commencer à programmer vos publications, connectez d'abord vos comptes sociaux
          </p>

          <Button 
            size="lg"
            onClick={() => navigate('/social-accounts')}
            className="bg-primary hover:bg-primary/90"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Connecter mes comptes
          </Button>
        </Card>
      </div>
    );
  }

  // Si posts en brouillon non programmés
  if (hasDrafts) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/95 backdrop-blur-sm">
        <Card className="max-w-2xl mx-4 p-12 border-2 border-dashed border-primary/30 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative animate-bounce">
              <Calendar className="w-20 h-20 text-primary" />
              <div className="absolute -top-2 -right-2 bg-blue-400 rounded-full p-2">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            📝 Vous avez des brouillons
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Programmez-les pour qu'ils se publient automatiquement
          </p>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/publications')}
              variant="outline"
            >
              Voir mes brouillons
            </Button>
            <Button 
              size="lg"
              onClick={onCreatePost}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer un nouveau post
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // État par défaut : Comptes connectés mais aucun post
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/95 backdrop-blur-sm">
      <Card className="max-w-2xl mx-4 p-12 border-2 border-dashed border-primary/30 text-center">
        {/* Illustration animée */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Calendar className="w-24 h-24 text-primary animate-pulse" />
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full p-3 animate-bounce">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 bg-yellow-400 rounded-full p-2">
              <Sparkles className="w-6 h-6 text-yellow-900" />
            </div>
          </div>
        </div>

        {/* Message principal */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Votre calendrier vous attend ! 🚀
        </h2>
        
        <p className="text-lg text-gray-600 mb-4">
          Programmez vos publications et gagnez du temps
        </p>

        <p className="text-sm text-gray-500 mb-8">
          Créez du contenu une fois, publiez automatiquement sur tous vos réseaux
        </p>

        {/* Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            size="lg"
            onClick={onCreatePost}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer mon premier post
          </Button>
          
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate('/creation')}
            className="border-2 hover:bg-gray-50"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            Explorer le Studio IA
          </Button>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500 font-medium">ou</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Mini-guide */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 text-left">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Guide rapide (3 min)</h3>
          </div>
          
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Créez un post avec du texte et des images</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Choisissez la date et l'heure de publication</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Utilisez l'IA pour générer du contenu automatiquement</span>
            </li>
          </ul>
        </div>

        {/* Statistiques motivantes */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            ✨ Rejoignez 1000+ créateurs qui automatisent leur contenu
          </p>
        </div>
      </Card>
    </div>
  );
};
