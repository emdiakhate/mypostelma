import React, { useState, memo, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { Post } from '@/types/Post';
import PostCard from './PostCard';
import PostCreationModal from './PostCreationModal';
import PostPreviewModal from './PostPreviewModal';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  posts: Post[];
  currentDate: Date;
  onPostsChange: (posts: Post[]) => void;
  onCreatePost: (post: Partial<Post>) => Promise<Post | undefined>;
  onUpdatePost: (id: string, updates: Partial<Post>) => Promise<Post | undefined>;
  onDeletePost: (id: string) => Promise<void>;
  onDateChange: (date: Date) => void;
}

// Styles CSS pour les effets de drag and drop
const dragDropStyles = `
  /* Post en cours de drag */
  .dragging-post {
    opacity: 0.5 !important;
    cursor: grabbing !important;
    transform: rotate(2deg) scale(1.02) !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25) !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    z-index: 1000 !important;
    border: 2px dashed #3b82f6 !important;
  }

  /* Zone de drop active */
  .drop-zone-active {
    border: 2px dashed #3b82f6;
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 8px;
    min-height: 150px;
    transition: all 0.2s ease;
  }

  /* Indicateur de drop */
  .drop-indicator {
    border: 2px dashed #3b82f6;
    background: linear-gradient(to bottom, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    color: #3b82f6;
    font-size: 14px;
    font-weight: 500;
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  /* Post au survol d'une zone de drop */
  .drag-over {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
  }

  /* Animation de pulsation pour la zone de drop */
  .drop-zone-pulse {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  currentDate,
  onPostsChange,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
  onDateChange,
}) => {
  // Hooks React Router
  const navigate = useNavigate();
  
  const [draggedPost, setDraggedPost] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // États pour le drag and drop HTML5
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDayForPost, setSelectedDayForPost] = useState<string>('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [previewingPost, setPreviewingPost] = useState<Post | null>(null);

  // Debug: Vérifier les posts
  console.log('CalendarView - Posts loaded:', posts.length, 'posts');
  console.log('CalendarView - First post:', posts[0]);

  // Calculs optimisés avec useMemo pour éviter les recalculs inutiles
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const dayName = format(date, 'EEEE', { locale: fr });
    const dayNumber = format(date, 'd');
    const dayKey = format(date, 'EEEE', { locale: fr }).toLowerCase();
    
    return {
      key: dayKey,
      name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      number: dayNumber,
      date,
    };
  }), [weekStart]);

  const postsByDay = useMemo(() => {
    const grouped: Record<string, Post[]> = {};
    weekDays.forEach(day => {
      grouped[day.key] = posts.filter(post => {
        const postDate = new Date(post.scheduledTime);
        return postDate.toDateString() === day.date.toDateString();
      });
    });
    return grouped;
  }, [posts, weekDays]);

  // Callbacks optimisés avec useCallback
  const handleDragStart = useCallback((result: any) => {
    console.log('Drag started:', result);
    setDraggedPost(result.draggableId);
  }, []);

  // Fonctions pour le drag and drop HTML5
  const handleHtml5DragStart = useCallback((e: React.DragEvent, postId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('postId', postId);
    setDraggedPostId(postId);
    setIsDragging(true);
    e.currentTarget.classList.add('dragging-post');
  }, []);

  const handleHtml5DragEnd = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging-post');
    setDraggedPostId(null);
    setIsDragging(false);
    setDragOverDay(null);
  }, []);

  const handleHtml5DragOver = useCallback((e: React.DragEvent, dayKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(dayKey);
  }, []);

  const handleHtml5DragLeave = useCallback((e: React.DragEvent) => {
    // Vérifier si on quitte vraiment la zone de drop
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDay(null);
    }
  }, []);

  const handleHtml5Drop = useCallback(async (e: React.DragEvent, targetDayKey: string) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('postId');
    
    if (!postId || !draggedPostId) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const dayIndex = weekDays.findIndex(day => day.key === targetDayKey);
    if (dayIndex === -1) return;

    const targetDate = weekDays[dayIndex].date;
    const newScheduledTime = new Date(post.scheduledTime);
    newScheduledTime.setDate(targetDate.getDate());
    newScheduledTime.setMonth(targetDate.getMonth());
    newScheduledTime.setFullYear(targetDate.getFullYear());

    try {
      await onUpdatePost(post.id, { 
        scheduledTime: newScheduledTime
      });
      console.log('Post déplacé avec succès');
    } catch (error) {
      console.error('Erreur lors du déplacement du post:', error);
    }

    setDragOverDay(null);
  }, [posts, weekDays, onUpdatePost, draggedPostId]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    console.log('Drag ended:', result);
    setDraggedPost(null);

    if (!result.destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    const { source, destination, draggableId } = result;
    console.log('Source:', source, 'Destination:', destination, 'DraggableId:', draggableId);

    if (source.droppableId === destination.droppableId) {
      console.log('Same droppable, no change needed');
      return;
    }
    
    const post = posts.find(p => p.id === draggableId);
    if (!post) return;
    
    const newScheduledTime = new Date(post.scheduledTime);
    const dayIndex = weekDays.findIndex(day => day.key === destination.droppableId);
    if (dayIndex === -1) return;
    
    const targetDate = weekDays[dayIndex].date;
    newScheduledTime.setDate(targetDate.getDate());
    newScheduledTime.setMonth(targetDate.getMonth());
    newScheduledTime.setFullYear(targetDate.getFullYear());
    
    try {
      // Mettre à jour dans la base de données
      const updatedPost = await onUpdatePost(post.id, { 
        scheduledTime: newScheduledTime
      });
      
      if (updatedPost) {
        // Mettre à jour l'état local
        const newPosts = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
        onPostsChange(newPosts);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du post:', error);
      // Optionnel : afficher une notification d'erreur à l'utilisateur
    }
  }, [posts, onPostsChange, weekDays, onUpdatePost]);

  const handleCreatePost = useCallback((dayColumn?: string) => {
    if (dayColumn) {
      setSelectedDayForPost(dayColumn);
    }
    setShowCreateModal(true);
  }, []);

  const handleSavePost = useCallback(async (postData: Partial<Post>) => {
    try {
      await onCreatePost({
        ...postData,
        dayColumn: postData.dayColumn || selectedDayForPost || 'lundi',
        timeSlot: postData.timeSlot || 9,
      });
      setShowCreateModal(false);
      setSelectedDayForPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }, [onCreatePost, selectedDayForPost]);

  const handlePostClick = useCallback((post: Post) => {
    setPreviewingPost(post);
  }, []);

  const handleUpdatePost = useCallback(async (updatedPost: Post) => {
    try {
      await onUpdatePost(updatedPost.id, updatedPost);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  }, [onUpdatePost]);

  const handlePreview = useCallback((post: Post) => {
    setPreviewingPost(post);
  }, []);

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);

  const handleDuplicate = useCallback(async (post: Post) => {
    try {
      await onCreatePost({
        ...post,
        status: 'draft' as const,
      });
    } catch (error) {
      console.error('Error duplicating post:', error);
    }
  }, [onCreatePost]);

  const handleDelete = useCallback(async (post: Post) => {
    try {
      await onDeletePost(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }, [onDeletePost]);

  const handlePreviousWeek = useCallback(() => {
    onDateChange(addWeeks(currentDate, -1));
  }, [currentDate, onDateChange]);

  const handleNextWeek = useCallback(() => {
    onDateChange(addWeeks(currentDate, 1));
  }, [currentDate, onDateChange]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Injection des styles CSS pour le drag and drop */}
      <style dangerouslySetInnerHTML={{ __html: dragDropStyles }} />
      
      {/* Header du calendrier */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-semibold whitespace-nowrap">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h1>
              <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button variant="ghost" size="sm" className="text-xs">Semaine</Button>
              <Button variant="ghost" size="sm" className="text-xs">Mois</Button>
              <Button variant="ghost" size="sm" className="text-xs">Liste</Button>
            </div>
            
            <Button 
              onClick={() => handleCreatePost()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Créer un post
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu du calendrier */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#f5f5f5' }}>
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-px" style={{ backgroundColor: '#e5e5e5' }}>
            {weekDays.map((day) => (
              <div 
                key={day.key} 
                className={cn(
                  "flex flex-col transition-all duration-200",
                  dragOverDay === day.key && "drop-zone-active drop-zone-pulse"
                )}
                style={{ backgroundColor: '#fafafa' }}
                onDragOver={(e) => handleHtml5DragOver(e, day.key)}
                onDragLeave={handleHtml5DragLeave}
                onDrop={(e) => handleHtml5Drop(e, day.key)}
              >
                {/* Day Header */}
                <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between group">
                    <div>
                      <h3 className="font-medium text-xs text-gray-700">
                        {day.name} {day.number}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreatePost(day.key)}
                      className="h-5 w-5 p-0 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Posts Column */}
                <Droppable droppableId={day.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "p-2 space-y-2 min-h-[100px] transition-colors duration-200",
                        snapshot.isDraggingOver && "bg-blue-50 ring-2 ring-blue-300 ring-inset"
                      )}
                    >
                      {/* Indicateur de drop HTML5 */}
                      {isDragging && dragOverDay === day.key && (
                        <div className="drop-indicator">
                          <Clock className="w-4 h-4" />
                          <span>Garder l'heure programmée</span>
                        </div>
                      )}
                      
                      {postsByDay[day.key]?.map((post, index) => {
                        console.log('Rendering post:', post.id, 'for day:', day.key);
                        if (!post.id) {
                          console.error('Post without ID:', post);
                          return null;
                        }
                        return (
                        <Draggable key={post.id} draggableId={String(post.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "transition-all duration-200",
                                snapshot.isDragging && "rotate-3 scale-105 opacity-80 shadow-lg"
                              )}
                              // Support HTML5 drag and drop
                              draggable
                              onDragStart={(e) => handleHtml5DragStart(e, String(post.id))}
                              onDragEnd={handleHtml5DragEnd}
                            >
                              <PostCard
                                post={post}
                                isDragging={snapshot.isDragging}
                                onPreview={handlePreview}
                                onEdit={handleEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                              />
                            </div>
                          )}
                        </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <PostCreationModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDayForPost('');
          }}
          onSave={handleSavePost}
          initialData={{
            scheduledTime: selectedDayForPost ? 
              weekDays.find(d => d.key === selectedDayForPost)?.date : 
              new Date()
          }}
        />
      )}

      {editingPost && (
        <PostCreationModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleUpdatePost}
          initialData={editingPost}
          isEditing={true}
        />
      )}

      {previewingPost && (
        <PostPreviewModal
          isOpen={!!previewingPost}
          onClose={() => setPreviewingPost(null)}
          post={{
            ...previewingPost,
            createdAt: new Date().toISOString(),
            platforms: previewingPost.platforms,
            status: (previewingPost.status === 'pending' ? 'scheduled' : previewingPost.status) || 'draft'
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;