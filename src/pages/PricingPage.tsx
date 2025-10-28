import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const PRICE_IDS = {
  pro: 'price_1SJDWVLR7t5EfdziGeffgVlg',
  business: 'price_1SJDY5LR7t5EfdziWv6DmvjI'
};

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'pro' | 'business') => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      toast.info('Vous devez être connecté pour souscrire à un abonnement');
      navigate('/auth', { state: { from: `/pricing?plan=${plan}` } });
      return;
    }

    try {
      setLoading(plan);
      
      const priceId = PRICE_IDS[plan];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // Redirection directe vers Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout non reçue');
      }
    } catch (error) {
      console.error('Erreur checkout:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du checkout');
    } finally {
      setLoading(null);
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

        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-[#e8f5e9] text-[#1a4d2e] rounded-full px-4 py-1 mb-4">
            Tarifs
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Commencez gratuitement, évoluez à votre rythme
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

          {/* Plan Pro - Populaire */}
          <motion.div
            className="p-8 rounded-2xl border-4 border-[#1a4d2e] bg-white shadow-xl relative scale-105"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.07 }}
          >
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#1a4d2e] text-white">
              Le plus populaire
            </Badge>
            <div className="text-center">
              <Badge className="bg-[#e8f5e9] text-[#1a4d2e] mb-4">Pro</Badge>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">29€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600 mb-6">Pour les entrepreneurs et PME</p>
              <Button 
                className="w-full bg-[#1a4d2e] hover:bg-[#2d5f4a] text-white shadow-lg mb-6"
                onClick={() => handleSubscribe('pro')}
                disabled={loading === 'pro'}
              >
                {loading === 'pro' ? 'Chargement...' : 'Essayer Pro'}
              </Button>
              <ul className="space-y-3 text-left">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  5 comptes sociaux
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  100 posts/mois
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Génération IA illimitée
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Analytics avancés
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  50 leads/mois
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  3 concurrents analysés
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Best time to post
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-[#1a4d2e] mr-2" />
                  Support prioritaire
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Plan Business */}
          <motion.div
            className="p-8 rounded-2xl border-2 border-gray-300 bg-white shadow-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center">
              <Badge className="bg-[#e8f5e9] text-[#1a4d2e] mb-4">Business</Badge>
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900">79€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600 mb-6">Pour les agences et grandes équipes</p>
              <Button 
                variant="outline" 
                className="w-full mb-6"
                onClick={() => handleSubscribe('business')}
                disabled={loading === 'business'}
              >
                {loading === 'business' ? 'Chargement...' : 'Essayer Business'}
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
