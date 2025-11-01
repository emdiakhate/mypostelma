import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Platform, getPlatformMediaRestrictions, validateMediaForPlatforms, isVideoFile } from '@/utils/mediaValidation';

interface PlatformMediaValidatorProps {
  selectedPlatforms: Platform[];
  mediaFile: File | null;
  videoUrl?: string | null;
}

export const PlatformMediaValidator: React.FC<PlatformMediaValidatorProps> = ({
  selectedPlatforms,
  mediaFile,
  videoUrl
}) => {
  // Vérifier si c'est une vidéo (fichier ou URL)
  const hasVideo = (mediaFile && isVideoFile(mediaFile)) || videoUrl;
  const hasImage = mediaFile && !isVideoFile(mediaFile);

  // Valider la compatibilité
  const validation = validateMediaForPlatforms(mediaFile, selectedPlatforms);

  // Afficher les restrictions par plateforme
  const platformRestrictions = selectedPlatforms.map(platform => ({
    platform,
    restriction: getPlatformMediaRestrictions(platform)
  })).filter(p => p.restriction);

  return (
    <div className="space-y-2">
      {/* Afficher les restrictions par plateforme */}
      {platformRestrictions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {platformRestrictions.map(({ platform, restriction }) => (
            <Badge key={platform} variant="outline" className="text-xs">
              {platform}: {restriction}
            </Badge>
          ))}
        </div>
      )}

      {/* Erreurs de validation */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validation.errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Messages d'information */}
      {hasVideo && selectedPlatforms.length > 0 && (
        <Alert className="border-blue-500 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            🎥 Vidéo détectée - Seuls TikTok et YouTube sont disponibles
          </AlertDescription>
        </Alert>
      )}

      {hasImage && selectedPlatforms.some(p => ['tiktok', 'youtube'].includes(p)) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            📸 TikTok et YouTube n'acceptent pas les images, uniquement les vidéos
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
