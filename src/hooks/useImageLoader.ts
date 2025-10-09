import { useState, useEffect, useCallback } from 'react';

// Types stricts pour les sources d'images
type ImageSource = string | null | undefined;
type ImageUrl = string | null;
type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

// Interface pour le retour du hook
interface UseImageLoaderReturn {
  imageUrl: ImageUrl;
  isLoading: boolean;
  error: string | null;
  loadingState: LoadingState;
}

// Configuration pour la conversion base64 vers blob
const BASE64_TO_BLOB_THRESHOLD = 100 * 1024; // 100KB

/**
 * Hook personnalisé pour charger et gérer les images
 * 
 * Fonctionnalités :
 * - Gestion automatique des blob URLs avec cleanup
 * - Conversion base64 vers blob si taille > 100KB
 * - Gestion d'erreur avec fallback
 * - Types TypeScript stricts
 * 
 * @param source - Source de l'image (blob URL, base64, ou URL classique)
 * @returns Objet contenant l'URL utilisable, l'état de chargement et les erreurs
 */
export const useImageLoader = (source: ImageSource): UseImageLoaderReturn => {
  const [imageUrl, setImageUrl] = useState<ImageUrl>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Fonction pour convertir base64 en blob si nécessaire
  const convertBase64ToBlob = useCallback((base64String: string): string => {
    try {
      // Vérifier si c'est un base64 valide
      if (!base64String.startsWith('data:image/')) {
        return base64String;
      }

      // Calculer la taille approximative du base64
      const sizeInBytes = (base64String.length * 3) / 4;
      
      // Si la taille est inférieure au seuil, garder le base64
      if (sizeInBytes < BASE64_TO_BLOB_THRESHOLD) {
        return base64String;
      }

      // Convertir base64 en blob
      const [header, data] = base64String.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
      
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn('Erreur lors de la conversion base64 vers blob:', err);
      return base64String; // Fallback vers le base64 original
    }
  }, []);

  // Fonction pour nettoyer les blob URLs
  const cleanupBlobUrl = useCallback((url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  // Fonction pour valider et traiter la source d'image
  const processImageSource = useCallback((source: ImageSource): string | null => {
    if (!source) return null;

    try {
      // URL classique (http/https)
      if (source.startsWith('http://') || source.startsWith('https://')) {
        return source;
      }

      // Blob URL
      if (source.startsWith('blob:')) {
        return source;
      }

      // Base64
      if (source.startsWith('data:image/')) {
        return convertBase64ToBlob(source);
      }

      // Fallback pour les autres cas
      return source;
    } catch (err) {
      console.warn('Erreur lors du traitement de la source d\'image:', err);
      return null;
    }
  }, [convertBase64ToBlob]);

  // Effet principal pour gérer le chargement de l'image
  useEffect(() => {
    // Reset des états
    setError(null);
    setLoadingState('idle');

    if (!source) {
      setImageUrl(null);
      setLoadingState('idle');
      return;
    }

    setLoadingState('loading');

    try {
      const processedUrl = processImageSource(source);
      
      if (!processedUrl) {
        setError('Source d\'image invalide');
        setLoadingState('error');
        return;
      }

      // Si c'est une URL classique, vérifier qu'elle est accessible
      if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
        // Créer une image pour tester le chargement
        const img = new Image();
        
        img.onload = () => {
          setImageUrl(processedUrl);
          setLoadingState('loaded');
        };
        
        img.onerror = () => {
          setError('Impossible de charger l\'image');
          setLoadingState('error');
        };
        
        img.src = processedUrl;
      } else {
        // Pour les blob URLs et base64, on peut directement les utiliser
        setImageUrl(processedUrl);
        setLoadingState('loaded');
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'image');
      setLoadingState('error');
    }
  }, [source, processImageSource]);

  // Cleanup des blob URLs lors du démontage ou changement de source
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        cleanupBlobUrl(imageUrl);
      }
    };
  }, [imageUrl, cleanupBlobUrl]);

  return {
    imageUrl,
    isLoading: loadingState === 'loading',
    error,
    loadingState
  };
};

// Hook utilitaire pour précharger plusieurs images
export const useImagePreloader = (sources: ImageSource[]) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const loadImages = async () => {
      const results: Record<string, string> = {};
      const states: Record<string, LoadingState> = {};
      const errorStates: Record<string, string | null> = {};

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const key = `image_${i}`;
        
        if (!source) {
          states[key] = 'idle';
          errorStates[key] = null;
          continue;
        }

        states[key] = 'loading';

        try {
          // Utiliser le même traitement que useImageLoader
          const processedUrl = source.startsWith('data:image/') 
            ? source 
            : source.startsWith('blob:') 
            ? source 
            : source;

          if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
            const img = new Image();
            
            await new Promise((resolve, reject) => {
              img.onload = () => resolve(processedUrl);
              img.onerror = () => reject(new Error('Image load failed'));
              img.src = processedUrl;
            });
          }

          results[key] = processedUrl;
          states[key] = 'loaded';
          errorStates[key] = null;
        } catch (err) {
          states[key] = 'error';
          errorStates[key] = 'Erreur lors du chargement';
        }
      }

      setLoadedImages(results);
      setLoadingStates(states);
      setErrors(errorStates);
    };

    loadImages();
  }, [sources]);

  return {
    loadedImages,
    loadingStates,
    errors,
    isAllLoaded: Object.values(loadingStates).every(state => state === 'loaded'),
    hasErrors: Object.values(errors).some(error => error !== null)
  };
};

export default useImageLoader;
