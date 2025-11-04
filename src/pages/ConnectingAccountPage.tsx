/**
 * Page de transition pendant la connexion d'un compte social
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, Instagram, Facebook, Linkedin, Twitter, Music, MessageCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const platformConfig = {
  instagram: {
    icon: Instagram,
    gradient: 'from-purple-500/20 to-pink-500/20',
    name: 'Instagram'
  },
  facebook: {
    icon: Facebook,
    gradient: 'from-blue-600/20 to-blue-700/20',
    name: 'Facebook'
  },
  tiktok: {
    icon: Music,
    gradient: 'from-black/10 to-gray-800/10',
    name: 'TikTok'
  },
  linkedin: {
    icon: Linkedin,
    gradient: 'from-blue-700/20 to-blue-800/20',
    name: 'LinkedIn'
  },
  x: {
    icon: Twitter,
    gradient: 'from-black/10 to-gray-900/10',
    name: 'X (Twitter)'
  },
  threads: {
    icon: MessageCircle,
    gradient: 'from-gray-800/20 to-black/20',
    name: 'Threads'
  }
};

export default function ConnectingAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const platform = searchParams.get('platform') as keyof typeof platformConfig || 'instagram';
  const config = platformConfig[platform];
  const Icon = config.icon;

  useEffect(() => {
    // Simuler une progression
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 300);

    // Rediriger après 3 secondes
    const redirectTimer = setTimeout(() => {
      setIsSuccess(true);
      setProgress(100);
      setTimeout(() => {
        navigate('/app/settings/accounts?connected=true');
      }, 1000);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="Postelma" 
            className="h-16 mx-auto mb-4"
          />
        </div>

        {/* Card principale */}
        <div className="bg-card border shadow-xl rounded-2xl p-8 space-y-6 relative overflow-hidden">
          {/* Fond avec icône de la plateforme */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-5",
            config.gradient
          )}>
            <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-foreground/10" />
          </div>

          {/* Contenu */}
          <div className="relative z-10 space-y-6">
            {/* Icône animée */}
            <div className="flex justify-center">
              {isSuccess ? (
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <Loader2 className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-spin" />
                </div>
              )}
            </div>

            {/* Texte */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">
                {isSuccess ? 'Connexion réussie !' : `Connexion à ${config.name}...`}
              </h2>
              <p className="text-muted-foreground">
                {isSuccess 
                  ? 'Redirection en cours vers vos comptes'
                  : 'Veuillez patienter pendant que nous connectons votre compte'
                }
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progress}%
              </p>
            </div>

            {/* Message */}
            {!isSuccess && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 text-center">
                  🔐 Connexion sécurisée via Upload-Post
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info supplémentaire */}
        <p className="text-center text-xs text-muted-foreground">
          Vous serez redirigé automatiquement dans quelques instants
        </p>
      </div>
    </div>
  );
}
