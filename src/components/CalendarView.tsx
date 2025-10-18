import React, { useState, memo, useCallback, useMemo, useRef } from 'react';
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
    
    const dayIndex = weekDays.findIndex(day => day.key === destination.droppableId);
    if (dayIndex === -1) return;
    
    const targetDate = weekDays[dayIndex].date;
    const newScheduledTime = new Date(post.scheduledTime);
    newScheduledTime.setDate(targetDate.getDate());
    newScheduledTime.setMonth(targetDate.getMonth());
    newScheduledTime.setFullYear(targetDate.getFullYear());
    
    onUpdatePost(post.id, { scheduledTime: newScheduledTime });
  }, [posts, weekDays, onUpdatePost]);

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
    <div className="flex flex-col h-full">
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
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#f5f5f5' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-px" style={{ backgroundColor: '#e5e5e5' }}>
            {weekDays.map((day) => (
              <div 
                key={day.key} 
                className="flex flex-col bg-white"
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
                        "p-2 space-y-2 min-h-[100px]",
                        snapshot.isDraggingOver && "bg-blue-50/30"
                      )}
                    >
                      {postsByDay[day.key]?.map((post, index) => {
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
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.5 : 1
                              }}
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