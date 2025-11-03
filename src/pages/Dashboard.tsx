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
  const stats = [
    { title: 'Publications cette semaine', value: '0', change: '+0%', trend: 'stable' },
    { title: 'Engagement moyen', value: '0%', change: '+0%', trend: 'stable' },
    { title: 'Publications programmées', value: '0', change: '+0', trend: 'stable' },
    { title: 'Plateformes actives', value: '0', change: '0', trend: 'stable' }
  ];

  const recentPosts: any[] = [];

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
            {recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Aucune publication récente</p>
                <Link to="/app/calendar">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer votre première publication
                  </Button>
                </Link>
              </div>
            ) : (
              <>
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
                  <Link to="/app/calendar">
                    <Button variant="outline" className="w-full">
                      Voir toutes les publications
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble des plateformes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Connectez vos comptes sociaux pour voir vos statistiques</p>
            <Link to="/app/settings/accounts">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Connecter mes comptes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
