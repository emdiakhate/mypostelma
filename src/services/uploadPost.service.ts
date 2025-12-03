/**
 * Service pour l'intégration Upload-Post API
 * Toutes les requêtes passent par les Edge Functions Supabase pour sécuriser l'API Key
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CreateProfileResponse,
  GenerateJWTResponse,
  GetProfileResponse,
  GetFacebookPagesResponse,
  ConnectUrlOptions,
  SocialPlatform
} from '@/types/uploadPost.types';

export class UploadPostService {
  /**
   * Obtient le token d'authentification Supabase
   */
  private static async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    return session.access_token;
  }

  /**
   * Crée un profil Upload-Post pour l'utilisateur
   * @param username - Nom de l'utilisateur (utilisé comme username dans Upload-Post)
   */
  static async createUserProfile(username: string): Promise<CreateProfileResponse> {
    try {
      console.log(`[UploadPostService] Creating profile for username: ${username}`);
      
      // S'assurer que la session est active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const { data, error } = await supabase.functions.invoke('upload-post-create-profile', {
        body: { username },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('[UploadPostService] Create profile response:', { data, error });

      if (error) {
        console.error('[UploadPostService] Supabase function error:', error);
        const errorMsg = error.message || 'Failed to create profile';
        throw new Error(errorMsg);
      }
      
      if (!data?.success) {
        const errorMsg = data?.error || data?.message || 'Failed to create profile';
        console.error('[UploadPostService] API returned error:', errorMsg);
        
        // Check if it's a quota/limit error
        if (errorMsg.includes('limit') || errorMsg.includes('quota') || data?.statusCode === 403) {
          throw new Error(`QUOTA_EXCEEDED: ${errorMsg}`);
        }
        
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      console.error('[UploadPostService] Error creating Upload-Post profile:', error);
      throw error;
    }
  }

  /**
   * Génère une URL de connexion JWT pour connecter les réseaux sociaux
   * @param username - Nom de l'utilisateur
   * @param options - Options de personnalisation
   */
  static async generateConnectUrl(
    username: string, 
    options?: ConnectUrlOptions
  ): Promise<GenerateJWTResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-generate-jwt', {
        body: {
          username,
          redirect_url: options?.redirectUrl,
          logo_image: options?.logoImage,
          connect_title: options?.connectTitle,
          connect_description: options?.connectDescription,
          platforms: options?.platforms,
          redirect_button_text: options?.redirectButtonText
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate connect URL');

      return data;
    } catch (error) {
      console.error('Error generating Upload-Post connect URL:', error);
      throw error;
    }
  }

  /**
   * Récupère le profil utilisateur avec les comptes connectés
   * @param username - Nom de l'utilisateur
   */
  static async getUserProfile(username: string): Promise<GetProfileResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-get-profile', {
        body: { username }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to get profile');

      return data;
    } catch (error) {
      console.error('Error getting Upload-Post profile:', error);
      throw error;
    }
  }

  /**
   * Récupère les pages Facebook de l'utilisateur
   * @param username - Nom de l'utilisateur
   */
  static async getFacebookPages(username: string): Promise<GetFacebookPagesResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-facebook-pages', {
        body: { profile: username }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to get Facebook pages');

      return data;
    } catch (error) {
      console.error('Error getting Upload-Post Facebook pages:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un profil existe pour l'utilisateur
   * @param username - Nom de l'utilisateur
   */
  static async profileExists(username: string): Promise<boolean> {
    try {
      await this.getUserProfile(username);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Configure l'URL du webhook pour recevoir les notifications Upload-Post
   * Cette fonction doit être appelée une fois lors de la première utilisation
   */
  static async configureWebhook(): Promise<{ success: boolean; webhook_url?: string; error?: string }> {
    try {
      console.log('[UploadPostService] Configuring webhook');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('upload-post-configure-webhook', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('[UploadPostService] Configure webhook response:', { data, error });

      if (error) {
        console.error('[UploadPostService] Webhook configuration error:', error);
        throw new Error(error.message || 'Failed to configure webhook');
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Failed to configure webhook';
        console.error('[UploadPostService] Webhook config API error:', errorMsg);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      console.error('[UploadPostService] Error configuring webhook:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des publications depuis Upload Post API
   * @param username - Nom de l'utilisateur
   * @param options - Options de pagination et filtrage
   */
  static async getUploadHistory(
    username: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[UploadPostService] Getting upload history', { username, options });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('upload-post-get-history', {
        body: {
          profile_username: username,
          limit: options?.limit || 50,
          offset: options?.offset || 0,
          status: options?.status
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('[UploadPostService] Get history response:', { data, error });

      if (error) {
        console.error('[UploadPostService] Get history error:', error);
        throw new Error(error.message || 'Failed to get upload history');
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Failed to get upload history';
        console.error('[UploadPostService] Get history API error:', errorMsg);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      console.error('[UploadPostService] Error getting upload history:', error);
      throw error;
    }
  }
}
