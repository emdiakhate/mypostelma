import { toast } from 'sonner';

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'threads' | 'tiktok' | 'youtube';

const VIDEO_ONLY_PLATFORMS: Platform[] = ['tiktok', 'youtube'];
const NO_VIDEO_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'twitter', 'threads'];

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

  // Si c'est une vidéo
  if (isVideo) {
    const hasNonVideoPlat = selectedPlatforms.some(p => NO_VIDEO_PLATFORMS.includes(p));
    
    if (hasNonVideoPlat) {
      const invalidPlatforms = selectedPlatforms
        .filter(p => NO_VIDEO_PLATFORMS.includes(p))
        .join(', ');
      
      return {
        isValid: false,
        errorMessage: `❌ Les vidéos ne sont autorisées que sur TikTok et YouTube. Plateformes incompatibles : ${invalidPlatforms}`,
      };
    }

    // Si uniquement TikTok/YouTube = OK
    return { isValid: true };
  }

  // Si c'est une image
  if (isImage) {
    const hasVideoOnlyPlat = selectedPlatforms.some(p => VIDEO_ONLY_PLATFORMS.includes(p));
    
    if (hasVideoOnlyPlat) {
      return {
        isValid: false,
        errorMessage: '❌ TikTok et YouTube acceptent uniquement des vidéos, pas des images',
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
  
  if (NO_VIDEO_PLATFORMS.includes(platform)) {
    return '📸 Images uniquement';
  }
  
  return '';
};

export const getAvailablePlatforms = (file: File | null): Platform[] => {
  if (!file) {
    return ['instagram', 'facebook', 'linkedin', 'twitter', 'threads', 'tiktok', 'youtube'];
  }

  const isVideo = isVideoFile(file);
  
  if (isVideo) {
    return VIDEO_ONLY_PLATFORMS;
  }
  
  return NO_VIDEO_PLATFORMS;
};
