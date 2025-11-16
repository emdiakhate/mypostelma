import React, { useState, useMemo } from 'react';
import { 
  Palette, Rotate3D, Home, Megaphone, Users, User,
  Eye, Wand2, ArrowRight, Sparkles, Clock, Loader2,
  Video, Play, Building, Store, Egg, Shirt, Download, ImagePlus, Plus
} from "lucide-react";
import sacnoir from '@/assets/sacnoir.png';
import sacblanc from '@/assets/sacblanc.png';
import sacrouge from '@/assets/sacrouge.png';
import sacbleu from '@/assets/sacbleu.png';
import canapecote from '@/assets/canapecote.png';
import canapeanglegauche from '@/assets/canapeanglegauche.png';
import canapedroit from '@/assets/canapedroit.png';
import canapeDos from '@/assets/canapedos.png';
import guerlain from '@/assets/guerlain.jpg';
import fatimaZahra from '@/assets/Fatima-Zahra-Ba.jpeg';
import imageIbadou from '@/assets/image_ibadou.jpeg';
import aynnoviaLogo from '@/assets/aynnovia-logo.png';
import aynnovia1 from '@/assets/aynnovia-1.png';
import aynnovia2 from '@/assets/aynnovia-2.png';
import aynnovia3 from '@/assets/aynnovia-3.png';
import aynnovia4 from '@/assets/aynnovia-4.png';
import abdouparfum from '@/assets/abdouparfum.jpg';
import bounaburo from '@/assets/Bounaburo.png';
import bouna from '@/assets/Bouna.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_TYPES, getTemplatePrompt, TEMPLATE_RESULT_LABELS } from '@/config/templatePrompts';
import { Textarea } from '@/components/ui/textarea';

// Types
interface TemplateInput {
  type: 'image' | 'color-picker' | 'text' | 'select' | 'multi-select';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  default?: string | string[];
  multiple?: boolean;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  inputs: TemplateInput[];
  exampleBefore: string | null; // Peut être null pour les modèles avec plusieurs images d'entrée
  exampleBeforeMultiple?: string[]; // Images multiples en entrée
  exampleAfter: string | null; // Peut être null pour les modèles multi-images
  exampleAfterMultiple?: string[]; // Nouvelles images multiples
  hasMultipleResults?: boolean; // Flag pour identifier les modèles multi-images
  hasMultipleInputs?: boolean; // Indique si le template nécessite plusieurs images en entrée
  resultCount?: number; // Nombre d'images à afficher
  useCases: string[];
}

