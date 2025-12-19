/**
 * Service pour gérer les publications via l'API Upload Post
 * Remplace le webhook n8n pour une meilleure gestion des publications
 */

import { supabase } from '@/integrations/supabase/client';

export interface PublishParams {
  profile_username: string;
  platforms: string[];
  title: string;
  description?: string;
  media_type: 'text' | 'photo' | 'video';
  photos?: string[];
  video?: string;
  scheduled_date?: string; // ISO-8601 format
  platform_specific_params?: Record<string, any>;
  first_comments?: Record<string, string>; // Premier commentaire par plateforme
}

export interface PublishResponse {
  success: boolean;
  data?: {
    request_id?: string;
    job_id?: string;
    scheduled_date?: string;
    message?: string;
    results?: Record<string, any>;
  };
  error?: string;
}

export interface PublishStatusResponse {
  success: boolean;
  data?: {
    request_id: string;
    status: 'pending' | 'in_progress' | 'completed';
    completed: number;
    total: number | null;
    results: Array<{
      platform: string;
      success: boolean;
      message?: string;
      url?: string;
      upload_timestamp?: string;
    }>;
    last_update: string;
  };
  error?: string;
}

export interface ScheduledPost {
  job_id: string;
  scheduled_date: string;
  post_type: 'video' | 'photo' | 'text';
  profile_username: string;
  title: string;
  preview_url?: string;
}

export interface ScheduledPostsResponse {
  success: boolean;
  data?: ScheduledPost[];
  error?: string;
}

/**
 * Publier du contenu via Upload Post API
 */
export const publishContent = async (params: PublishParams): Promise<PublishResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('upload-post-publish', {
      body: params
    });

    if (error) {
      console.error('Error calling edge function:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error publishing content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Vérifier le statut d'une publication asynchrone
 */
export const checkPublishStatus = async (requestId: string): Promise<PublishStatusResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('upload-post-status', {
      body: { request_id: requestId }
    });

    if (error) {
      console.error('Error checking status:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error checking status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Récupérer la liste des publications programmées
 */
export const getScheduledPosts = async (profileUsername: string): Promise<ScheduledPostsResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('upload-post-scheduled', {
      body: { profile_username: profileUsername }
    });

    if (error) {
      console.error('Error getting scheduled posts:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error getting scheduled posts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Annuler une publication programmée
 */
export const cancelScheduledPost = async (jobId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('upload-post-cancel-scheduled', {
      body: { job_id: jobId }
    });

    if (error) {
      console.error('Error canceling scheduled post:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error canceling scheduled post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Modifier une publication programmée
 */
export const editScheduledPost = async (
  jobId: string,
  updates: {
    scheduled_date?: string;
    title?: string;
    caption?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('upload-post-edit-scheduled', {
      body: {
        job_id: jobId,
        ...updates
      }
    });

    if (error) {
      console.error('Error editing scheduled post:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error editing scheduled post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Helper pour déterminer le type de média basé sur les paramètres
 */
export const determineMediaType = (params: {
  photos?: string[];
  video?: string;
}): 'text' | 'photo' | 'video' => {
  if (params.video) {
    return 'video';
  } else if (params.photos && params.photos.length > 0) {
    return 'photo';
  }
  return 'text';
};

/**
 * Helper pour construire les paramètres spécifiques à chaque plateforme
 */
export const buildPlatformSpecificParams = (
  platforms: string[],
  captions?: Record<string, string>
): Record<string, any> => {
  const params: Record<string, any> = {};

  platforms.forEach(platform => {
    if (captions && captions[platform]) {
      params[`${platform}_title`] = captions[platform];
    }
  });

  return params;
};
