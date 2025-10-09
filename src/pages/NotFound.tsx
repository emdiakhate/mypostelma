import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * Composant NotFound - Page 404
 * Affiche une page d'erreur élégante pour les routes invalides
 */
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icône d'erreur */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Message d'erreur */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          404
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Page non trouvée
        </h2>
        <p className="text-gray-500 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default">
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline"
            onClick={() => window.history.back()}
          >
            <button className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Page précédente
            </button>
          </Button>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 text-sm text-gray-400">
          <p>Si vous pensez qu'il s'agit d'une erreur, contactez le support.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;