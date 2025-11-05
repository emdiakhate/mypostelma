import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceRecorderButtonProps {
  onTranscription: (text: string) => void;
}

const VoiceRecorderButton = ({ onTranscription }: VoiceRecorderButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.info('Enregistrement en cours... Parlez maintenant');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      toast.info('Traitement de l\'audio...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call the voice-to-text edge function
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('Error transcribing audio:', error);
          toast.error('Erreur lors de la transcription');
          setIsProcessing(false);
          return;
        }

        if (data && data.text) {
          onTranscription(data.text);
          toast.success('Message vocal transcrit avec succès !');
        } else {
          toast.error('Aucune transcription reçue');
        }
        
        setIsProcessing(false);
      };
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Erreur lors du traitement audio');
      setIsProcessing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={cn(
        "w-8 h-8 rounded-full",
        isRecording && "bg-red-500 hover:bg-red-600 text-white animate-pulse"
      )}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Mic className={cn("w-4 h-4", isRecording ? "text-white" : "text-muted-foreground")} />
      )}
    </Button>
  );
};

export default VoiceRecorderButton;
