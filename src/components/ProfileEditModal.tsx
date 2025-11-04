/**
 * Modal pour modifier le profil utilisateur (nom + photo)
 */

import React, { useState, useEffect } from 'react';
import { X, Upload, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string | null;
  userId: string;
  onProfileUpdate: (name: string, avatar: string | null) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentAvatar,
  userId,
  onProfileUpdate
}) => {
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState<string | null>(currentAvatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(currentName);
    setAvatar(currentAvatar);
    setAvatarFile(null);
  }, [currentName, currentAvatar, isOpen]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }

      // Créer une preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
        setAvatarFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Le nom ne peut pas être vide');
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = currentAvatar;

      // Upload de l'avatar si un nouveau fichier a été sélectionné
      if (avatarFile) {
        setIsUploading(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          toast.error('Erreur lors de l\'upload de l\'avatar');
          setIsUploading(false);
          setIsSaving(false);
          return;
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
        setIsUploading(false);
      }

      // Mettre à jour le profil dans la base de données
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          avatar: avatarUrl
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        toast.error('Erreur lors de la mise à jour du profil');
        setIsSaving(false);
        return;
      }

      toast.success('Profil mis à jour avec succès');
      onProfileUpdate(name.trim(), avatarUrl);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-center space-y-2">
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
              >
                <Upload className="w-4 h-4" />
                Changer la photo
              </Label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {isUploading && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Upload en cours...
                </p>
              )}
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom d'affichage</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isUploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploading || !name.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;
