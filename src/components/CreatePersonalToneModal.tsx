import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePersonalTones } from '@/hooks/usePersonalTones';
import { Sparkles, Loader2 } from 'lucide-react';

interface CreatePersonalToneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePersonalToneModal({ open, onOpenChange }: CreatePersonalToneModalProps) {
  const [name, setName] = useState('');
  const [examples, setExamples] = useState('');
  const { createTone, isCreating } = usePersonalTones();

  const handleSubmit = () => {
    if (!name.trim() || examples.length < 200) {
      return;
    }

    createTone(
      { name: name.trim(), examples: [examples] },
      {
        onSuccess: () => {
          setName('');
          setExamples('');
          onOpenChange(false);
        },
      }
    );
  };

  const characterCount = examples.length;
  const isValid = name.trim() && characterCount >= 200;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Créez votre ton personnel
          </DialogTitle>
          <DialogDescription>
            L'IA analysera votre style d'écriture pour reproduire votre ton unique dans vos futurs posts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tone-name">Nom du ton</Label>
            <Input
              id="tone-name"
              placeholder="Ex: Mon style"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Donnez un nom à votre style d'écriture
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examples">Exemples de votre écriture</Label>
            <Textarea
              id="examples"
              placeholder="Collez ici 2-3 exemples de posts que vous avez écrits (minimum 200 caractères)&#10;&#10;Exemple:&#10;🚀 Nouveau projet lancé ! Trop content de partager ça avec vous. On a bossé dur pour créer quelque chose d'unique. Dites-moi ce que vous en pensez ! 💪&#10;&#10;Hello la team ! Petit update sur le projet... [etc]"
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              className="min-h-[200px] resize-none"
              disabled={isCreating}
            />
            <div className="flex items-center justify-between text-xs">
              <p className="text-muted-foreground">
                {characterCount < 200 ? (
                  <span className="text-destructive">
                    {200 - characterCount} caractères restants
                  </span>
                ) : (
                  <span className="text-green-600">✓ Assez de contenu</span>
                )}
              </p>
              <p className="text-muted-foreground">{characterCount} / 200</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">💡 L'IA analysera votre style :</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Vocabulaire et expressions</li>
              <li>• Ton (formel/casual)</li>
              <li>• Structure des phrases</li>
              <li>• Utilisation des emojis</li>
            </ul>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser & Créer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
