/**
 * Compta - Paramètres
 *
 * Gestion du logo, coordonnées entreprise et templates par défaut
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Upload,
  Trash2,
  Save,
  Image,
  CheckCircle,
  Loader2,
  FileSignature,
  PenTool,
} from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { TEMPLATES } from '@/data/invoiceTemplates';
import type { TemplateId } from '@/types/templates';
import TemplateGridSelector from '@/components/compta/TemplateGridSelector';

export default function ComptaSettingsPage() {
  const { settings, loading, updateSettings, uploadLogo, deleteLogo, uploadSignature, deleteSignature } = useCompanySettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(settings?.company_name || '');
  const [companyAddress, setCompanyAddress] = useState(settings?.company_address || '');
  const [companyPhone, setCompanyPhone] = useState(settings?.company_phone || '');
  const [companyEmail, setCompanyEmail] = useState(settings?.company_email || '');
  const [defaultInvoiceTemplate, setDefaultInvoiceTemplate] = useState<TemplateId>(
    (settings?.default_invoice_template as TemplateId) || 'classic'
  );
  const [defaultQuoteTemplate, setDefaultQuoteTemplate] = useState<TemplateId>(
    (settings?.default_quote_template as TemplateId) || 'classic'
  );

  const [uploading, setUploading] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mettre à jour les états quand settings se charge
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name);
      setCompanyAddress(settings.company_address || '');
      setCompanyPhone(settings.company_phone || '');
      setCompanyEmail(settings.company_email || '');
      setDefaultInvoiceTemplate(settings.default_invoice_template);
      setDefaultQuoteTemplate(settings.default_quote_template);
    }
  }, [settings]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadLogo(file);
    setUploading(false);
  };

  const handleSignatureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSignature(true);
    await uploadSignature(file);
    setUploadingSignature(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      company_name: companyName,
      company_address: companyAddress || undefined,
      company_phone: companyPhone || undefined,
      company_email: companyEmail || undefined,
      default_invoice_template: defaultInvoiceTemplate,
      default_quote_template: defaultQuoteTemplate,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Paramètres Compta
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre logo, coordonnées et templates de documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Logo */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Apparaîtra sur vos documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {settings?.logo_url ? (
              <div className="space-y-3">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="max-h-32 mx-auto object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteLogo}
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Image className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">Aucun logo</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Uploader
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG - Max 2 MB
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Signature</CardTitle>
            <CardDescription>
              Apparaîtra en bas des factures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleSignatureSelect}
              className="hidden"
            />

            {settings?.signature_url ? (
              <div className="space-y-3">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={settings.signature_url}
                    alt="Signature"
                    className="max-h-32 mx-auto object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={uploadingSignature}
                    className="flex-1"
                  >
                    {uploadingSignature ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSignature}
                    disabled={uploadingSignature}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileSignature className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">Aucune signature</p>
                <Button
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={uploadingSignature}
                  size="sm"
                >
                  {uploadingSignature ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Uploader
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Signez sur papier blanc et prenez en photo
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Signature</CardTitle>
            <CardDescription>
              Signature pour vos documents officiels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleSignatureSelect}
              className="hidden"
            />

            {settings?.signature_url ? (
              <div className="space-y-3">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={settings.signature_url}
                    alt="Signature"
                    className="max-h-24 mx-auto object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={uploadingSignature}
                    className="flex-1"
                  >
                    {uploadingSignature ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSignature}
                    disabled={uploadingSignature}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <PenTool className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">Aucune signature</p>
                <Button
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={uploadingSignature}
                  size="sm"
                >
                  {uploadingSignature ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Uploader une signature
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, WebP - Max 2 MB
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coordonnées */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Coordonnées de l'entreprise</CardTitle>
            <CardDescription>
              Ces informations apparaîtront sur tous vos documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                <Input
                  id="company_name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Mon Entreprise SARL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="contact@entreprise.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone">Téléphone</Label>
                <Input
                  id="company_phone"
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+221 XX XXX XX XX"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company_address">Adresse complète</Label>
                <Input
                  id="company_address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Rue, Ville, Pays"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Modèles de documents</CardTitle>
          <CardDescription>
            Choisissez les templates par défaut pour vos factures et devis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Template Factures */}
          <div>
            <Label className="mb-4 block text-lg font-semibold">Template par défaut pour les factures</Label>
            <TemplateGridSelector
              templates={TEMPLATES}
              selectedId={defaultInvoiceTemplate}
              onChange={(id) => setDefaultInvoiceTemplate(id as TemplateId)}
              companyName={companyName}
              logoUrl={settings?.logo_url}
            />
          </div>

          {/* Template Devis */}
          <div>
            <Label className="mb-4 block text-lg font-semibold">Template par défaut pour les devis</Label>
            <TemplateGridSelector
              templates={TEMPLATES}
              selectedId={defaultQuoteTemplate}
              onChange={(id) => setDefaultQuoteTemplate(id as TemplateId)}
              companyName={companyName}
              logoUrl={settings?.logo_url}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !companyName} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
