import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/Post';

export interface PostFilters {
  status?: string[];
  platforms?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  campaign?: string;
}

export interface PostSearchParams extends PostFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'scheduled_time' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export class PostsService {
  /**
   * Récupère tous les posts avec filtres optionnels
   */
  static async getPosts(params?: PostSearchParams): Promise<{ posts: Post[]; total: number }> {
    let query = supabase
      .from('posts')
      .select('*, post_analytics(*)', { count: 'exact' });

    // Filtres
    if (params?.status && params.status.length > 0) {
      query = query.in('status', params.status as any);
    }

    if (params?.platforms && params.platforms.length > 0) {
      query = query.overlaps('platforms', params.platforms);
    }

    if (params?.campaign) {
      query = query.eq('campaign', params.campaign);
    }

    if (params?.search) {
      query = query.ilike('content', `%${params.search}%`);
    }

    if (params?.dateRange) {
      query = query
        .gte('scheduled_time', params.dateRange.start.toISOString())
        .lte('scheduled_time', params.dateRange.end.toISOString());
    }

    // Tri
    const sortBy = params?.sortBy || 'scheduled_time';
    const sortOrder = params?.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    // Transformer les données pour le format Post
    const posts: Post[] = (data || []).map((post: any) => ({
      id: post.id,
      content: post.content,
      scheduledTime: new Date(post.scheduled_time),
      platforms: post.platforms as any,
      status: post.status,
      images: post.images || [],
      campaign: post.campaign,
      campaignColor: post.campaign_color,
      author: post.author_id,
      captions: (post.captions || {}) as any,
      dayColumn: post.day_column,
      timeSlot: post.time_slot,
      engagement: post.post_analytics?.[0] ? {
        likes: post.post_analytics[0].likes || 0,
        comments: post.post_analytics[0].comments || 0,
        shares: post.post_analytics[0].shares || 0,
        views: post.post_analytics[0].views || 0,
      } : undefined,
    }));

    return {
      posts,
      total: count || 0,
    };
  }

  /**
   * Récupère un post par ID
   */
  static async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_analytics(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      content: data.content,
      scheduledTime: new Date(data.scheduled_time),
      platforms: data.platforms as any,
      status: data.status,
      images: data.images || [],
      campaign: data.campaign,
      campaignColor: data.campaign_color,
      author: data.author_id,
      captions: (data.captions || {}) as any,
      dayColumn: data.day_column,
      timeSlot: data.time_slot,
      engagement: data.post_analytics?.[0] ? {
        likes: data.post_analytics[0].likes || 0,
        comments: data.post_analytics[0].comments || 0,
        shares: data.post_analytics[0].shares || 0,
        views: data.post_analytics[0].views || 0,
      } : undefined,
    };
  }

  /**
   * Crée un nouveau post
   */
  static async createPost(post: Partial<Post>, authorId: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: post.content,
        scheduled_time: post.scheduledTime?.toISOString(),
        platforms: post.platforms || [],
        accounts: [], // À remplir avec les comptes sélectionnés
        status: post.status || 'draft',
        images: post.images || [],
        campaign: post.campaign,
        campaign_color: post.campaignColor,
        author_id: authorId,
        captions: post.captions || {},
        day_column: post.dayColumn,
        time_slot: post.timeSlot,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    return {
      id: data.id,
      content: data.content,
      scheduledTime: new Date(data.scheduled_time),
      platforms: data.platforms as any,
      status: data.status,
      images: data.images || [],
      campaign: data.campaign,
      campaignColor: data.campaign_color,
      author: data.author_id,
      captions: (data.captions || {}) as any,
      dayColumn: data.day_column,
      timeSlot: data.time_slot,
    };
  }

  /**
   * Met à jour un post
   */
  static async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const updateData: any = {};

    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.scheduledTime !== undefined) updateData.scheduled_time = updates.scheduledTime.toISOString();
    if (updates.platforms !== undefined) updateData.platforms = updates.platforms;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.campaign !== undefined) updateData.campaign = updates.campaign;
    if (updates.campaignColor !== undefined) updateData.campaign_color = updates.campaignColor;
    if (updates.captions !== undefined) updateData.captions = updates.captions;
    if (updates.dayColumn !== undefined) updateData.day_column = updates.dayColumn;
    if (updates.timeSlot !== undefined) updateData.time_slot = updates.timeSlot;

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }

    return {
      id: data.id,
      content: data.content,
      scheduledTime: new Date(data.scheduled_time),
      platforms: data.platforms as any,
      status: data.status,
      images: data.images || [],
      campaign: data.campaign,
      campaignColor: data.campaign_color,
      author: data.author_id,
      captions: (data.captions || {}) as any,
      dayColumn: data.day_column,
      timeSlot: data.time_slot,
    };
  }

  /**
   * Supprime un post
   */
  static async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Publie un post immédiatement
   */
  static async publishPost(id: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error publishing post:', error);
      throw error;
    }

    return {
      id: data.id,
      content: data.content,
      scheduledTime: new Date(data.scheduled_time),
      platforms: data.platforms as any,
      status: data.status,
      images: data.images || [],
      campaign: data.campaign,
      campaignColor: data.campaign_color,
      author: data.author_id,
      captions: (data.captions || {}) as any,
      dayColumn: data.day_column,
      timeSlot: data.time_slot,
    };
  }
}
