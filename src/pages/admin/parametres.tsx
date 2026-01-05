/**
 * Module Administration - Paramètres de l'Application
 * Configuration générale, notifications, intégrations
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Building2,
  Bell,
  Palette,
  Globe,
  Shield,
  Zap,
  Mail,
  Save,
  Check,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ParametresPage() {
  const [settings, setSettings] = useState({
    // Entreprise
    companyName: 'MyPostelma SAS',
    companyEmail: 'contact@mypostelma.com',
    companyPhone: '+33 1 23 45 67 89',
    companyAddress: '123 Rue de la Tech, 75001 Paris',

    // Notifications
    emailNotifications: true,
    desktopNotifications: false,
    notifyNewLead: true,
    notifyNewOrder: true,
    notifyPayment: true,

    // Apparence
    theme: 'light',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',

    // Sécurité
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',

    // Intégrations
    stripeEnabled: true,
    emailProvider: 'smtp',
    storageProvider: 's3',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Paramètres
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurez votre application MyPostelma
          </p>
        </div>
        <Button onClick={handleSave} disabled={saved}>
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Enregistré
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Zap className="h-4 w-4 mr-2" />
            Intégrations
          </TabsTrigger>
        </TabsList>

        {/* Général */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
              <CardDescription>
                Informations générales sur votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) =>
                      setSettings({ ...settings, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, companyEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Téléphone</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) =>
                      setSettings({ ...settings, companyPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Adresse</Label>
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) =>
                      setSettings({ ...settings, companyAddress: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Préférences de notifications
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les notifications par email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications bureau</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les notifications desktop
                  </p>
                </div>
                <Switch
                  checked={settings.desktopNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, desktopNotifications: checked })
                  }
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-4">Événements notifiés</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Nouveau lead</Label>
                    <Switch
                      checked={settings.notifyNewLead}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, notifyNewLead: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Nouvelle commande</Label>
                    <Switch
                      checked={settings.notifyNewOrder}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, notifyNewOrder: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Paiement reçu</Label>
                    <Switch
                      checked={settings.notifyPayment}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, notifyPayment: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apparence */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apparence et localisation
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de votre interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Thème</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) =>
                      setSettings({ ...settings, theme: value })
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) =>
                      setSettings({ ...settings, language: value })
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                      setSettings({ ...settings, dateFormat: value })
                    }
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) =>
                      setSettings({ ...settings, currency: value })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres de sécurité
              </CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Ajouter une couche de sécurité supplémentaire
                  </p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, twoFactorAuth: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
                <Select
                  value={settings.sessionTimeout}
                  onValueChange={(value) =>
                    setSettings({ ...settings, sessionTimeout: value })
                  }
                >
                  <SelectTrigger id="sessionTimeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">Expiration du mot de passe (jours)</Label>
                <Select
                  value={settings.passwordExpiry}
                  onValueChange={(value) =>
                    setSettings({ ...settings, passwordExpiry: value })
                  }
                >
                  <SelectTrigger id="passwordExpiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="60">60 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="never">Jamais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Button variant="outline" className="w-full">
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intégrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Intégrations et Services
              </CardTitle>
              <CardDescription>
                Connectez des services externes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      S
                    </div>
                    <div>
                      <div className="font-medium">Stripe</div>
                      <div className="text-sm text-muted-foreground">Paiements en ligne</div>
                    </div>
                  </div>
                  <Badge className="bg-green-600">
                    {settings.stripeEnabled ? 'Connecté' : 'Déconnecté'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-10 w-10 p-2 bg-blue-600 rounded-lg text-white" />
                    <div>
                      <div className="font-medium">Serveur Email</div>
                      <div className="text-sm text-muted-foreground">SMTP / SendGrid</div>
                    </div>
                  </div>
                  <Select
                    value={settings.emailProvider}
                    onValueChange={(value) =>
                      setSettings({ ...settings, emailProvider: value })
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-10 w-10 p-2 bg-green-600 rounded-lg text-white" />
                    <div>
                      <div className="font-medium">Stockage Cloud</div>
                      <div className="text-sm text-muted-foreground">AWS S3 / Azure</div>
                    </div>
                  </div>
                  <Select
                    value={settings.storageProvider}
                    onValueChange={(value) =>
                      setSettings({ ...settings, storageProvider: value })
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s3">AWS S3</SelectItem>
                      <SelectItem value="azure">Azure Blob</SelectItem>
                      <SelectItem value="gcp">Google Cloud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
