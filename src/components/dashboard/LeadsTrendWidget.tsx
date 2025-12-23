import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, UserPlus, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadStats {
  total: number;
  newThisWeek: number;
  converted: number;
  conversionRate: number;
}

interface DailyLeadData {
  date: string;
  leads: number;
  label: string;
}

export const LeadsTrendWidget: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    newThisWeek: 0,
    converted: 0,
    conversionRate: 0
  });
  const [trendData, setTrendData] = useState<DailyLeadData[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadLeadsData();
    }
  }, [currentUser]);

  const loadLeadsData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Récupérer le total des leads
      const { count: totalCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      // Récupérer les leads de la semaine
      const weekAgo = subDays(new Date(), 7);
      const { count: weekCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .gte('added_at', weekAgo.toISOString());

      // Récupérer les leads convertis (status = 'client')
      const { count: convertedCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'client');

      // Calculer le taux de conversion
      const total = totalCount || 0;
      const converted = convertedCount || 0;
      const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

      setStats({
        total,
        newThisWeek: weekCount || 0,
        converted,
        conversionRate
      });

      // Récupérer les données pour le graphique (14 derniers jours)
      const chartData: DailyLeadData[] = [];
      for (let i = 13; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .gte('added_at', dayStart.toISOString())
          .lte('added_at', dayEnd.toISOString());

        chartData.push({
          date: format(day, 'yyyy-MM-dd'),
          leads: count || 0,
          label: format(day, 'dd MMM', { locale: fr })
        });
      }

      setTrendData(chartData);
    } catch (error) {
      console.error('Erreur chargement leads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Évolution des Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Évolution des Leads (14 jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats en grille */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Cette semaine</span>
            </div>
            <p className="text-2xl font-bold text-green-700">+{stats.newThisWeek}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Convertis</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{stats.converted}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Taux conversion</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">{stats.conversionRate}%</p>
          </div>
        </div>

        {/* Graphique */}
        <div className="h-[200px]">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`${value} leads`, 'Nouveaux leads']}
                  labelFormatter={(label) => `${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
