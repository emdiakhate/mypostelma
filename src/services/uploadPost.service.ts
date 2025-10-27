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
   * @param userId - ID de l'utilisateur (utilisé comme username)
   */
  static async createUserProfile(userId: string): Promise<CreateProfileResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-create-profile', {
        body: { username: userId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to create profile');

      return data;
    } catch (error) {
      console.error('Error creating Upload-Post profile:', error);
      throw error;
    }
  }

  /**
   * Génère une URL de connexion JWT pour connecter les réseaux sociaux
   * @param userId - ID de l'utilisateur
   * @param options - Options de personnalisation
   */
  static async generateConnectUrl(
    userId: string, 
    options?: ConnectUrlOptions
  ): Promise<GenerateJWTResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-generate-jwt', {
        body: {
          username: userId,
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
   * @param userId - ID de l'utilisateur
   */
  static async getUserProfile(userId: string): Promise<GetProfileResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-get-profile', {
        body: { username: userId }
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
   * @param userId - ID de l'utilisateur
   */
  static async getFacebookPages(userId: string): Promise<GetFacebookPagesResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-facebook-pages', {
        body: { profile: userId }
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
   * @param userId - ID de l'utilisateur
   */
  static async profileExists(userId: string): Promise<boolean> {
    try {
      await this.getUserProfile(userId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
