import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Users, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InvitationDetails {
  email: string;
  team: {
    id: string;
    name: string;
    color: string;
  };
  role: string;
}

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyInvitation();
    }
  }, [token, user]);

  const verifyInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: inviteError } = await supabase.functions.invoke(
        'accept-team-invitation',
        {
          body: { token },
        }
      );

      if (inviteError) throw inviteError;

      if (data.success) {
        // Invitation was accepted automatically (user is logged in)
        setSuccess(true);
        setTimeout(() => {
          navigate('/messages'); // Redirect to teams page
        }, 2000);
      } else if (data.requires_signup) {
        // User needs to sign up
        setInvitation(data.invitation);
      } else {
        throw new Error(data.error || 'Failed to verify invitation');
      }
    } catch (err: any) {
      console.error('Error verifying invitation:', err);
      setError(err.message || 'Cette invitation est invalide ou a expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to signup with invitation token
      navigate(`/signup?invitation_token=${token}&email=${invitation?.email}`);
      return;
    }

    try {
      setAccepting(true);
      const { data, error: acceptError } = await supabase.functions.invoke(
        'accept-team-invitation',
        {
          body: { token },
        }
      );

      if (acceptError) throw acceptError;

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/messages');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to accept invitation');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Erreur lors de l\'acceptation de l\'invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600">Vérification de l'invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Invitation acceptée !
              </h2>
              <p className="text-gray-600 text-center mb-4">
                Vous êtes maintenant membre de l'équipe
              </p>
              <p className="text-sm text-gray-500">Redirection en cours...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Invitation invalide
              </h2>
              <p className="text-gray-600 text-center mb-6">{error}</p>
              <Button onClick={() => navigate('/')} variant="outline">
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: invitation.team.color }}
            >
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            Invitation à rejoindre une équipe
          </CardTitle>
          <CardDescription className="text-center">
            Vous avez été invité à rejoindre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Équipe</p>
                <p className="font-semibold text-gray-900">{invitation.team.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Email invité</p>
                <p className="font-semibold text-gray-900">{invitation.email}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {user ? (
            <>
              {user.email === invitation.email ? (
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Acceptation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accepter l'invitation
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-red-600">
                    Cette invitation a été envoyée à {invitation.email}, mais vous êtes
                    connecté avec {user.email}.
                  </p>
                  <Button
                    onClick={() => {
                      supabase.auth.signOut();
                      window.location.reload();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Se déconnecter et réessayer
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Vous devez créer un compte ou vous connecter pour accepter cette invitation
              </p>
              <Button
                onClick={handleAccept}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                Créer un compte et accepter
              </Button>
              <Button
                onClick={() => navigate(`/login?invitation_token=${token}`)}
                variant="outline"
                className="w-full"
              >
                J'ai déjà un compte
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              Refuser l'invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
