/**
 * Page unifiée de gestion des comptes sociaux
 * Combine Publication (SocialAccounts) et Messagerie (ConnectedAccounts) avec des onglets
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Share2 } from 'lucide-react';

// Import des deux composants d'origine pour réutilisation
// On va les afficher dans des onglets
import SocialAccountsPageOriginal from '@/pages/SocialAccountsPage';
import ConnectedAccountsPageOriginal from '@/pages/ConnectedAccountsPage';

export default function ComptesSociauxPage() {
  const [activeTab, setActiveTab] = useState('publication');

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comptes Sociaux</h1>
        <p className="text-gray-600">
          Gérez vos connexions pour publier du contenu et communiquer avec votre audience
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="publication" className="gap-2">
            <Share2 className="w-4 h-4" />
            Publication
          </TabsTrigger>
          <TabsTrigger value="messagerie" className="gap-2">
            <Send className="w-4 h-4" />
            Messagerie
          </TabsTrigger>
        </TabsList>

        {/* Onglet Publication - Comptes pour publier du contenu */}
        <TabsContent value="publication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comptes de Publication</CardTitle>
              <CardDescription>
                Connectez vos comptes pour publier du contenu sur les réseaux sociaux
                (Instagram, Facebook, TikTok, LinkedIn, X/Twitter, Threads)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialAccountsPageOriginal />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Messagerie - Comptes pour inbox/messages */}
        <TabsContent value="messagerie" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comptes de Messagerie</CardTitle>
              <CardDescription>
                Connectez vos comptes pour recevoir et envoyer des messages
                (Gmail, Outlook, WhatsApp, Telegram, Instagram DM, Facebook Messenger)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectedAccountsPageOriginal />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