// Interface pour les templates vidéo
interface VideoTemplate {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  categories: string[];
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

// Données des 6 modèles
const templates: Template[] = [
  {
    id: 'palette-couleurs',
    name: 'Palette de couleurs',
    category: 'variation',
    description: 'Générez votre produit dans différentes couleurs pour montrer toutes les variantes disponibles',
    icon: Palette,
    badge: 'Populaire',
    inputs: [
      { type: 'image', label: 'Photo du produit', required: true },
      { type: 'color-picker', label: 'Couleurs souhaitées (3-5)', required: true, multiple: true }
    ],
    exampleBefore: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
    exampleAfter: null, // Plus d'image unique
    exampleAfterMultiple: [
      sacnoir,   // Sac noir
      sacblanc,  // Sac blanc
      sacrouge,  // Sac rouge
      sacbleu    // Sac bleu
    ],
    hasMultipleResults: true,
    resultCount: 4,
    useCases: ['Sacs', 'Chaussures', 'Vêtements', 'Meubles', 'Accessoires']
  },
  {
    id: 'vue-360',
    name: 'Vue 360°',
    category: 'variation',
    description: 'Présentez votre produit sous tous les angles comme un showroom professionnel',
    icon: Rotate3D,
    badge: 'Populaire',
    inputs: [
      { type: 'image', label: 'Photo du produit (vue de face)', required: true },
      { type: 'select', label: 'Nombre d\'angles', options: ['4 angles', '6 angles', '8 angles'], default: '6 angles' }
    ],
    exampleBefore: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    exampleAfter: null, // Plus d'image unique
    exampleAfterMultiple: [
      canapecote,        // Côté
      canapeanglegauche, // Profil G
      canapedroit,       // Profil D
      canapeDos          // Dos
    ],
    hasMultipleResults: true,
    resultCount: 4,
    useCases: ['Meubles', 'Électronique', 'Chaussures', 'Voitures', 'Décoration']
  },
  {
    id: 'branding',
    name: 'Branding',
    category: 'variation',
    description: 'Présentez votre logo sur différents supports de branding',
    icon: Rotate3D,
    badge: 'Nouveau',
    inputs: [
      { type: 'image', label: 'Logo de votre marque', required: true }
    ],
    exampleBefore: aynnoviaLogo,
    exampleAfter: null,
    exampleAfterMultiple: [
      aynnovia1,
      aynnovia2,
      aynnovia3,
      aynnovia4
    ],
    hasMultipleResults: true,
    resultCount: 4,
    useCases: ['Logo', 'Branding', 'Identité visuelle', 'Marketing']
  },
  {
    id: 'mise-en-situation',
    name: 'Dans son environnement',
    category: 'contexte',
    description: 'Placez automatiquement votre produit dans des environnements réalistes',
    icon: Home,
    badge: 'Coup de cœur',
    inputs: [
      { type: 'image', label: 'Photo du produit', required: true },
      { type: 'multi-select', label: 'Environnements', options: ['Salon moderne', 'Chambre cosy', 'Bureau professionnel', 'Extérieur'], default: ['Salon moderne'] }
    ],
    exampleBefore: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    exampleAfter: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800',
    useCases: ['Meubles', 'Décoration', 'Luminaires', 'Plantes', 'Art']
  },
  {
    id: 'pub-reseaux-sociaux',
    name: 'Pub prête à poster',
    category: 'marketing',
    description: 'Créez des visuels publicitaires professionnels avec texte et design',
    icon: Megaphone,
    badge: 'Populaire',
    inputs: [
      { type: 'image', label: 'Photo du produit', required: true },
      { type: 'text', label: 'Slogan', placeholder: 'Ex: Élégance intemporelle', required: true },
      { type: 'select', label: 'Style', options: ['Moderne', 'Minimaliste', 'Luxe', 'Fun', 'Écologique'], default: 'Moderne' },
      { type: 'select', label: 'Format', options: ['Carré (1:1)', 'Story (9:16)', 'Bannière (16:9)', 'Tous'], default: 'Tous' }
    ],
    exampleBefore: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    exampleAfter: 'https://images.unsplash.com/photo-1611923134239-a5011a30d3a1?w=800',
    useCases: ['Tous produits', 'E-commerce', 'Marques', 'Services']
  },
  {
    id: 'lifestyle-branding',
    name: 'Style de vie',
    category: 'marketing',
    description: 'Intégrez votre produit dans des scènes de vie inspirantes',
    icon: Users,
    badge: 'Tendance',
    inputs: [
      { type: 'image', label: 'Photo du produit', required: true },
      { type: 'multi-select', label: 'Ambiances', options: ['Sport & Fitness', 'Travel & Aventure', 'Cocooning & Détente', 'Bureau & Productivité'], required: true }
    ],
    exampleBefore: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    exampleAfter: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    useCases: ['Mode', 'Sport', 'Accessoires', 'Tech', 'Bien-être']
  },
  {
    id: 'essayage-virtuel',
    name: 'Essayage virtuel',
    category: 'ecommerce',
    description: 'Montrez vos vêtements/accessoires portés par des mannequins variés',
    icon: User,
    badge: 'Innovation',
    inputs: [
      { type: 'image', label: 'Photo du vêtement (à plat ou sur cintre)', required: true },
      { type: 'multi-select', label: 'Types de mannequins', options: ['Homme casual', 'Femme élégante', 'Style sport', 'Style streetwear', 'Morphologies variées'], required: true }
    ],
    exampleBefore: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    exampleAfter: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800',
    useCases: ['Vêtements', 'Accessoires', 'Bijoux', 'Chaussures', 'Montres']
  },
  {
    id: 'style-influenceur',
    name: 'Style Influenceur',
    category: 'marketing',
    description: 'Créez des visuels UGC où un influenceur présente naturellement votre produit',
    icon: Users,
    badge: 'UGC',
    inputs: [
      { type: 'image', label: 'Photo du produit', required: true },
      { type: 'image', label: 'Photo de l\'influenceur', required: true }
    ],
    exampleBefore: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    exampleAfter: null,
    exampleAfterMultiple: [
      abdouparfum,
      bounaburo,
      bouna,
      abdouparfum
    ],
    hasMultipleResults: true,
    resultCount: 4,
    useCases: ['E-commerce', 'Marketing', 'UGC', 'Publicité']
  },
  {
    id: 'ugc-creator',
    name: 'UGC Creator',
    category: 'marketing',
    description: 'Fusionnez votre produit avec une photo d\'influenceur pour créer un visuel UGC authentique',
    icon: Users,
    badge: 'Nouveau',
    inputs: [
      { type: 'image', label: 'Photo du produit', required: true },
      { type: 'image', label: 'Photo de l\'influenceur', required: true }
    ],
    exampleBefore: null,
    exampleBeforeMultiple: [
      guerlain,      // Produit Guerlain
      fatimaZahra    // Influenceur Fatima-Zahra
    ],
    exampleAfter: imageIbadou,  // Image Ibadou (résultat fusion)
    hasMultipleResults: false,
    hasMultipleInputs: true,
    resultCount: 1,
    useCases: ['UGC', 'E-commerce', 'Marketing', 'Publicité']
  }
];

// Données des 6 templates vidéo
const videoTemplates: VideoTemplate[] = [
  {
    id: 'immobilier',
    title: 'Immobilier',
    description: 'Créez des visites virtuelles immobilières professionnelles',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    categories: ['Immobilier', 'Visite', 'Professionnel'],
    icon: Building,
    badge: 'Populaire'
  },
  {
    id: 'boutique',
    title: 'Présentation Boutique',
    description: 'Showcase de magasin/boutique avec ambiance professionnelle',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    videoUrl: '/presentation-boutique.mp4',
    categories: ['Commerce', 'Boutique', 'Retail'],
    icon: Store,
    badge: 'Nouveau'
  },
  {
    id: 'ferme-avicole',
    title: 'Ferme Avicole',
    description: 'Vidéo de ferme avec poules/volailles pour secteur agricole',
    thumbnail: 'https://img.youtube.com/vi/WFbZtk26KSM/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=WFbZtk26KSM',
    categories: ['Agriculture', 'Ferme', 'Élevage'],
    icon: Egg,
    badge: 'Spécialisé'
  },
  {
    id: 'nike-sport',
    title: 'Nike Sport',
    description: 'Présentation produit sportif style Nike avec dynamisme',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    categories: ['Sport', 'Mode', 'Dynamique'],
    icon: Shirt,
    badge: 'Trending'
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    description: 'Présentation de restaurant avec ambiance et plats',
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
    categories: ['Restaurant', 'Gastronomie', 'Hospitality'],
    icon: Store,
    badge: 'Populaire'
  },
  {
    id: 'salon-beaute',
    title: 'Salon de Beauté',
    description: 'Présentation de salon de beauté avec services',
    thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
    categories: ['Beauté', 'Salon', 'Services'],
    icon: Store,
    badge: 'Nouveau'
  }
];

// Composant TemplateCard
function TemplateCard({ template }: { template: Template }) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all group">
        {/* Badge en haut */}
        {template.badge && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600">
              {template.badge}
            </Badge>
          </div>
        )}

        {/* Image de preview */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={template.id === 'ugc-creator' ? fatimaZahra : template.exampleBefore}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Icône */}
          <div className="absolute bottom-4 left-4">
            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <template.icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{template.name}</span>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Cas d'usage */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Idéal pour :</p>
            <div className="flex flex-wrap gap-1">
              {template.useCases.slice(0, 3).map((useCase) => (
                <Badge key={useCase} variant="secondary" className="text-xs">
                  {useCase}
                </Badge>
              ))}
              {template.useCases.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.useCases.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button
            className="flex-1"
            onClick={() => setShowUseModal(true)}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Utiliser
          </Button>
        </CardFooter>
      </Card>

      {/* Modal Aperçu */}
      <PreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        template={template}
      />

      {/* Modal Utilisation */}
      <UseTemplateModal
        open={showUseModal}
        onClose={() => setShowUseModal(false)}
        template={template}
      />
    </>
  );
}

