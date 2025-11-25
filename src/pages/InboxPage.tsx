/**
 * Inbox Page - Unified Inbox for all social conversations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Archive,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import { TwitterIcon } from '@/config/socialIcons';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ConversationView } from '@/components/inbox/ConversationView';
import type { ConversationWithLastMessage, InboxFilters, Platform } from '@/types/inbox';
import { getConversations, getInboxStats } from '@/services/inbox';
import { useToast } from '@/hooks/use-toast';

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: TwitterIcon,
  linkedin: Linkedin,
  tiktok: MessageCircle,
  whatsapp: MessageCircle,
};

export default function InboxPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithLastMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    unread_count: 0,
    read_count: 0,
    unassigned_count: 0,
    avg_response_time_minutes: 0,
    negative_sentiment_count: 0,
  });

  const [filters, setFilters] = useState<InboxFilters>({
    status: ['unread'],
    platform: [],
    assigned_to: undefined,
    tags: [],
    search: '',
  });

  const [activeTab, setActiveTab] = useState<'unread' | 'all' | 'assigned'>('unread');

  useEffect(() => {
    loadConversations();
    loadStats();
  }, [filters]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations(filters);
      setConversations(data);

      // Auto-select first conversation if none selected
      if (!selectedConversation && data.length > 0) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getInboxStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleTabChange = (tab: 'unread' | 'all' | 'assigned') => {
    setActiveTab(tab);
    if (tab === 'unread') {
      setFilters({ ...filters, status: ['unread'], assigned_to: undefined });
    } else if (tab === 'all') {
      setFilters({ ...filters, status: undefined, assigned_to: undefined });
    } else if (tab === 'assigned') {
      setFilters({ ...filters, status: undefined, assigned_to: 'me' });
    }
  };

  const handlePlatformFilter = (platform: Platform | 'all') => {
    if (platform === 'all') {
      setFilters({ ...filters, platform: [] });
    } else {
      const platforms = filters.platform || [];
      if (platforms.includes(platform)) {
        setFilters({ ...filters, platform: platforms.filter((p) => p !== platform) });
      } else {
        setFilters({ ...filters, platform: [...platforms, platform] });
      }
    }
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Conversation List */}
      <div className="w-[400px] border-r bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-6 w-6" />
              <h1 className="text-xl font-bold">Inbox</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadConversations}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-2">
            <Badge variant="default" className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {stats.unread_count} non lus
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {stats.avg_response_time_minutes?.toFixed(0) || 0}min
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="unread">
                Non lus ({stats.unread_count})
              </TabsTrigger>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="assigned">Assignés</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Platform Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['instagram', 'facebook', 'twitter', 'linkedin'] as Platform[]).map((platform) => {
              const Icon = platformIcons[platform];
              const isActive = filters.platform?.includes(platform);
              return (
                <Button
                  key={platform}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePlatformFilter(platform)}
                  className="h-8"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {platform}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id}
            onSelect={setSelectedConversation}
          />
        </div>
      </div>

      {/* Right Panel - Conversation View */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ConversationView
            conversation={selectedConversation}
            onUpdate={loadConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <Inbox className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune conversation sélectionnée</h3>
              <p className="text-muted-foreground">
                Sélectionnez une conversation pour voir les messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
