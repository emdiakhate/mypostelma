/**
 * Post Comments Modal
 *
 * Displays comments on user's post with sentiment analysis
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, ThumbsUp, SmilePlus, Meh, Frown, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  author_username: string;
  author_is_verified: boolean;
  comment_text: string;
  comment_likes: number;
  posted_at: string;
  sentiment_score: number;
  sentiment_label: string | null;
  sentiment_explanation: string | null;
  keywords: string[] | null;
}

interface PostCommentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postCaption: string;
}

export function PostCommentsModal({
  open,
  onOpenChange,
  postId,
  postCaption,
}: PostCommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && postId) {
      loadComments();
    }
  }, [open, postId]);

  async function loadComments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('sentiment_score', { ascending: false });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSentimentIcon(label: string) {
    switch (label) {
      case 'positive':
        return <SmilePlus className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <Frown className="h-4 w-4 text-red-600" />;
      case 'neutral':
      default:
        return <Meh className="h-4 w-4 text-yellow-600" />;
    }
  }

  function getSentimentBadge(label: string) {
    const configs = {
      positive: { className: 'bg-green-100 text-green-800', label: 'Positif' },
      neutral: { className: 'bg-yellow-100 text-yellow-800', label: 'Neutre' },
      negative: { className: 'bg-red-100 text-red-800', label: 'Négatif' },
    };

    const config = configs[label] || configs.neutral;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {getSentimentIcon(label)}
        {config.label}
      </Badge>
    );
  }

  const stats = {
    positive: comments.filter((c) => c.sentiment_label === 'positive').length,
    neutral: comments.filter((c) => c.sentiment_label === 'neutral').length,
    negative: comments.filter((c) => c.sentiment_label === 'negative').length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commentaires avec analyse de sentiment</DialogTitle>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {postCaption}
          </p>
        </DialogHeader>

        {/* Statistics */}
        {comments.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">
                {stats.positive}
              </div>
              <div className="text-xs text-green-600">Positifs</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {stats.neutral}
              </div>
              <div className="text-xs text-yellow-600">Neutres</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-700">
                {stats.negative}
              </div>
              <div className="text-xs text-red-600">Négatifs</div>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-16 w-full mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun commentaire analysé pour ce post</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      @{comment.author_username}
                    </span>
                    {comment.author_is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Vérifié
                      </Badge>
                    )}
                  </div>
                  {getSentimentBadge(comment.sentiment_label)}
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  {comment.comment_text}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {comment.comment_likes}
                    </span>
                    <span>
                      {format(new Date(comment.posted_at), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  {comment.keywords.length > 0 && (
                    <div className="flex gap-1">
                      {comment.keywords.slice(0, 3).map((keyword, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs py-0"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {comment.sentiment_explanation && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    "{comment.sentiment_explanation}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