// Fonction helper pour les labels des résultats multiples
function getResultLabel(templateId: string, index: number): string {
  const labels = {
    'vue-360': ['Côté', 'Profil G', 'Profil D', 'Dos', '3/4', 'Dessus'],
    'palette-couleurs': ['Noir', 'Blanc', 'Rouge', 'Bleu'],
    'mise-en-situation': ['Salon', 'Chambre', 'Bureau', 'Extérieur'],
    'lifestyle-branding': ['Sport', 'Travel', 'Cocooning', 'Bureau'],
    'pub-reseaux-sociaux': ['Carré', 'Story', 'Bannière', 'Feed'],
    'style-influenceur': ['Influenceur 1', 'Influenceur 2', 'Influenceur 3', 'Influenceur 4']
  };

  const templateLabels = labels[templateId] || [];
  return templateLabels[index] || `Variation ${index + 1}`;
}

// Fonction helper pour les descriptions
function getExpectedOutput(templateId: string, hasMultipleResults?: boolean, hasMultipleInputs?: boolean): string {
  // Templates spéciaux avec descriptions personnalisées
  if (templateId === 'ugc-creator') {
    return 'Une image UGC authentique où l\'influenceur présente naturellement votre produit, parfait pour vos campagnes marketing';
  }

  if (templateId === 'style-influenceur') {
    return '4 visuels UGC authentiques avec différents influenceurs présentant naturellement votre produit';
  }

  if (!hasMultipleResults) {
    const singleOutputs = {
      'mise-en-situation': '4 visuels de votre produit intégré dans différents environnements réalistes',
      'pub-reseaux-sociaux': '3 formats publicitaires (carré, story, bannière) avec votre produit, slogan et design professionnel',
      'lifestyle-branding': '4 scènes lifestyle avec votre produit dans des situations inspirantes',
      'essayage-virtuel': '3-4 mannequins différents portant votre vêtement/accessoire'
    };
    return singleOutputs[templateId] || 'Un visuel professionnel de votre produit';
  }

  const multipleOutputs = {
    'vue-360': '4 à 8 vues de votre produit sous différents angles (face, profils, dos, 3/4, dessus) pour une présentation showroom',
    'palette-couleurs': 'Votre produit décliné en 4-6 couleurs différentes, parfait pour montrer toutes vos variantes disponibles'
  };

  return multipleOutputs[templateId] || 'Plusieurs variations de votre produit';
}

