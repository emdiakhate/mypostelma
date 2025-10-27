/**
 * Page de succès après paiement Stripe
 * Crée automatiquement le profil Upload-Post et redirige vers la connexion des comptes
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { UploadPostService } from '@/services/uploadPost.service';
import { toast } from 'sonner';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Initialisation de votre compte...');

  useEffect(() => {
    const initializeAccount = async () => {
      if (!user) {
        setStatus('error');
        setMessage('Utilisateur non connecté');
        return;
      }

      try {
        setMessage('Création de votre profil social...');
        
        // Créer le profil Upload-Post
        await UploadPostService.createUserProfile(user.id);
        
        setStatus('success');
        setMessage('Votre compte est prêt !');
        
        toast.success('Abonnement activé avec succès !');
        
        // Rediriger vers la page de connexion des comptes après 2 secondes
        setTimeout(() => {
          navigate('/app/connect-accounts');
        }, 2000);
        
      } catch (error) {
        console.error('Error initializing account:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erreur lors de l\'initialisation');
        toast.error('Erreur lors de l\'initialisation de votre compte');
        
        // Rediriger vers le dashboard après 3 secondes
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 3000);
      }
    };

    initializeAccount();
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Configuration en cours...
                </h1>
                <p className="text-gray-600">
                  {message}
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Paiement réussi !
                </h1>
                <p className="text-gray-600 mb-4">
                  {message}
                </p>
                <p className="text-sm text-gray-500">
                  Redirection vers la connexion de vos réseaux sociaux...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Erreur
                </h1>
                <p className="text-gray-600 mb-4">
                  {message}
                </p>
                <p className="text-sm text-gray-500">
                  Redirection vers le tableau de bord...
                </p>
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
