import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const CheckoutSimulation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const price = plan === 'pro' ? '29€' : '79€';
  const planName = plan === 'pro' ? 'Pro' : 'Business';

  const handlePayment = () => {
    toast.success('Paiement simulé avec succès !');
    setTimeout(() => {
      navigate('/app/calendar?subscription=success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate('/pricing')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-[#1a4d2e] rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2">
              Paiement sécurisé
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Mode démo - Simulation de paiement
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Plan sélectionné</span>
                <span className="font-semibold text-lg">{planName}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Montant</span>
                <span className="font-bold text-2xl text-[#1a4d2e]">{price}/mois</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total à payer aujourd'hui</span>
                  <span className="font-bold text-2xl">{price}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2 border rounded-md"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2">
                    Expiration
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    className="w-full px-3 py-2 border rounded-md"
                    disabled
                  />
                </div>
                <div className="border rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border rounded-md"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <Shield className="w-4 h-4" />
              <span>Paiement sécurisé par Stripe</span>
            </div>

            <Button
              className="w-full bg-[#1a4d2e] hover:bg-[#2d5f4a] text-white text-lg py-6"
              onClick={handlePayment}
            >
              Simuler le paiement de {price}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Ceci est une simulation à des fins de démonstration
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutSimulation;
