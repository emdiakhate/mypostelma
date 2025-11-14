/**
 * Competitors Page
 *
 * Manage competitor tracking and AI-powered strategic analysis.
 * Integrates with N8N workflow for web scraping and OpenAI analysis.
 */

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  TrendingUp,
  BarChart3,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompetitorCard } from '@/components/CompetitorCard';
import { useCompetitors } from '@/hooks/useCompetitors';

export default function CompetitorsPage() {
  const { competitors, loading, addCompetitor, refreshCompetitors } = useCompetitors();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    instagram_url: '',
    facebook_url: '',
    linkedin_url: '',
    twitter_url: '',
    tiktok_url: '',
    website_url: '',
  });


  // Filter competitors
  const filteredCompetitors = competitors.filter((competitor) => {
    const matchesSearch = competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         competitor.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = filterIndustry === 'all' || competitor.industry === filterIndustry;
    return matchesSearch && matchesIndustry;
  });

  // Get unique industries for filter
  const industries = Array.from(new Set(competitors.map(c => c.industry).filter(Boolean)));

  // Stats
  const stats = {
    total: competitors.length,
    analyzed: competitors.filter(c => c.analysis_count > 0).length,
    pending: competitors.filter(c => c.analysis_count === 0).length,
  };

  // Handle add competitor
  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addCompetitor({
        name: formData.name,
        industry: formData.industry || undefined,
        description: formData.description || undefined,
        instagram_url: formData.instagram_url || undefined,
        facebook_url: formData.facebook_url || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        twitter_url: formData.twitter_url || undefined,
        tiktok_url: formData.tiktok_url || undefined,
        website_url: formData.website_url || undefined,
      });

      // Reset form
      setFormData({
        name: '',
        industry: '',
        description: '',
        instagram_url: '',
        facebook_url: '',
        linkedin_url: '',
        twitter_url: '',
        tiktok_url: '',
        website_url: '',
      });

      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding competitor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('CompetitorsPage render, isAddDialogOpen:', isAddDialogOpen);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Competitor Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and analyze your competitors with AI-powered insights
          </p>
        </div>
        <div className="relative z-50">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              alert('BUTTON CLICKED! isAddDialogOpen avant: ' + isAddDialogOpen);
              setIsAddDialogOpen(true);
              alert('BUTTON CLICKED! isAddDialogOpen après: ' + true);
            }}
            className="pointer-events-auto"
            style={{ position: 'relative', zIndex: 9999 }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Add Competitor Dialog - Simple Version for Testing */}
      {isAddDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsAddDialogOpen(false)}
        >
          <div 
            className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Add New Competitor</h2>
              <p className="text-sm text-muted-foreground">
                Enter competitor information. Social media URLs and website are used for AI analysis.
              </p>
            </div>
            
            <form onSubmit={handleAddCompetitor}>
              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Corp"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Technology, Fashion, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the competitor..."
                    rows={3}
                  />
                </div>

                {/* Social Media URLs */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Social Media & Web Presence
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website_url" className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Website URL
                      </Label>
                      <Input
                        id="website_url"
                        type="url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram_url" className="flex items-center gap-2">
                        <Instagram className="h-3 w-3" />
                        Instagram URL
                      </Label>
                      <Input
                        id="instagram_url"
                        type="url"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                        placeholder="https://instagram.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook_url" className="flex items-center gap-2">
                        <Facebook className="h-3 w-3" />
                        Facebook URL
                      </Label>
                      <Input
                        id="facebook_url"
                        type="url"
                        value={formData.facebook_url}
                        onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                        placeholder="https://facebook.com/page"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                        <Linkedin className="h-3 w-3" />
                        LinkedIn URL
                      </Label>
                      <Input
                        id="linkedin_url"
                        type="url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/company/name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter_url" className="flex items-center gap-2">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X (Twitter) URL
                      </Label>
                      <Input
                        id="twitter_url"
                        type="url"
                        value={formData.twitter_url}
                        onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                        placeholder="https://x.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        TikTok URL
                      </Label>
                      <Input
                        id="tiktok_url"
                        type="url"
                        value={formData.tiktok_url}
                        onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Competitor
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.analyzed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Competitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry || ''}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || filterIndustry !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setFilterIndustry('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competitors List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Competitors ({filteredCompetitors.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompetitors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {competitors.length === 0 ? 'No Competitors Yet' : 'No Competitors Found'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {competitors.length === 0
                  ? 'Add your first competitor to start tracking and analyzing their strategy.'
                  : 'Try adjusting your filters or search query.'}
              </p>
              {competitors.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Competitor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompetitors.map((competitor) => (
              <CompetitorCard
                key={competitor.id}
                competitor={competitor}
                onUpdate={refreshCompetitors}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      {competitors.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              About Competitor Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Our AI analyzes your competitors' social media presence, website, and content strategy
              to provide actionable insights.
            </p>
            <p>
              <strong>Analysis includes:</strong> positioning, content strategy, tone, strengths, weaknesses,
              opportunities, and strategic recommendations.
            </p>
            <p className="text-xs">
              Cost: ~€0.0013 (OpenAI) + Apify credits • Duration: 1-5 minutes (powered by Apify + Jina.ai + OpenAI)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
