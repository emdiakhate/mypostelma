import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Hash, 
  Clock, 
  BarChart3, 
  Target,
  Copy,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les données des concurrents
interface CompetitorPost {
  id: string;
  content: string;
  image: string;
  publishedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  hashtags: string[];
  engagement: number;
}

interface CompetitorMetrics {
  postsPerWeek: number;
  avgEngagement: number;
  totalFollowers: number;
  engagementRate: number;
  topHashtags: { tag: string; count: number }[];
  bestPostingTimes: { hour: number; day: string; engagement: number }[];
  toneAnalysis: {
    tone: 'Professionnel' | 'Casual' | 'Inspirant' | 'Vendeur';
    avgCaptionLength: number;
    emojiUsage: number;
    ctaUsage: number;
    preferredFormats: { format: string; percentage: number }[];
  };
}

interface Competitor {
  id: string;
  name: string;
  platform: string;
  handle: string;
  avatar: string;
  bio: string;
  posts: CompetitorPost[];
  metrics: CompetitorMetrics;
  engagementHistory: { date: string; engagement: number }[];
}

// Données vides
const mockCompetitors: Competitor[] = [];

const CompetitiveIntelligence: React.FC = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('1');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CompetitorPost | null>(null);

  const competitor = useMemo(() => 
    mockCompetitors.find(c => c.id === selectedCompetitor),
    [selectedCompetitor]
  );

  const handleAdaptStrategy = (post: CompetitorPost) => {
    setSelectedPost(post);
    setShowCreateModal(true);
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'Professionnel': return 'bg-blue-100 text-blue-800';
      case 'Casual': return 'bg-green-100 text-green-800';
      case 'Inspirant': return 'bg-purple-100 text-purple-800';
      case 'Vendeur': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitive Intelligence</h1>
          <p className="text-gray-600">Analysez vos concurrents et adaptez leurs meilleures stratégies</p>
        </div>
        <button
          onClick={() => {
            alert('BOUTON CLIQUÉ!');
            console.log('BOUTON CLIQUÉ!');
            setShowCreateModal(true);
          }}
          style={{
            padding: '8px 16px',
            background: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          TEST
        </button>
      </div>

      {/* Empty state */}
      {mockCompetitors.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun concurrent ajouté</h3>
              <p className="text-gray-600 mb-6">
                Commencez à analyser vos concurrents pour améliorer votre stratégie
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un concurrent
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sélecteur de concurrents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockCompetitors.map((comp) => (
              <Card 
                key={comp.id} 
                className={`cursor-pointer transition-all ${
                  selectedCompetitor === comp.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedCompetitor(comp.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={comp.avatar} 
                      alt={comp.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                      <p className="text-sm text-gray-600">{comp.handle}</p>
                      <div className="flex items-center mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {comp.platform}
                        </Badge>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatNumber(comp.metrics.totalFollowers)} followers
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {competitor && (
        <div className="space-y-6">
          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Posts/semaine</p>
                    <p className="text-2xl font-bold">{competitor.metrics.postsPerWeek}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Engagement moyen</p>
                    <p className="text-2xl font-bold">{competitor.metrics.avgEngagement}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Followers</p>
                    <p className="text-2xl font-bold">{formatNumber(competitor.metrics.totalFollowers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Taux d'engagement</p>
                    <p className="text-2xl font-bold">{competitor.metrics.engagementRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="posts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="posts">Posts récents</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="insights">Insights IA</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitor.posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <img 
                          src={post.image} 
                          alt="Post"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {formatNumber(post.likes)}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              {formatNumber(post.comments)}
                            </span>
                            <span className="flex items-center">
                              <Share2 className="w-3 h-3 mr-1" />
                              {formatNumber(post.shares)}
                            </span>
                            {post.views && (
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {formatNumber(post.views)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {post.hashtags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAdaptStrategy(post)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Adapter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique d'engagement */}
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution de l'engagement (30 jours)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={competitor.engagementHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="engagement" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Hashtags populaires */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hashtags les plus utilisés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {competitor.metrics.topHashtags.map((hashtag, index) => (
                        <div key={hashtag.tag} className="flex items-center justify-between">
                          <span className="text-sm font-medium">#{hashtag.tag}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(hashtag.count / 50) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{hashtag.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Analyse du tone */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse du tone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tone principal</span>
                      <Badge className={getToneColor(competitor.metrics.toneAnalysis.tone)}>
                        {competitor.metrics.toneAnalysis.tone}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Longueur moyenne des captions</span>
                      <span className="text-sm text-gray-600">{competitor.metrics.toneAnalysis.avgCaptionLength} caractères</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Utilisation d'emojis</span>
                      <span className="text-sm text-gray-600">{competitor.metrics.toneAnalysis.emojiUsage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Utilisation de CTAs</span>
                      <span className="text-sm text-gray-600">{competitor.metrics.toneAnalysis.ctaUsage}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Formats préférés */}
                <Card>
                  <CardHeader>
                    <CardTitle>Formats de contenu préférés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {competitor.metrics.toneAnalysis.preferredFormats.map((format) => (
                        <div key={format.format} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{format.format}</span>
                            <span>{format.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${format.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modal d'adaptation de stratégie */}
      {showCreateModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Adapter cette stratégie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Post original:</h4>
                <p className="text-sm text-gray-700 mb-2">{selectedPost.content}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Heart className="w-3 h-3 mr-1" />
                    {formatNumber(selectedPost.likes)}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {formatNumber(selectedPost.comments)}
                  </span>
                  <span className="flex items-center">
                    <Share2 className="w-3 h-3 mr-1" />
                    {formatNumber(selectedPost.shares)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Caption adaptée (IA)</label>
                  <textarea 
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    placeholder="Votre caption adaptée sera générée ici..."
                    defaultValue={`🚀 Découvrez mes 5 stratégies pour booster votre engagement sur Instagram! Swipe pour voir mes conseils d'expert 👆 #InstagramTips #SocialMediaMarketing #Engagement`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Horaire suggéré</label>
                    <input 
                      type="time" 
                      className="w-full p-2 border rounded-lg"
                      defaultValue="10:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Jour suggéré</label>
                    <select className="w-full p-2 border rounded-lg">
                      <option>Lundi</option>
                      <option>Mardi</option>
                      <option>Mercredi</option>
                      <option>Jeudi</option>
                      <option>Vendredi</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Hashtags recommandés</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.hashtags.map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-blue-50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Créer le post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompetitiveIntelligence;