// Modal Aperçu (Avant/Après)
function PreviewModal({ open, onClose, template }: { open: boolean; onClose: () => void; template: Template }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <template.icon className="w-6 h-6 text-primary" />
            {template.name}
          </DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        {/* Comparaison Avant/Après */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AVANT - Gestion des images multiples en entrée */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="font-semibold text-sm">Avant</span>
              {template.hasMultipleInputs && (
                <Badge variant="outline" className="ml-auto">
                  2 images requises
                </Badge>
              )}
            </div>

            {/* SI 2 IMAGES EN ENTRÉE (hasMultipleInputs) */}
            {template.hasMultipleInputs && template.exampleBeforeMultiple ? (
              <div className="grid grid-cols-2 gap-2">
                {template.exampleBeforeMultiple.map((imageUrl, index) => (
                  <div 
                    key={index}
                    className="relative rounded-lg overflow-hidden border-2 border-orange-500/20"
                  >
                    <img
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {index === 0 ? 'Produit' : 'Influenceur'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* SI 1 IMAGE EN ENTRÉE (comme avant) */
              template.exampleBefore && (
                <div className="relative rounded-lg overflow-hidden border-2 border-orange-500/20">
                  <img
                    src={template.exampleBefore}
                    alt="Avant"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">Image originale</Badge>
                  </div>
                </div>
              )
            )}
          </div>

          {/* APRÈS - Conditionnel selon hasMultipleResults */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-semibold text-sm">Après</span>
              {template.hasMultipleResults && (
                <Badge variant="outline" className="ml-auto">
                  {template.resultCount} résultats
                </Badge>
              )}
            </div>

            {/* SI IMAGE UNIQUE */}
            {!template.hasMultipleResults && template.exampleAfter && (
              <div className="relative rounded-lg overflow-hidden border-2 border-green-500/20">
                <img
                  src={template.exampleAfter}
                  alt="Après"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-green-500">Résultat généré</Badge>
                </div>
              </div>
            )}

            {/* SI PLUSIEURS IMAGES */}
            {template.hasMultipleResults && template.exampleAfterMultiple && (
              <div className="grid grid-cols-2 gap-2">
                {template.exampleAfterMultiple.map((imageUrl, index) => (
                  <div 
                    key={index}
                    className="relative rounded-lg overflow-hidden border border-green-500/20 hover:border-green-500/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Résultat ${index + 1}`}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1 left-1">
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-green-500/90 text-white"
                      >
                        {getResultLabel(template.id, index)}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Ce que vous obtiendrez :</p>
              <p className="text-sm text-muted-foreground mt-1">
                {getExpectedOutput(template.id, template.hasMultipleResults, template.hasMultipleInputs)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Temps de génération :</p>
              <p className="text-sm text-muted-foreground mt-1">
                Environ {template.hasMultipleResults ? '60-90' : '30-60'} secondes
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={() => {
            onClose();
            // Ouvrir le modal d'utilisation
          }}>
            <Wand2 className="w-4 h-4 mr-2" />
            Utiliser ce modèle
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de visualisation de l'image */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Aperçu de l'image</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Aperçu"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedImage(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Composant ImageUploader simple
function ImageUploader({ onUpload }: { onUpload: (file: File) => void }) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        <div className="text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Cliquez pour sélectionner une image</p>
        </div>
      </label>
    </div>
  );
}

// Composant ColorPicker simple
function ColorPicker({ multiple, onChange }: { multiple?: boolean; onChange: (colors: string[]) => void }) {
  const [colors, setColors] = useState<string[]>([]);

  const addColor = (color: string) => {
    if (multiple) {
      const newColors = [...colors, color];
      setColors(newColors);
      onChange(newColors);
    } else {
      setColors([color]);
      onChange([color]);
    }
  };

  const removeColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);
    onChange(newColors);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((color) => (
          <button
            key={color}
            onClick={() => addColor(color)}
            className="w-8 h-8 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <div key={index} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm">{color}</span>
              <button onClick={() => removeColor(index)} className="text-red-500">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant MultiSelect simple
function MultiSelect({ options, onChange }: { options: string[]; onChange: (values: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    setSelected(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
              className="rounded"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Modal Utilisation (Formulaire)
function UseTemplateModal({ open, onClose, template }: { open: boolean; onClose: () => void; template: Template }) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; label: string }>>([]);
  const [productType, setProductType] = useState('other');
  const [prompt, setPrompt] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  // Pré-remplir le prompt quand le template ou le type de produit change
  React.useEffect(() => {
    const templatePrompt = getTemplatePrompt(template.id, productType);
    setPrompt(templatePrompt);
  }, [template.id, productType]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      // Créer une URL temporaire pour afficher l'image
      const imageUrl = URL.createObjectURL(file);
      setUploadedImageUrl(imageUrl);

      // Stocker le fichier dans formData
      setFormData(prev => ({ ...prev, uploadedFile: file }));
      toast.success('Image uploadée avec succès');
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    }
  };

  const handleGenerate = async () => {
    if (!formData.uploadedFile) {
      toast.error('Veuillez uploader une image');
      return;
    }

    setIsGenerating(true);
    try {
      // Convertir l'image en base64
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(formData.uploadedFile);
      });

      // Déterminer le nombre d'images à générer selon le template
      let numImages = 1;
      if (template.id === 'palette-couleurs' || template.id === 'vue-360') {
        numImages = 4;
      } else if (template.id === 'ugc-creator') {
        numImages = 1;
      }

      // Appeler l'Edge Function fal-image-generation
      const { data, error } = await supabase.functions.invoke('fal-image-generation', {
        body: {
          prompt: prompt,
          image_urls: [imageBase64],
          type: 'edit',
          num_images: numImages,
          template_id: template.id
        }
      });

      if (error) throw error;

      // Générer les labels pour chaque image
      const labels = TEMPLATE_RESULT_LABELS[template.id] || ['Image 1', 'Image 2', 'Image 3', 'Image 4'];
      
      // Utiliser les URLs retournées par l'API
      const imageUrls = data.imageUrls || [data.imageUrl];
      const images = imageUrls.slice(0, labels.length).map((url: string, index: number) => ({
        url: url,
        label: labels[index] || `Image ${index + 1}`
      }));

      setGeneratedImages(images);
      toast.success(`${images.length} image(s) générée(s) avec succès !`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération des images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = (imageUrl: string, label: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${template.name}-${label}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image téléchargée');
  };

  const handleUseInPost = (imageUrl: string) => {
    // Sauvegarder l'URL de l'image dans le localStorage
    localStorage.setItem('pendingPostImage', imageUrl);
    
    // Naviguer vers la page de création de posts
    window.location.href = '/app';
    
    toast.success('Redirection vers la création de posts...');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour générer vos visuels
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection du type de produit */}
          <div>
            <Label>Type de produit</Label>
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

          {/* Prompt pré-rempli */}
          <div>
            <Label>Prompt de génération</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 min-h-[120px]"
              placeholder="Le prompt sera généré automatiquement..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ce prompt sera utilisé pour générer vos images. Vous pouvez le modifier si nécessaire.
            </p>
          </div>

          {template.inputs.map((input) => (
            <div key={input.label}>
              <Label>{input.label} {input.required && <span className="text-red-500">*</span>}</Label>
              
              {input.type === 'image' && (
                <div className="mt-2 space-y-2">
                  <ImageUploader
                    onUpload={handleImageUpload}
                  />
                  {uploadedImageUrl && (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img 
                        src={uploadedImageUrl} 
                        alt="Image uploadée" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {input.type === 'color-picker' && (
                <ColorPicker
                  multiple={input.multiple}
                  onChange={(colors) => setFormData({ ...formData, colors })}
                />
              )}

              {input.type === 'text' && (
                <Input
                  placeholder={input.placeholder}
                  onChange={(e) => setFormData({ ...formData, [input.label]: e.target.value })}
                  className="mt-2"
                />
              )}

              {input.type === 'select' && (
                <Select
                  onValueChange={(value) => setFormData({ ...formData, [input.label]: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={`Choisir ${input.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {input.options?.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {input.type === 'multi-select' && (
                <MultiSelect
                  options={input.options || []}
                  onChange={(values) => setFormData({ ...formData, [input.label]: values })}
                />
              )}
            </div>
          ))}
        </div>

        {/* Images générées */}
        {generatedImages.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Images générées</h3>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((img, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border border-border bg-card">
                  <img src={img.url} alt={img.label} className="w-full h-48 object-cover" />
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-center">{img.label}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadImage(img.url, img.label)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseInPost(img.url)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Utiliser
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Générer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Composant VideoTemplateCard
function VideoTemplateCard({ template }: { template: VideoTemplate }) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all group">
        {/* Badge en haut */}
        {template.badge && (
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600">
              {template.badge}
            </Badge>
          </div>
        )}

        {/* Thumbnail vidéo */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={template.thumbnail}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {/* Overlay avec bouton play */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 rounded-full p-3">
              <Play className="w-6 h-6 text-gray-800" />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <template.icon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{template.title}</CardTitle>
              <CardDescription className="text-sm text-gray-600 mb-3">
                {template.description}
              </CardDescription>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.categories.map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowPreviewModal(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button
            className="flex-1"
            onClick={() => toast.success('Template vidéo sélectionné !')}
          >
            <Video className="w-4 h-4 mr-2" />
            Utiliser
          </Button>
        </CardFooter>
      </Card>

      {/* Modal Aperçu Vidéo */}
      <VideoPreviewModal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        template={template}
      />
    </>
  );
}

// Modal de prévisualisation vidéo
function VideoPreviewModal({ open, onClose, template }: { open: boolean; onClose: () => void; template: VideoTemplate }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <template.icon className="w-6 h-6 text-purple-600" />
            {template.title}
          </DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lecteur vidéo */}
          <div className="relative rounded-lg overflow-hidden bg-black">
            {template.videoUrl.includes('youtube.com') ? (
              // Iframe YouTube
              <iframe
                width="100%"
                height="400"
                src={template.videoUrl.replace('watch?v=', 'embed/')}
                title={template.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-96"
              />
            ) : (
              // Lecteur vidéo HTML5 standard
              <video
                controls
                className="w-full h-auto max-h-96"
                poster={template.thumbnail}
              >
                <source src={template.videoUrl} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )}
          </div>

          {/* Description détaillée */}
          <div className="space-y-2">
            <h4 className="font-semibold">À propos de ce template</h4>
            <p className="text-sm text-gray-600">
              Ce template vidéo est parfait pour {template.categories.join(', ').toLowerCase()}. 
              Il vous permet de créer des contenus professionnels adaptés à votre secteur d'activité.
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {template.categories.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={() => {
            toast.success('Template vidéo sélectionné !');
            onClose();
          }}>
            Utiliser ce template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Page principale
export default function CreationPage() {
  const [category, setCategory] = useState('all');

  const filteredTemplates = useMemo(() => {
    if (category === 'all') return templates;
    return templates.filter(template => template.category === category);
  }, [category]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Studio de Création</h1>
          <p className="text-muted-foreground">
            Créez des visuels professionnels pour vos produits en quelques clics
          </p>
        </div>
        
        {/* Onglets Image/Vidéo */}
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="video">Vidéo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="image" className="space-y-6">
            {/* Filtres par catégorie pour les images */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button 
                variant={category === 'all' ? 'default' : 'outline'} 
                onClick={() => setCategory('all')}
              >
                Tous
              </Button>
              <Button 
                variant={category === 'variation' ? 'default' : 'outline'}
                onClick={() => setCategory('variation')}
              >
                Variations
              </Button>
              <Button 
                variant={category === 'contexte' ? 'default' : 'outline'}
                onClick={() => setCategory('contexte')}
              >
                Mise en contexte
              </Button>
              <Button 
                variant={category === 'marketing' ? 'default' : 'outline'}
                onClick={() => setCategory('marketing')}
              >
                Marketing
              </Button>
              <Button 
                variant={category === 'ecommerce' ? 'default' : 'outline'}
                onClick={() => setCategory('ecommerce')}
              >
                E-commerce
              </Button>
            </div>

            {/* Grid des modèles d'images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="video" className="space-y-6">
            {/* Grid des templates vidéo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTemplates.map((template) => (
                <VideoTemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
