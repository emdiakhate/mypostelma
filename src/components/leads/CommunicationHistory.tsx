import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, MessageSquare, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CommunicationLog {
  id: string;
  type: 'email' | 'whatsapp' | 'sms';
  recipient: string;
  subject?: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at?: string;
  created_at: string;
}

interface CommunicationHistoryProps {
  leadId: string;
}

export function CommunicationHistory({ leadId }: CommunicationHistoryProps) {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunicationHistory();
  }, [leadId]);

  const loadCommunicationHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('communication_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading communication history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'sms':
        return <Phone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Envoyé
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Échec
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return null;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-600 bg-blue-50';
      case 'whatsapp':
        return 'text-green-600 bg-green-50';
      case 'sms':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique de communication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique de communication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune communication enregistrée pour ce lead.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historique de communication</CardTitle>
        <CardDescription>
          {logs.length} communication{logs.length > 1 ? 's' : ''} enregistrée{logs.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div key={log.id}>
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`p-2 rounded-full ${getChannelColor(log.type)}`}
                >
                  {getIcon(log.type)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">
                        {log.type}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.sent_at
                        ? format(new Date(log.sent_at), 'dd MMM yyyy HH:mm', { locale: fr })
                        : format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    À : {log.recipient}
                  </p>

                  {log.subject && (
                    <p className="text-sm font-medium">
                      {log.subject}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {log.message}
                  </p>
                </div>
              </div>

              {index < logs.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}