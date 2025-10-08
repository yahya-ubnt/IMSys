'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { DiagnosticLog } from '@/types/diagnostics';

interface DiagnosticButtonProps {
  userId: string;
  onRunStart: () => void;
  onRunComplete: (log: DiagnosticLog) => void;
}

export function DiagnosticButton({ userId, onRunStart, onRunComplete }: DiagnosticButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleRunDiagnostic = async () => {
    setIsLoading(true);
    onRunStart();

    try {
      const response = await fetch(`/api/mikrotik/users/${userId}/diagnostics`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stream: false }) // Explicitly request non-streaming response
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to run diagnostics.');
      }
      
      onRunComplete(result as DiagnosticLog);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: 'Diagnostic Error', description: errorMessage, variant: 'destructive' });
      onRunComplete({
        _id: 'error',
        user: userId,
        finalConclusion: 'Diagnostic process failed.',
        steps: [{
          stepName: 'Critical Error',
          status: 'Failure',
          summary: errorMessage,
        }],
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleRunDiagnostic} disabled={isLoading} className="bg-green-600 text-white hover:bg-green-700 w-36">
      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
      {isLoading ? 'Running...' : 'Run Diagnostic'}
    </Button>
  );
}