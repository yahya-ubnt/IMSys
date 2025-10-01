'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
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
    onRunStart();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/mikrotik/users/${userId}/diagnostics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result: DiagnosticLog = await response.json();

      if (!response.ok) {
        throw new Error(result.finalConclusion || 'Failed to run diagnostic');
      }

      onRunComplete(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorLog: DiagnosticLog = {
        _id: 'error',
        user: userId,
        finalConclusion: 'Failed to run diagnostic.',
        steps: [{
          stepName: 'Error',
          status: 'Failure',
          summary: errorMessage,
        }],
        createdAt: new Date().toISOString(),
      };
      onRunComplete(errorLog);
      toast({
        title: 'Diagnostic Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleRunDiagnostic} disabled={isLoading} className="bg-green-600 text-white hover:bg-green-700">
      <PlayCircle className="h-4 w-4 mr-2" />
      {isLoading ? 'Running...' : 'Run Diagnostic'}
    </Button>
  );
}