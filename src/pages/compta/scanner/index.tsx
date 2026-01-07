/**
 * Compta - Scanner OCR
 *
 * Scan de factures/devis papier avec OpenAI Vision API
 * KILLER FEATURE pour le marché africain
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Upload,
  FileText,
  Receipt,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useOcrScans } from '@/hooks/useCompta';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ScannerPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { scans, loading: scansLoading, createOcrScan, processOcrScan } = useOcrScans();

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentScan, setCurrentScan] = useState<any>(null);

  // Sélectionner un fichier
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Format invalide',
        description: 'Formats acceptés: JPG, PNG, WebP, PDF',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'Taille maximum: 10 MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Générer preview pour images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Upload et traitement
  const handleUploadAndScan = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      // 1. Upload vers Supabase Storage
      const fileName = `ocr-${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const fileUrl = urlData.publicUrl;

      // 3. Créer le scan dans la DB
      const scan = await createOcrScan({
        file_url: fileUrl,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
      });

      setCurrentScan(scan);
      setUploading(false);
      setProcessing(true);

      // 4. Appeler OpenAI Vision API pour extraction
      const extractedData = await processOcrScan(scan.id);

      setProcessing(false);

      if (extractedData && extractedData.confidence_score && extractedData.confidence_score > 50) {
        toast({
          title: 'Scan réussi !',
          description: `Données extraites avec ${extractedData.confidence_score}% de confiance`,
        });

        // Rediriger vers le formulaire pré-rempli
        if (extractedData.document_type === 'quote') {
          navigate(`/app/compta/devis/new?from_scan=${scan.id}`);
        } else {
          navigate(`/app/compta/factures/new?from_scan=${scan.id}`);
        }
      } else {
        toast({
          title: 'Extraction partielle',
          description: 'Certaines données n\'ont pas pu être extraites. Veuillez vérifier.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setUploading(false);
      setProcessing(false);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de traiter le document',
        variant: 'destructive',
      });
    }
  };

  // Ouvrir le sélecteur de fichiers
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Camera className="h-8 w-8" />
          Scanner OCR
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            IA
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          Scannez vos factures et devis papier avec l'intelligence artificielle
        </p>
      </div>

      {/* Alert info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Comment ça marche ?</strong> Prenez une photo ou uploadez une image de votre
          facture/devis. Notre IA va extraire automatiquement les informations (client, montants,
          dates, lignes de produits) et pré-remplir le formulaire pour vous.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone d'upload */}
        <Card>
          <CardHeader>
            <CardTitle>1. Sélectionner un document</CardTitle>
            <CardDescription>
              Image (JPG, PNG, WebP) ou PDF - Maximum 10 MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Boutons d'upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={openFilePicker}
                variant="outline"
                className="h-24 flex-col gap-2"
                disabled={uploading || processing}
              >
                <Upload className="h-8 w-8" />
                <span>Choisir un fichier</span>
              </Button>

              <Button
                onClick={openFilePicker}
                variant="outline"
                className="h-24 flex-col gap-2"
                disabled={uploading || processing}
              >
                <Camera className="h-8 w-8" />
                <span>Prendre une photo</span>
              </Button>
            </div>

            {/* Preview */}
            {selectedFile && (
              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {selectedFile.type === 'application/pdf' ? (
                      <FileText className="h-10 w-10 text-red-600" />
                    ) : (
                      <Receipt className="h-10 w-10 text-blue-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>

                {/* Image preview */}
                {previewUrl && (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                )}

                {/* Bouton de scan */}
                <Button
                  onClick={handleUploadAndScan}
                  className="w-full"
                  size="lg"
                  disabled={uploading || processing}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Upload en cours...
                    </>
                  ) : processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Extraction IA en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Scanner avec l'IA
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* État du traitement */}
            {processing && currentScan && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <strong>Analyse en cours...</strong>
                  <br />
                  Notre IA analyse le document et extrait les informations. Cela peut prendre
                  quelques secondes.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Historique des scans */}
        <Card>
          <CardHeader>
            <CardTitle>Scans récents</CardTitle>
            <CardDescription>
              Historique de vos documents scannés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scansLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto animate-spin mb-3" />
                <p>Chargement...</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun scan pour le moment</p>
                <p className="text-xs mt-1">Uploadez votre premier document ci-contre</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scans.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {scan.file_type === 'application/pdf' ? (
                        <FileText className="h-8 w-8 text-red-600 flex-shrink-0" />
                      ) : (
                        <Receipt className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{scan.file_name}</p>
                          {scan.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                          {scan.status === 'failed' && (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                          {scan.status === 'processing' && (
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(scan.created_at, 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                        {scan.confidence_score && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Confiance: {scan.confidence_score}%
                            </Badge>
                          </div>
                        )}
                      </div>
                      {scan.status === 'completed' && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exemples */}
      <Card>
        <CardHeader>
          <CardTitle>Exemples de documents supportés</CardTitle>
          <CardDescription>
            Notre IA peut extraire les données de ces types de documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-1">Devis</h3>
              <p className="text-sm text-muted-foreground">
                Propositions commerciales, estimations
              </p>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">Factures</h3>
              <p className="text-sm text-muted-foreground">
                Factures fournisseurs, clients
              </p>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <Camera className="h-12 w-12 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold mb-1">Photos</h3>
              <p className="text-sm text-muted-foreground">
                Photos de documents papier
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
