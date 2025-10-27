/**
 * Types pour l'intégration Upload-Post API
 */

export interface SocialAccountDetails {
  username?: string;
  display_name?: string;
  social_images?: string;
}

export interface UploadPostProfile {
  username: string;
  created_at: string;
  social_accounts: {
    [platform: string]: SocialAccountDetails | null | string;
  };
}

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'threads';

export interface ConnectedAccount {
  platform: SocialPlatform;
  display_name: string;
  social_images?: string;
  username?: string;
}

export interface FacebookPage {
  page_id: string;
  page_name: string;
  profile: string;
}

export interface CreateProfileResponse {
  success: boolean;
  profile: UploadPostProfile;
}

export interface GenerateJWTResponse {
  success: boolean;
  access_url: string;
  duration: string;
}

export interface GetProfileResponse {
  success: boolean;
  profile: UploadPostProfile;
}

export interface GetFacebookPagesResponse {
  success: boolean;
  pages: FacebookPage[];
}

export interface ConnectUrlOptions {
  redirectUrl?: string;
  logoImage?: string;
  connectTitle?: string;
  connectDescription?: string;
  platforms?: SocialPlatform[];
  redirectButtonText?: string;
}
