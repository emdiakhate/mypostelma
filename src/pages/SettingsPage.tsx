import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Palette, Globe, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  
  // États pour les paramètres
  const [settings, setSettings] = useState({
    // Paramètres généraux
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    
    // Paramètres de notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    mentionAlerts: true,
    
    // Paramètres d'affichage
    theme: 'light',
    compactMode: false,
    showEngagementMetrics: true,
    
    // Paramètres de sécurité
    twoFactorAuth: false,
    sessionTimeout: '24',
    
    // Paramètres de publication
    autoSchedule: false,
    defaultPlatforms: ['instagram'],
    captionLength: 'medium',
    
    // Paramètres IA
    aiTone: 'automatic',
    aiLanguage: 'fr',
    autoHashtags: true,
    smartScheduling: true
  });

  const [isSaving, setIsSaving] = useState(false);

  // Gestion des changements de paramètres
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Sauvegarde des paramètres
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sauvegarder dans localStorage
      localStorage.setItem('postelma_settings', JSON.stringify(settings));
      
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialisation des paramètres
  const handleReset = () => {
    const defaultSettings = {
      language: 'fr',
      timezone: 'Europe/Paris',
      dateFormat: 'DD/MM/YYYY',
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      mentionAlerts: true,
      theme: 'light',
      compactMode: false,
      showEngagementMetrics: true,
      twoFactorAuth: false,
      sessionTimeout: '24',
      autoSchedule: false,
      defaultPlatforms: ['instagram'],
      captionLength: 'medium',
      aiTone: 'automatic',
      aiLanguage: 'fr',
      autoHashtags: true,
      smartScheduling: true
    };
    
    setSettings(defaultSettings);
    toast.info('Paramètres réinitialisés');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        </div>
        <p className="text-gray-600">
          Gérez vos préférences et paramètres de l'application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation latérale */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Général
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Palette className="w-4 h-4 mr-2" />
                Apparence
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Sécurité
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                Publication
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Paramètres généraux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Paramètres généraux
              </CardTitle>
              <CardDescription>
                Configuration de base de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger>
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
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Format de date</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configurez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications push</Label>
                  <p className="text-sm text-gray-500">Recevoir des notifications push</p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rapports hebdomadaires</Label>
                  <p className="text-sm text-gray-500">Recevoir un rapport hebdomadaire</p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertes de mentions</Label>
                  <p className="text-sm text-gray-500">Être notifié des mentions</p>
                </div>
                <Switch
                  checked={settings.mentionAlerts}
                  onCheckedChange={(checked) => handleSettingChange('mentionAlerts', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Thème</Label>
                <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="auto">Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode compact</Label>
                  <p className="text-sm text-gray-500">Interface plus compacte</p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Afficher les métriques d'engagement</Label>
                  <p className="text-sm text-gray-500">Afficher les statistiques d'engagement</p>
                </div>
                <Switch
                  checked={settings.showEngagementMetrics}
                  onCheckedChange={(checked) => handleSettingChange('showEngagementMetrics', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sécurité
              </CardTitle>
              <CardDescription>
                Paramètres de sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Authentification à deux facteurs</Label>
                  <p className="text-sm text-gray-500">Sécuriser votre compte avec 2FA</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Délai d'expiration de session (heures)</Label>
                <Select value={settings.sessionTimeout} onValueChange={(value) => handleSettingChange('sessionTimeout', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 heure</SelectItem>
                    <SelectItem value="8">8 heures</SelectItem>
                    <SelectItem value="24">24 heures</SelectItem>
                    <SelectItem value="168">7 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Publication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Publication
              </CardTitle>
              <CardDescription>
                Paramètres par défaut pour les publications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Planification automatique</Label>
                  <p className="text-sm text-gray-500">Planifier automatiquement les publications</p>
                </div>
                <Switch
                  checked={settings.autoSchedule}
                  onCheckedChange={(checked) => handleSettingChange('autoSchedule', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="captionLength">Longueur des légendes</Label>
                <Select value={settings.captionLength} onValueChange={(value) => handleSettingChange('captionLength', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Court (50-100 caractères)</SelectItem>
                    <SelectItem value="medium">Moyen (100-200 caractères)</SelectItem>
                    <SelectItem value="long">Long (200+ caractères)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hashtags automatiques</Label>
                  <p className="text-sm text-gray-500">Suggérer automatiquement des hashtags</p>
                </div>
                <Switch
                  checked={settings.autoHashtags}
                  onCheckedChange={(checked) => handleSettingChange('autoHashtags', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Planification intelligente</Label>
                  <p className="text-sm text-gray-500">Suggérer les meilleurs moments pour publier</p>
                </div>
                <Switch
                  checked={settings.smartScheduling}
                  onCheckedChange={(checked) => handleSettingChange('smartScheduling', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
