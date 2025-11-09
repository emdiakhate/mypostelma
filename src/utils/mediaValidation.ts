import { toast } from 'sonner';

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'threads' | 'tiktok' | 'youtube';

// TikTok et YouTube n'acceptent PAS les images (uniquement les vidéos)
const VIDEO_ONLY_PLATFORMS: Platform[] = ['tiktok', 'youtube'];
// Toutes les plateformes acceptent les vidéos
const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'twitter', 'threads', 'tiktok', 'youtube'];

export interface MediaValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const validateMediaForPlatforms = (
  file: File | null,
  selectedPlatforms: Platform[]
): MediaValidationResult => {
  // Pas de fichier = OK
  if (!file) {
    return { isValid: true };
  }

  const isVideo = isVideoFile(file);
  const isImage = isImageFile(file);

  // Si c'est une vidéo - toutes les plateformes acceptent les vidéos
  if (isVideo) {
    return { isValid: true };
  }

  // Si c'est une image - TikTok et YouTube n'acceptent PAS les images
  if (isImage) {
    const hasVideoOnlyPlat = selectedPlatforms.some(p => VIDEO_ONLY_PLATFORMS.includes(p));
    
    if (hasVideoOnlyPlat) {
      const invalidPlatforms = selectedPlatforms
        .filter(p => VIDEO_ONLY_PLATFORMS.includes(p))
        .join(', ');
      
      return {
        isValid: false,
        errorMessage: `❌ Les images ne sont pas acceptées sur ${invalidPlatforms}. Ces plateformes acceptent uniquement les vidéos.`,
      };
    }

    return { isValid: true };
  }

  return {
    isValid: false,
    errorMessage: '❌ Format de fichier non supporté',
  };
};

export const showPlatformCompatibilityToast = (
  file: File | null,
  selectedPlatforms: Platform[]
) => {
  const result = validateMediaForPlatforms(file, selectedPlatforms);
  
  if (!result.isValid && result.errorMessage) {
    toast.error(result.errorMessage);
  }
};

export const getPlatformMediaRestrictions = (platform: Platform): string => {
  if (VIDEO_ONLY_PLATFORMS.includes(platform)) {
    return '🎥 Vidéo uniquement';
  }
  
  return '📸🎥 Images et vidéos';
};

export const getAvailablePlatforms = (file: File | null): Platform[] => {
  if (!file) {
    return ALL_PLATFORMS;
  }

  const isVideo = isVideoFile(file);
  
  // Les vidéos sont acceptées sur toutes les plateformes
  if (isVideo) {
    return ALL_PLATFORMS;
  }
  
  // Les images sont acceptées partout sauf TikTok et YouTube
  return ALL_PLATFORMS.filter(p => !VIDEO_ONLY_PLATFORMS.includes(p));
};
