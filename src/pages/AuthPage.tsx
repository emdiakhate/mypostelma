import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar } from 'lucide-react';
import { OnboardingModal } from '@/components/OnboardingModal';
import { z } from 'zod';

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState<string>('');

  // Récupérer l'URL de retour depuis location.state
  const returnUrl = (window.history.state?.usr?.from as string) || '/app/dashboard';

  // Validation schemas
  const signUpSchema = z.object({
    name: z.string()
      .trim()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(100, 'Le nom est trop long'),
    email: z.string()
      .trim()
      .email('Format d\'email invalide')
      .max(255, 'L\'email est trop long'),
    password: z.string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre')
  });

  const signInSchema = z.object({
    email: z.string().trim().email('Format d\'email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis')
  });

  // Redirect si déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(returnUrl);
      }
    });
  }, [navigate, returnUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validated = signUpSchema.parse({ name, email, password });

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: { name: validated.name },
          emailRedirectTo: `${window.location.origin}/app/dashboard`
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Compte existant',
            description: 'Cet email est déjà utilisé. Connectez-vous.',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Compte créé !',
          description: 'Bienvenue sur PostElma'
        });
        
        // Afficher le modal d'onboarding
        if (data.user) {
          setNewUserId(data.user.id);
          setNewUserName(validated.name);
          setShowOnboarding(true);
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erreur de validation',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la création du compte',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validated = signInSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Erreur',
            description: 'Email ou mot de passe incorrect',
            variant: 'destructive'
          });
        } else {
          throw error;
        }
      } else {
        navigate(returnUrl);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erreur de validation',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la connexion',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal d'onboarding */}
      {showOnboarding && newUserId && (
        <OnboardingModal
          isOpen={showOnboarding}
          userId={newUserId}
          userName={newUserName}
          onComplete={() => {
            setShowOnboarding(false);
          }}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">PostElma</CardTitle>
          <CardDescription>
            Gérez vos publications sur les réseaux sociaux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    8+ caractères, avec majuscule, minuscule et chiffre
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer un compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
