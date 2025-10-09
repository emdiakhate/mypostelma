import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  // Mock data pour le dashboard
  const stats = [
    { title: 'Publications cette semaine', value: '24', change: '+12%', trend: 'up' },
    { title: 'Engagement moyen', value: '8.2%', change: '+2.1%', trend: 'up' },
    { title: 'Publications programmées', value: '156', change: '+8', trend: 'up' },
    { title: 'Plateformes actives', value: '6', change: '0', trend: 'stable' }
  ];

  const recentPosts = [
    {
      id: '1',
      content: '🥩 Découvrez notre sélection premium de viandes fraîches chez Mata Viande !',
      platforms: ['instagram', 'facebook'],
      scheduledTime: '2025-01-08 10:00',
      status: 'scheduled',
      engagement: { likes: 45, comments: 12, shares: 8 }
    },
    {
      id: '2', 
      content: '🍖 Nos steaks de bœuf sont parfaits pour vos grillades du weekend.',
      platforms: ['twitter', 'linkedin'],
      scheduledTime: '2025-01-08 14:30',
      status: 'published',
      engagement: { likes: 23, comments: 5, shares: 3 }
    },
    {
      id: '3',
      content: '📦 Livraison gratuite dès 50€ ! Commandez maintenant.',
      platforms: ['instagram'],
      scheduledTime: '2025-01-09 09:00',
      status: 'pending',
      engagement: { likes: 0, comments: 0, shares: 0 }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <Pause className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Vue d'ensemble de votre activité sur les réseaux sociaux</p>
        </div>
        <Link to="/calendar">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle publication
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`flex items-center space-x-1 ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link to="/calendar">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Calendar className="w-6 h-6 mb-2" />
                  <span className="text-sm">Planifier</span>
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </Link>
              <Link to="/queue">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Users className="w-6 h-6 mb-2" />
                  <span className="text-sm">File d'attente</span>
                </Button>
              </Link>
              <Link to="/archives">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Eye className="w-6 h-6 mb-2" />
                  <span className="text-sm">Archives</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publications récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getStatusColor(post.status)}>
                        {getStatusIcon(post.status)}
                        <span className="ml-1 capitalize">{post.status}</span>
                      </Badge>
                      <span className="text-xs text-gray-500">{post.scheduledTime}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>❤️ {post.engagement.likes}</span>
                      <span>💬 {post.engagement.comments}</span>
                      <span>🔄 {post.engagement.shares}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/calendar">
                <Button variant="outline" className="w-full">
                  Voir toutes les publications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble des plateformes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', posts: 12, engagement: '8.2%' },
              { name: 'Facebook', color: 'bg-blue-600', posts: 8, engagement: '6.1%' },
              { name: 'Twitter', color: 'bg-black', posts: 15, engagement: '4.3%' },
              { name: 'LinkedIn', color: 'bg-blue-700', posts: 5, engagement: '12.1%' },
              { name: 'YouTube', color: 'bg-red-600', posts: 3, engagement: '15.2%' },
              { name: 'TikTok', color: 'bg-black', posts: 7, engagement: '9.8%' }
            ].map((platform, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className={`w-12 h-12 ${platform.color} rounded-lg mx-auto mb-3 flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{platform.name[0]}</span>
                </div>
                <h3 className="font-semibold text-sm text-gray-900">{platform.name}</h3>
                <p className="text-xs text-gray-600">{platform.posts} posts</p>
                <p className="text-xs text-green-600 font-medium">{platform.engagement}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
