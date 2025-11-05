import React, { useState, memo, useCallback, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { Post } from '@/types/Post';
import PostCard from './PostCard';
import PostCreationModal from './PostCreationModal';
import PostPreviewModal from './PostPreviewModal';
import { EmptyCalendarState } from './calendar/EmptyCalendarState';
import { useUploadPost } from '@/hooks/useUploadPost';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, isToday, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CalendarViewProps {
  posts: Post[];
  currentDate: Date;
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
    z-index: 1000 !important;
  }

  /* Zone de drop active */
  .drop-zone-active {
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 8px;
    min-height: 150px;
  }
`;

// Helper pour vérifier si une date est passée
const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate < today;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  currentDate,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
  onDateChange,
}) => {
  // Hooks React Router
  const navigate = useNavigate();
  
  // Hook pour vérifier les comptes connectés
  const { connectedAccounts } = useUploadPost();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Créer une clé stable pour les posts basée sur leur contenu
  const postsKey = useMemo(() => {
    return posts.map(p => `${p.id}-${p.scheduledTime}`).join('|');
  }, [posts]);

  const postsByDay = useMemo(() => {
    const grouped: Record<string, Post[]> = {};
    weekDays.forEach(day => {
      grouped[day.key] = posts.filter(post => {
        const postDate = new Date(post.scheduledTime);
        return postDate.toDateString() === day.date.toDateString();
      });
    });
    return grouped;
  }, [postsKey, weekDays]);

  // Callbacks optimisés avec useCallback

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;
    
    const post = posts.find(p => p.id === draggableId);
    if (!post) return;

    // Interdire le drag & drop des posts publiés
    if (post.status === 'published') {
      toast.error("Impossible de déplacer un post déjà publié");
      return;
    }
    
    const dayIndex = weekDays.findIndex(day => day.key === destination.droppableId);
    if (dayIndex === -1) return;
    
    const targetDate = weekDays[dayIndex].date;

    // Interdire le déplacement vers une date passée
    if (isPastDate(targetDate)) {
      toast.error("⚠️ Vous ne pouvez pas programmer un post à une date passée");
      return;
    }
    
    const newScheduledTime = new Date(post.scheduledTime);
    newScheduledTime.setDate(targetDate.getDate());
    newScheduledTime.setMonth(targetDate.getMonth());
    newScheduledTime.setFullYear(targetDate.getFullYear());
    
    onUpdatePost(post.id, { scheduledTime: newScheduledTime });
    toast.success(`Post reprogrammé pour le ${format(targetDate, 'dd MMMM yyyy', { locale: fr })}`);
  }, [posts, weekDays, onUpdatePost]);

  const handleCreatePost = useCallback((dayColumn?: string, date?: Date) => {
    // Vérifier si la date est passée
    if (date && isPastDate(date)) {
      toast.error("💡 Sélectionnez une date future pour programmer ce post");
      return;
    }
    
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

  const handleTodayClick = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  return (
    <div className="flex flex-col h-screen">
      {/* Injection des styles CSS pour le drag and drop */}
      <style dangerouslySetInnerHTML={{ __html: dragDropStyles }} />
      
      {/* Header du calendrier - STICKY */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleTodayClick}>
                Aujourd'hui
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold whitespace-nowrap">
              Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
            </h1>
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

      {/* Jours de la semaine - STICKY */}
      <div className="sticky top-[73px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map((day) => {
            const isCurrentDay = isToday(day.date);
            const isPast = isPastDate(day.date);
            return (
              <div
                key={day.key}
                className={cn(
                  "p-3 text-center bg-white",
                  isCurrentDay && "bg-blue-50",
                  isPast && "bg-gray-50 opacity-60"
                )}
              >
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-xs font-medium uppercase",
                    isCurrentDay ? "text-blue-600" : "text-gray-600"
                  )}>
                    {day.name.substring(0, 3)}
                  </span>
                  <span className={cn(
                    "text-lg font-semibold mt-1",
                    isCurrentDay && "text-blue-600"
                  )}>
                    {day.number}
                  </span>
                  {isCurrentDay && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenu du calendrier - SCROLLABLE */}
      <div className="flex-1 bg-gray-100 p-1 overflow-y-auto relative">
        {/* Empty State - Affiché uniquement si aucun post */}
        {posts.length === 0 && (
          <EmptyCalendarState
            hasConnectedAccounts={connectedAccounts.length > 0}
            hasDrafts={false}
            onCreatePost={() => handleCreatePost()}
          />
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-1 h-full">
            {weekDays.map((day) => {
              const isCurrentDay = isToday(day.date);
              const isWeekendDay = isWeekend(day.date);
              const isPast = isPastDate(day.date);
              
              return (
              <div 
                key={day.key} 
                className={cn(
                  "flex flex-col bg-white rounded-sm border shadow-sm overflow-hidden transition-all min-h-[500px]",
                  isCurrentDay && "border-blue-400 border-2 shadow-md",
                  isWeekendDay && !isCurrentDay && "bg-gray-50",
                  isPast && "opacity-60 cursor-not-allowed",
                  !isPast && "hover:shadow-lg cursor-pointer"
                )}
                onClick={(e) => {
                  // Interdire la création sur dates passées
                  if (isPast) {
                    toast.error("💡 Sélectionnez une date future pour programmer ce post");
                    return;
                  }
                  // Créer un post si on clique sur la cellule vide
                  if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('empty-cell-area')) {
                    handleCreatePost(day.key, day.date);
                  }
                }}
              >
                {/* Posts Column */}
                <Droppable droppableId={day.key} isDropDisabled={isPast}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "p-2 space-y-2 flex-1 empty-cell-area",
                        isWeekendDay && !isCurrentDay ? "bg-gray-50" : "bg-white",
                        snapshot.isDraggingOver && !isPast && "bg-blue-50/50 border-2 border-dashed border-blue-300",
                        isPast && "bg-red-50/30",
                        "relative group"
                      )}
                    >
                      {postsByDay[day.key]?.length === 0 && posts.length > 0 && !isPast && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="text-center p-4">
                            <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500">Créer un post</p>
                          </div>
                        </div>
                      )}
                      
                      {isPast && postsByDay[day.key]?.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p className="text-xs text-gray-400">Date passée</p>
                        </div>
                      )}
                      
                      {postsByDay[day.key]?.map((post, index) => {
                        if (!post.id) {
                          console.error('Post without ID:', post);
                          return null;
                        }
                        const isPublished = post.status === 'published';
                        return (
                        <Draggable 
                          key={post.id} 
                          draggableId={String(post.id)} 
                          index={index}
                          isDragDisabled={isPublished}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.5 : isPublished ? 0.9 : 1,
                                cursor: isPublished ? 'default' : 'grab'
                              }}
                              className={cn(
                                isPublished && "border-l-4 border-green-500"
                              )}
                            >
                              <PostCard
                                post={post}
                                isDragging={snapshot.isDragging}
                                onPreview={handlePreview}
                                onEdit={isPublished ? undefined : handleEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={isPublished ? undefined : handleDelete}
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
              );
            })}
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
