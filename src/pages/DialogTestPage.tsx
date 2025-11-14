/**
 * Page de test pour diagnostiquer le problème avec le Dialog
 * Accéder via: http://localhost:5173/dialog-test
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function DialogTestPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Form Submitted',
      description: `Name: ${formData.name}, Email: ${formData.email}`,
    });
    setIsOpen(false);
    setFormData({ name: '', email: '' });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Dialog Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test 1: Simple Dialog with Trigger */}
          <div className="space-y-2">
            <h3 className="font-semibold">Test 1: Basic Dialog (with DialogTrigger)</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Simple Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Simple Dialog</DialogTitle>
                  <DialogDescription>
                    If you can see this, the basic Dialog component works! ✅
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>

          {/* Test 2: Controlled Dialog with State */}
          <div className="space-y-2">
            <h3 className="font-semibold">Test 2: Controlled Dialog (with open/onOpenChange)</h3>
            <div className="flex gap-2">
              <Button onClick={() => setIsOpen(true)}>Open Controlled Dialog</Button>
              <span className="text-sm text-muted-foreground self-center">
                State: {isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
              </span>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controlled Dialog</DialogTitle>
                  <DialogDescription>
                    This dialog is controlled by React state (isOpen). ✅
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={() => setIsOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Test 3: Dialog with Form */}
          <div className="space-y-2">
            <h3 className="font-semibold">Test 3: Dialog with Form (like Add Competitor)</h3>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>Open Form Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Form Dialog</DialogTitle>
                  <DialogDescription>
                    This mimics the "Add Competitor" dialog structure
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Test 4: Click Event Test */}
          <div className="space-y-2">
            <h3 className="font-semibold">Test 4: Click Event Detection</h3>
            <Button
              onClick={() => {
                setClickCount(clickCount + 1);
                console.log('Button clicked! Count:', clickCount + 1);
                toast({
                  title: 'Button Clicked',
                  description: `Click count: ${clickCount + 1}`,
                });
              }}
            >
              Click Counter: {clickCount}
            </Button>
          </div>

          {/* Diagnostic Info */}
          <div className="pt-6 border-t space-y-2">
            <h3 className="font-semibold">🔍 Diagnostic Information</h3>
            <div className="text-sm space-y-1 font-mono bg-muted p-3 rounded">
              <div>Location: {window.location.href}</div>
              <div>React version: {(window as any).React?.version || 'Not exposed'}</div>
              <div>Dialog component imported: ✅</div>
              <div>Button component imported: ✅</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-2">📝 Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Si <strong>Test 1</strong> fonctionne → Le Dialog de base marche
              </li>
              <li>
                Si <strong>Test 2</strong> fonctionne → Le state management marche
              </li>
              <li>
                Si <strong>Test 3</strong> fonctionne → Le formulaire marche (même structure que Add Competitor)
              </li>
              <li>
                Si <strong>Test 4</strong> fonctionne → Les events marche
              </li>
              <li>
                Si tous marchent mais pas dans CompetitorsPage → Problème spécifique à cette page
              </li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <strong>Si aucun test ne fonctionne:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Vérifiez la console (F12) pour les erreurs</li>
                <li>Essayez: npm install @radix-ui/react-dialog@latest</li>
                <li>Effacez le cache: Ctrl+Shift+R</li>
                <li>Redémarrez le serveur: npm run dev</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
