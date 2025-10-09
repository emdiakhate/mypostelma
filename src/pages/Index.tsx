import React, { useState } from 'react';
import CalendarView from '@/components/CalendarView';
import { Post } from '@/types/Post';
import { samplePosts } from '@/data/sampleData';

const Index = () => {
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  

  const handlePostsChange = (newPosts: Post[]) => {
    setPosts(newPosts);
  };

  const handleCreatePost = (dayColumn: string) => {
    console.log('Create post for day:', dayColumn);
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <CalendarView
        posts={posts}
        currentDate={currentDate}
        onPostsChange={handlePostsChange}
        onCreatePost={handleCreatePost}
        onDateChange={handleDateChange}
      />
    </div>
  );
};

export default Index;