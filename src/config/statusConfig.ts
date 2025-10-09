/**
 * Configuration centralisée des statuts de posts
 * Évite la duplication de code
 */

import { PostStatus } from '@/types/Post';
import { CheckCircle, Clock, AlertCircle, XCircle, Pause } from 'lucide-react';

export interface StatusConfig {
  id: PostStatus;
  label: string;
  labelFr: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
  icon: typeof CheckCircle;
}

/**
 * Configuration des statuts de posts
 * Utilise le design system pour les couleurs
 */
export const POST_STATUSES: StatusConfig[] = [
  {
    id: 'published',
    label: 'Published',
    labelFr: 'Publié',
    colorClass: 'text-status-published',
    bgClass: 'bg-status-published/10',
    textClass: 'text-status-published',
    icon: CheckCircle
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    labelFr: 'Programmé',
    colorClass: 'text-status-scheduled',
    bgClass: 'bg-status-scheduled/10',
    textClass: 'text-status-scheduled',
    icon: Clock
  },
  {
    id: 'pending',
    label: 'Pending',
    labelFr: 'En attente',
    colorClass: 'text-status-pending',
    bgClass: 'bg-status-pending/10',
    textClass: 'text-status-pending',
    icon: AlertCircle
  },
  {
    id: 'draft',
    label: 'Draft',
    labelFr: 'Brouillon',
    colorClass: 'text-status-draft',
    bgClass: 'bg-status-draft/10',
    textClass: 'text-status-draft',
    icon: Pause
  },
  {
    id: 'failed',
    label: 'Failed',
    labelFr: 'Échec',
    colorClass: 'text-status-failed',
    bgClass: 'bg-status-failed/10',
    textClass: 'text-status-failed',
    icon: XCircle
  }
];

/**
 * Récupère la configuration d'un statut
 */
export const getStatusConfig = (statusId: PostStatus): StatusConfig => {
  return POST_STATUSES.find(s => s.id === statusId) || POST_STATUSES[3]; // Default to draft
};

/**
 * Map des statuts par ID
 */
export const STATUS_MAP = POST_STATUSES.reduce((acc, status) => {
  acc[status.id] = status;
  return acc;
}, {} as Record<PostStatus, StatusConfig>);
