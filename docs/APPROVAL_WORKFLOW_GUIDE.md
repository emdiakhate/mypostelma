# Guide d'Implémentation Workflow d'Approbation

## Vue d'ensemble

Le workflow d'approbation permet à une équipe de collaborer sur la création de contenu avec validation avant publication.

**Use cases** :
- Agences : Créateurs → Client approuve → Publication
- Entreprises : Community Manager → Marketing Manager → Publication
- Sécurité : Éviter les erreurs coûteuses

---

## Architecture

```
Créateur → Crée post (status: draft)
        ↓
Créateur → Soumet pour approbation (status: pending_approval)
        ↓
Reviewer → Reçoit notification
        ↓
Reviewer → Approuve (status: approved) OU Rejette (status: rejected)
        ↓
        → Si approuvé: Auto-schedule OU Créateur publie
        → Si rejeté: Retour Créateur avec commentaires
```

---

## Rôles et Permissions

### 3 Rôles Principaux

```typescript
type Role = 'creator' | 'reviewer' | 'admin';

interface RolePermissions {
  canCreatePosts: boolean;
  canSubmitForApproval: boolean;
  canApproveReject: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  creator: {
    canCreatePosts: true,
    canSubmitForApproval: true,
    canApproveReject: false,
    canPublish: false, // Seulement après approbation
    canDelete: false,
    canManageUsers: false,
  },
  reviewer: {
    canCreatePosts: true,
    canSubmitForApproval: false, // Peut créer mais pas soumettre (conflit d'intérêt)
    canApproveReject: true,
    canPublish: true,
    canDelete: true,
    canManageUsers: false,
  },
  admin: {
    canCreatePosts: true,
    canSubmitForApproval: true,
    canApproveReject: true,
    canPublish: true,
    canDelete: true,
    canManageUsers: true,
  },
};
```

---

## Structure Base de Données

```sql
-- Étendre la table posts avec champs approval
ALTER TABLE posts
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft',
-- 'draft', 'pending_approval', 'approved', 'rejected', 'published'
ADD COLUMN submitted_for_approval_at TIMESTAMPTZ,
ADD COLUMN submitted_by UUID REFERENCES auth.users(id),
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN reviewed_at TIMESTAMPTZ,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN requires_approval BOOLEAN DEFAULT false; -- Si workflow activé pour ce post

-- Table pour les commentaires sur les posts (feedback)
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general', -- 'general', 'revision_request', 'approval'

    -- Si révision demandée
    is_resolved BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les révisions de post (historique des modifications)
CREATE TABLE post_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Snapshot du contenu à ce moment
    content_snapshot JSONB NOT NULL,

    -- Métadonnées
    revision_number INTEGER NOT NULL,
    change_description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les user roles (simple)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID, -- Pour multi-client (agences)

    role VARCHAR(20) NOT NULL, -- 'creator', 'reviewer', 'admin'

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view comments on accessible posts"
    ON post_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on accessible posts"
    ON post_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Similar policies for post_revisions and user_roles...

-- Indexes
CREATE INDEX idx_posts_approval_status ON posts(approval_status);
CREATE INDEX idx_posts_submitted_by ON posts(submitted_by);
CREATE INDEX idx_posts_reviewed_by ON posts(reviewed_by);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_revisions_post_id ON post_revisions(post_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Trigger pour créer une révision à chaque modification
CREATE OR REPLACE FUNCTION create_post_revision()
RETURNS TRIGGER AS $$
DECLARE
    revision_num INTEGER;
BEGIN
    -- Get next revision number
    SELECT COALESCE(MAX(revision_number), 0) + 1 INTO revision_num
    FROM post_revisions
    WHERE post_id = NEW.id;

    -- Create revision
    INSERT INTO post_revisions (
        post_id,
        user_id,
        content_snapshot,
        revision_number,
        change_description
    ) VALUES (
        NEW.id,
        auth.uid(),
        jsonb_build_object(
            'content', NEW.content,
            'medias', NEW.medias,
            'scheduled_date', NEW.scheduled_date
        ),
        revision_num,
        CASE
            WHEN OLD IS NULL THEN 'Création initiale'
            WHEN NEW.approval_status != OLD.approval_status THEN 'Changement de statut: ' || OLD.approval_status || ' → ' || NEW.approval_status
            ELSE 'Modification du contenu'
        END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_post_revisions
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION create_post_revision();

-- Function pour vérifier les permissions
CREATE OR REPLACE FUNCTION user_has_permission(
    user_id_param UUID,
    permission VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = user_id_param
    LIMIT 1;

    -- Check permission based on role
    RETURN CASE
        WHEN user_role = 'admin' THEN true
        WHEN user_role = 'reviewer' AND permission IN ('approve_reject', 'publish', 'delete') THEN true
        WHEN user_role = 'creator' AND permission IN ('create', 'submit_approval') THEN true
        ELSE false
    END;
END;
$$ LANGUAGE plpgsql;
```

