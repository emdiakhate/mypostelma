/**
 * Configuration des plateformes pour l'Inbox - Noms français et icônes
 */

import { Mail, Send, MessageCircle, Facebook, Instagram, Twitter, Linkedin, Music2, LucideIcon } from 'lucide-react';
import type { Platform } from '@/types/inbox';

export const PLATFORM_LABELS: Record<Platform, string> = {
  gmail: 'Email Gmail',
  outlook: 'Email Outlook',
  telegram: 'Telegram',
  whatsapp_twilio: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
};

export const PLATFORM_ICON_COMPONENTS: Record<Platform, LucideIcon> = {
  gmail: Mail,
  outlook: Mail,
  telegram: Send,
  whatsapp_twilio: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Music2,
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  gmail: 'bg-red-500',
  outlook: 'bg-blue-500',
  telegram: 'bg-sky-500',
  whatsapp_twilio: 'bg-green-500',
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  twitter: 'bg-black',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
};
