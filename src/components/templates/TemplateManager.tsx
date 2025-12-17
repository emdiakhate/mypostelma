import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Mail, MessageSquare, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserTemplate {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'sms';
  category: string;
  subject?: string;
  content: string;
  is_default: boolean;
  created_at: string;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    channel: 'email' as 'email' | 'whatsapp' | 'sms',
    category: 'contact',
    subject: '',
    content: '',
    is_default: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: UserTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        channel: template.channel,
        category: template.category,
        subject: template.subject || '',
        content: template.content,
        is_default: template.is_default,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        channel: 'email',
        category: 'contact',
        subject: '',
        content: '',
        is_default: false,
      });
    }
    setShowDialog(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!formData.name || !formData.content) {
        toast.error('Le nom et le contenu sont requis');
        return;
      }

      if (formData.channel === 'email' && !formData.subject) {
        toast.error('Le sujet est requis pour les emails');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('user_templates')
          .update({
            name: formData.name,
            channel: formData.channel,
            category: formData.category,
            subject: formData.channel === 'email' ? formData.subject : null,
            content: formData.content,
            is_default: formData.is_default,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast.success('Template mis à jour avec succès');
      } else {
        // Create new template
        const { error } = await supabase
          .from('user_templates')
          .insert({
            user_id: user.id,
            name: formData.name,
            channel: formData.channel,
            category: formData.category,
            subject: formData.channel === 'email' ? formData.subject : null,
            content: formData.content,
            is_default: formData.is_default,
          });

        if (error) throw error;

        toast.success('Template créé avec succès');
      }

      setShowDialog(false);
      loadTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde du template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      const { error } = await supabase
        .from('user_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Template supprimé avec succès');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression du template');
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'sms':
        return <Phone className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'whatsapp':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'sms':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes Templates de Messages</CardTitle>
              <CardDescription>
                Créez et gérez vos templates personnalisés pour email et WhatsApp
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore créé de templates personnalisés
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Créer votre premier template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="ml-2">
                          Par défaut
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getChannelColor(template.channel)}
                      >
                        <span className="flex items-center gap-1">
                          {getChannelIcon(template.channel)}
                          {template.channel}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.subject || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Template Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
            <DialogDescription>
              Les variables disponibles : {'{'}nom{'}'}, {'{'}entreprise{'}'}, {'{'}categorie{'}'},{' '}
              {'{'}ville{'}'}, {'{'}mon_prenom{'}'}, {'{'}mon_nom{'}'}, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du template</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Premier contact restaurant"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="channel">Canal</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value: 'email' | 'whatsapp' | 'sms') =>
                    setFormData({ ...formData, channel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="relance">Relance</SelectItem>
                    <SelectItem value="suivi">Suivi</SelectItem>
                    <SelectItem value="closing">Closing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.channel === 'email' && (
              <div>
                <Label htmlFor="subject">Sujet (Email)</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Opportunité de collaboration - {entreprise}"
                />
              </div>
            )}

            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Bonjour {nom},&#10;&#10;Je me permets de vous contacter..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
