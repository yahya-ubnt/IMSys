'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlayCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticButtonProps {
  userId: string;
}

export function DiagnosticButton({ userId }: DiagnosticButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleRunDiagnostic = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/mikrotik/users/${userId}/diagnostics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stream: false }) // Explicitly request non-streaming response
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to run diagnostics.');
      }

      // Navigate to the new dedicated page for the diagnostic report
      router.push(`/mikrotik/users/${userId}/diagnostics/${result._id}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: 'Diagnostic Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRunDiagnostic}
      disabled={isLoading}
      size="sm" // Changed to "sm" for consistency
      className="bg-green-600 text-white hover:bg-green-700 sm:size-sm size-icon" // Responsive sizing
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
      ) : (
        <PlayCircle className="h-4 w-4 sm:mr-2" />
      )}
      <span className="hidden sm:inline">{isLoading ? 'Running...' : 'Run Diagnostic'}</span>
    </Button>
  );
}