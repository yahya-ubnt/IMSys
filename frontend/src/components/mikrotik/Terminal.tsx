'use client';

import { useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useTerminalWebSocket } from '@/hooks/useTerminalWebSocket'; // Import the custom hook

interface MikroTikTerminalProps {
  routerId: string;
}

import React from 'react'; // Add React import

export const MikroTikTerminal = React.memo(function MikroTikTerminal({ routerId }: MikroTikTerminalProps) {
  // console.log('MikroTikTerminal: Component rendered'); // Removed this log
  const terminalRef = useRef<HTMLDivElement>(null);
  
  const { token } = useAuth();

  // Use the custom hook to manage the terminal and WebSocket
  useTerminalWebSocket({ terminalRef, routerId, token });

  return <div ref={terminalRef} style={{ width: '100%', height: '500px' }} />;
});
