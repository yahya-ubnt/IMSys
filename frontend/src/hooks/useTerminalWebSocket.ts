import { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

interface UseTerminalWebSocketProps {
  terminalRef: React.RefObject<HTMLDivElement | null>;
  routerId: string;
  token: string | null;
}

export const useTerminalWebSocket = ({ terminalRef, routerId, token }: UseTerminalWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<XtermTerminal | null>(null);
  const initialized = useRef(false); // Flag to track if effect has already run

  useEffect(() => {
    // console.log('useTerminalWebSocket: Running');
    const authToken = token;
    const currentTerminalDiv = terminalRef.current; // Capture the ref value here

    // Prevent re-initialization in Strict Mode
    if (initialized.current) {
      // console.log('useTerminalWebSocket: Already initialized. Skipping (Strict Mode).');
      return;
    }

    if (!currentTerminalDiv || !authToken || !routerId) { // Use captured value
      // console.log('useTerminalWebSocket: Missing ref, authToken, or routerId. Returning.');
      return;
    }

    let term: XtermTerminal | null = null;
    let fitAddon: FitAddon | null = null;
    let ws: WebSocket | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // Delay initialization to allow DOM to settle
    const initTimeout = setTimeout(() => {
      // console.log('useTerminalWebSocket: Initializing Xterm and WebSocket');
      term = new XtermTerminal({
        cursorBlink: true,
        convertEol: true,
      });
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      if (currentTerminalDiv) { // Use captured value
        term.open(currentTerminalDiv);
        setTimeout(() => fitAddon?.fit(), 1); // Use optional chaining
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/api/terminal?routerId=${routerId}&token=${authToken}`;

      // console.log('useTerminalWebSocket: Connecting to WebSocket:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // console.log('WebSocket: Connected');
        term?.writeln('>>> Welcome to MikroTik Terminal <<<'); // Use optional chaining
        fitAddon?.fit(); // Use optional chaining
      };

      ws.onmessage = (event) => {
        term?.write(event.data); // Use optional chaining
      };

      ws.onclose = () => {
        // console.log('WebSocket: Disconnected');
        term?.writeln(''); // Use optional chaining
        term?.writeln('>>> DISCONNECTED <<<'); // Use optional chaining
      };

      ws.onerror = (err) => {
        console.error('WebSocket: Error', err);
        term?.writeln(''); // Use optional chaining
        if (err instanceof ErrorEvent) {
          term?.writeln(`>>> ERROR: ${err.message} <<<`); // Use optional chaining
        } else {
          term?.writeln('>>> ERROR: An unknown WebSocket error occurred <<<'); // Use optional chaining
        }
      }

      term.onData((data) => {
        if (ws?.readyState === WebSocket.OPEN) { // Use optional chaining
          ws.send(data);
        }
      });

      resizeObserver = new ResizeObserver(() => {
        // console.log('ResizeObserver: Resizing terminal');
        fitAddon?.fit(); // Use optional chaining
      });
      if (currentTerminalDiv) { // Use captured value
          resizeObserver.observe(currentTerminalDiv);
      }

      // Store instances in refs
      wsRef.current = ws;
      termRef.current = term;
      initialized.current = true; // Mark as initialized
    }, 100); // Delay initialization by 100ms

    return () => {
        // console.log('useTerminalWebSocket: Cleanup function running');
        // Delay cleanup to allow WebSocket to establish if it's a double invocation
        const cleanupTimeout = setTimeout(() => {
            if (currentTerminalDiv && resizeObserver) { // Use captured value
                resizeObserver.unobserve(currentTerminalDiv);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (termRef.current) {
                termRef.current.dispose();
                termRef.current = null;
            }
            initialized.current = false; // Reset flag on cleanup
            // console.log('useTerminalWebSocket: Cleanup complete');
        }, 200); // Delay cleanup by 200ms

        // Clear the initialization timeout if cleanup runs before it fires
        clearTimeout(initTimeout);
        clearTimeout(cleanupTimeout); // Clear cleanup timeout if effect re-runs
    };
  }, [terminalRef, routerId, token]); // Dependencies for the hook
};