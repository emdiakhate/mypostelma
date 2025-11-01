import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, X, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleBetaSignup = async () => {
    if (!user) {
      toast.info('Vous devez être connecté pour démarrer l\'essai bêta');
      navigate('/auth', { state: { from: '/pricing' } });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-beta-subscription');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success('Abonnement bêta créé avec succès !');
        navigate('/app/social-accounts');
      } else {
        throw new Error(data?.error || 'Erreur lors de la création de l\'abonnement');
      }
    } catch (error) {
      console.error('Erreur création abonnement bêta:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Badge Version Bêta */}
        <Alert className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <AlertDescription className="text-purple-900 font-medium">
            🎉 Version Bêta Privée - Accès Gratuit Limité aux 5 Premiers Testeurs !
          </AlertDescription>
        </Alert>

        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-[#e8f5e9] text-[#1a4d2e] rounded-full px-4 py-1 mb-4">
            Offre Bêta
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Testez gratuitement notre plateforme
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Rejoignez notre programme bêta et bénéficiez de toutes les fonctionnalités Pro gratuitement
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Plan Free */}
          <motion.div
            className="p-8 rounded-2xl border-2 border-gray-200 bg-white shadow-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center">
              <Badge className="bg-gray-100 text-gray-800 mb-4">Gratuit</Badge>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">0€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600 mb-6">Pour découvrir la plateforme</p>
              <Button 
                variant="outline" 
                className="w-full mb-6"
                asChild
              >
                <Link to="/app/calendar">Commencer gratuitement</Link>
              </Button>
              <ul className="space-y-3 text-left">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  1 compte social
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  10 posts/mois
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Génération IA basique
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Analytics de base
                </li>
                <li className="flex items-center text-sm text-gray-400">
                  <X className="w-4 h-4 mr-2" />
                  Lead generation
                </li>
                <li className="flex items-center text-sm text-gray-400">
                  <X className="w-4 h-4 mr-2" />
                  Competitive intelligence
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Plan Pro Bêta - Gratuit */}
          <motion.div
            className="p-8 rounded-2xl border-4 border-purple-500 bg-gradient-to-br from-white to-purple-50 shadow-2xl relative scale-105"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.07 }}
          >
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              🎉 Version Bêta - Gratuit !
            </Badge>
            <div className="text-center">
              <Badge className="bg-purple-100 text-purple-800 mb-4">Pro Bêta</Badge>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900 line-through opacity-50">29€</span>
                <div className="text-3xl font-bold text-purple-600 mt-2">GRATUIT</div>
                <span className="text-sm text-gray-600">Pendant 90 jours</span>
              </div>
              <p className="text-gray-600 mb-6">Pour les bêta-testeurs (5 places)</p>
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg mb-6"
                onClick={handleBetaSignup}
                disabled={loading}
              >
                {loading ? 'Chargement...' : '🚀 Démarrer l\'essai bêta'}
              </Button>
              <ul className="space-y-3 text-left">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  <strong>Posts illimités</strong>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  <strong>5 générations de leads max</strong>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Génération IA (Gemini + Banana)
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Vidéos TikTok/YouTube
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Analytics avancés
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Best time to post
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Upload-Post integration
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                  Support prioritaire
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Plan Business - Désactivé */}
          <motion.div
            className="p-8 rounded-2xl border-2 border-gray-200 bg-gray-50 shadow-xl opacity-60"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center">
              <Badge className="bg-gray-200 text-gray-600 mb-4">Business</Badge>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">79€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600 mb-6">Bientôt disponible</p>
              <Button 
                variant="outline" 
                className="w-full mb-6"
                disabled={true}
              >
                Bientôt disponible
              </Button>
              <ul className="space-y-3 text-left">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  15 comptes sociaux
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Posts illimités
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Tout du plan Pro
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  500 leads/mois
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  10 concurrents analysés
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Team collaboration
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  White-label reports
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  API access
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Support dédié
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
