import React, { useState } from 'react';
import CalendarView from '@/components/CalendarView';
import { Post } from '@/types/Post';
import { usePosts } from '@/hooks/usePosts';

const Index = () => {
  const { posts, loading, createPost, updatePost, deletePost, refetch } = usePosts();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <CalendarView
      posts={posts}
      currentDate={currentDate}
      onCreatePost={createPost}
      onUpdatePost={updatePost}
      onDeletePost={deletePost}
      onDateChange={handleDateChange}
    />
  );
};

export default Index;