---

## Types TypeScript

```typescript
// src/types/approval.ts

export type ApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'published';

export type Role = 'creator' | 'reviewer' | 'admin';

export type CommentType = 'general' | 'revision_request' | 'approval';

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  comment_type: CommentType;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;

  // Populated
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface PostRevision {
  id: string;
  post_id: string;
  user_id: string;
  content_snapshot: any; // JSONB
  revision_number: number;
  change_description?: string;
  created_at: string;

  // Populated
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface UserRole {
  id: string;
  user_id: string;
  workspace_id?: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface RolePermissions {
  canCreatePosts: boolean;
  canSubmitForApproval: boolean;
  canApproveReject: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

// Extension du type Post existant
export interface PostWithApproval extends Post {
  approval_status: ApprovalStatus;
  submitted_for_approval_at?: string;
  submitted_by?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  requires_approval: boolean;

  // Populated
  comments?: PostComment[];
  revisions?: PostRevision[];
}
```

---

## Service Approval

```typescript
// src/services/approval.ts

import { supabase } from '@/integrations/supabase/client';
import type {
  PostWithApproval,
  PostComment,
  PostRevision,
  ApprovalStatus,
  Role,
} from '@/types/approval';

/**
 * Get user's role
 */
export const getUserRole = async (): Promise<Role | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return data?.role || null;
};

/**
 * Check if user has permission
 */
export const userHasPermission = async (permission: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.rpc('user_has_permission', {
    user_id_param: user.id,
    permission,
  });

  return data || false;
};

/**
 * Submit post for approval
 */
export const submitForApproval = async (postId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('posts')
    .update({
      approval_status: 'pending_approval',
      submitted_for_approval_at: new Date().toISOString(),
      submitted_by: user?.id,
    })
    .eq('id', postId);

  if (error) throw error;

  // Send notification to reviewers
  await notifyReviewers(postId);
};

/**
 * Approve post
 */
export const approvePost = async (postId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('posts')
    .update({
      approval_status: 'approved',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', postId);

  if (error) throw error;

  // Send notification to creator
  await notifyCreator(postId, 'approved');
};

/**
 * Reject post
 */
export const rejectPost = async (
  postId: string,
  rejectionReason: string
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('posts')
    .update({
      approval_status: 'rejected',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq('id', postId);

  if (error) throw error;

  // Send notification to creator
  await notifyCreator(postId, 'rejected');
};

/**
 * Get posts pending approval
 */
export const getPendingApprovalPosts = async (): Promise<PostWithApproval[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      comments:post_comments(*),
      revisions:post_revisions(*)
    `)
    .eq('approval_status', 'pending_approval')
    .order('submitted_for_approval_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Add comment to post
 */
export const addPostComment = async (
  postId: string,
  commentText: string,
  commentType: CommentType = 'general'
): Promise<PostComment> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: user?.id,
      comment_text: commentText,
      comment_type: commentType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get post comments
 */
export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get post revisions (history)
 */
export const getPostRevisions = async (postId: string): Promise<PostRevision[]> => {
  const { data, error } = await supabase
    .from('post_revisions')
    .select('*')
    .eq('post_id', postId)
    .order('revision_number', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Notify reviewers (send notification or email)
 */
async function notifyReviewers(postId: string): Promise<void> => {
  // Get all reviewers
  const { data: reviewers } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['reviewer', 'admin']);

  if (!reviewers) return;

  // Create notifications (you need a notifications table)
  // Or send emails via Edge Function
  // Or send push notifications

  console.log('Notifying reviewers for post:', postId);
}

/**
 * Notify creator
 */
async function notifyCreator(postId: string, action: 'approved' | 'rejected'): Promise<void> => {
  // Get post creator
  const { data: post } = await supabase
    .from('posts')
    .select('user_id, submitted_by')
    .eq('id', postId)
    .single();

  if (!post) return;

  // Send notification
  console.log(`Notifying creator: Post ${action}`);
}
```

---

## UI Components

### 1. Approval Queue (Pour Reviewers)

```tsx
// src/pages/ApprovalQueuePage.tsx

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MessageSquare, History } from 'lucide-react';
import { getPendingApprovalPosts, approvePost, rejectPost } from '@/services/approval';

export default function ApprovalQueuePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingPosts();
  }, []);

  const loadPendingPosts = async () => {
    try {
      const data = await getPendingApprovalPosts();
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    await approvePost(postId);
    loadPendingPosts();
  };

  const handleReject = async (postId: string) => {
    const reason = prompt('Raison du rejet:');
    if (reason) {
      await rejectPost(postId, reason);
      loadPendingPosts();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Posts en attente d'approbation</h1>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{post.platform}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Soumis il y a {/* time ago */}
                  </span>
                </div>

                <p className="mb-4">{post.content}</p>

                {post.medias && post.medias.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {post.medias.map((media, idx) => (
                      <img
                        key={idx}
                        src={media.url}
                        alt=""
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* Open comments modal */}}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Commenter ({post.comments?.length || 0})
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* Open history modal */}}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Historique
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleApprove(post.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(post.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 2. Post Creation avec Workflow

```tsx
// Modifier CreationPage.tsx pour ajouter le bouton "Soumettre pour approbation"

<Button
  onClick={() => submitForApproval(post.id)}
  variant="outline"
>
  Soumettre pour approbation
</Button>
```

---

## Notifications

### Options

1. **In-app notifications** (table `notifications`)
2. **Email notifications** (via Resend/SendGrid)
3. **Push notifications** (via Firebase)
4. **Slack/Discord webhook** (pour agences)

---

## Flow Complet Exemple

```
1. Marie (Creator) crée un post
   → Status: draft

2. Marie soumet pour approbation
   → Status: pending_approval
   → Notification envoyée à Jean (Reviewer)

3. Jean reçoit notification
   → Ouvre Approval Queue
   → Voit le post de Marie

4. Jean laisse un commentaire: "Change la couleur du logo SVP"
   → Notification à Marie

5. Marie modifie le post
   → Révision créée automatiquement

6. Jean revoit et approuve
   → Status: approved
   → Notification à Marie

7. Marie (ou auto) publie le post
   → Status: published
   → Post apparaît sur les réseaux sociaux
```

---

## Configuration Workspace

Pour activer le workflow d'approbation :

```typescript
interface WorkspaceSettings {
  approval_workflow_enabled: boolean;
  require_approval_for_all_posts: boolean; // Ou seulement certains
  auto_publish_on_approval: boolean; // Publier automatiquement si approuvé
  min_reviewers_required: number; // Nombre de reviewers nécessaires
}
```

---

## Résumé

Le workflow d'approbation nécessite :
1. ✅ Extension table posts avec champs approval
2. ✅ Tables post_comments et post_revisions
3. ✅ Table user_roles
4. ✅ Service approval avec fonctions
5. ✅ UI Approval Queue pour reviewers
6. ✅ Notifications (email ou in-app)
7. ✅ Permissions granulaires

**Temps d'implémentation estimé** : 2-3 semaines
