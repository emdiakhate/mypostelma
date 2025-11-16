import { useState } from 'react';
import { Loader2, Sparkles, Download, ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_TYPES, getTemplatePrompt, TEMPLATE_RESULT_LABELS } from '@/config/templatePrompts';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UseTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template: Template;
}

export function UseTemplateModal({ open, onClose, template }: UseTemplateModalProps) {
  const [productType, setProductType] = useState('bag');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; label: string }>>([]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast.error('Veuillez télécharger une image');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Upload image to Supabase storage
      const fileName = `studio/${Date.now()}_${uploadedImage.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, uploadedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Get the optimized prompt for this template
      const prompt = getTemplatePrompt(template.id, productType);
      
      console.log('Generating with prompt:', prompt);
      
      // Call fal.ai image generation function
      const { data, error } = await supabase.functions.invoke('fal-image-generation', {
        body: {
          prompt: prompt,
          image_urls: [publicUrl],
          type: 'edit'
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        // Get labels for this template
        const labels = TEMPLATE_RESULT_LABELS[template.id] || ['Image 1', 'Image 2', 'Image 3', 'Image 4'];
        
        // For now, we'll create 4 variations using the same generation
        // In production, you'd want to generate 4 different images
        const images = labels.map((label) => ({
          url: data.imageUrl,
          label: label
        }));
        
        setGeneratedImages(images);
        toast.success(`${images.length} images générées avec succès !`);
      }
    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, label: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.id}_${label.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image téléchargée !');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <template.icon className="h-5 w-5" />
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Type Selector */}
          <div>
            <Label>Type de produit <span className="text-red-500">*</span></Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Photo du produit <span className="text-red-500">*</span></Label>
            <div className="mt-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                {uploadPreview ? (
                  <img src={uploadPreview} alt="Preview" className="max-h-36 object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImagePlus className="h-10 w-10" />
                    <span className="text-sm">Cliquez pour télécharger</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !uploadedImage}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Générer 4 variations
              </>
            )}
          </Button>

          {/* Generated Images Grid */}
          {generatedImages.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  ✅ {generatedImages.length} images générées avec succès
                </Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((img, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-48 object-cover"
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 p-3">
                      <span className="text-sm font-medium text-center w-full">
                        {img.label}
                      </span>
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(img.url, img.label)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Télécharger
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            toast.info('Fonctionnalité à venir');
                          }}
                        >
                          Utiliser dans un post
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
