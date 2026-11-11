import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

// Parses command string into tokens, supporting double and single quotes
function parseCommandLine(text) {
  const tokens = [];
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== undefined) {
      tokens.push(match[1]);
    } else if (match[2] !== undefined) {
      tokens.push(match[2]);
    } else {
      tokens.push(match[0]);
    }
  }
  return tokens;
}

function Terminal() {
  const termRef = useRef(null);
  const xtermInstance = useRef(null);
  const wsRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 1. Initialize XTerm instance
    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'Consolas, "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0f172a', // Slate 900
        foreground: '#f8fafc', // Slate 50
        cursor: '#38bdf8',     // Sky 400
      },
    });
    xtermInstance.current = term;

    const printPrompt = () => {
      term.write('\r\n\x1b[1;32mredis>\x1b[0m ');
    };

    const handleResponse = (data) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (data.error) {
        term.write(`\x1b[1;31m(error) ${data.error}\x1b[0m\r\n`);
      } else if (data.resp === null || data.resp === undefined) {
        term.write('\x1b[33m(nil)\x1b[0m\r\n');
      } else if (typeof data.resp === 'number') {
        term.write(`\x1b[32m(integer) ${data.resp}\x1b[0m\r\n`);
      } else if (typeof data.resp === 'object') {
        const formatted = JSON.stringify(data.resp, null, 2).replace(/\n/g, '\r\n');
        term.write(formatted + '\r\n');
      } else {
        term.write(`\x1b[36m"${data.resp}"\x1b[0m\r\n`);
      }
      term.write('\x1b[1;32mredis>\x1b[0m ');
    };

    if (termRef.current) {
      term.open(termRef.current);
      term.writeln('\x1b[1;36m=== RedisRift Interactive Web Terminal ===\x1b[0m');
      term.writeln('Type commands: \x1b[33mPING\x1b[0m, \x1b[33mSET mykey "hello"\x1b[0m, \x1b[33mGET mykey\x1b[0m, \x1b[33mDEL mykey\x1b[0m');
      term.write('\r\n\x1b[90mConnecting to bridge...\x1b[0m');
    }

    // 2. Connect to Bridge WebSocket
    const connectWs = () => {
      const wsUrl = `ws://${window.location.hostname || 'localhost'}:8000/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        term.writeln('\r\x1b[32m[Connected to RedisRift Bridge]\x1b[0m');
        printPrompt();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleResponse(data);
        } catch {
          term.write(`${event.data}\r\n\x1b[1;32mredis>\x1b[0m `);
        }
      };

      ws.onclose = () => {
        setStatus('fallback');
        // Do not spam terminal with retry messages, just use HTTP fallback
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setStatus('fallback');
      };
    };

    connectWs();

    // 3. Handle Keyboard Input
    let inputBuffer = '';

    const executeCommand = async (tokens) => {
      // If WebSocket is open, send via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ cmd: tokens }));

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          term.write('\x1b[1;31m(error) Request timed out. Ensure mini_redis.exe is running on port 6379.\x1b[0m\r\n');
          term.write('\x1b[1;32mredis>\x1b[0m ');
        }, 3000);
        return;
      }

      // Seamless HTTP fallback if WebSocket is not open
      try {
        const host = window.location.hostname || 'localhost';
        const res = await fetch(`http://${host}:8000/api/cmd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: tokens }),
        });
        const data = await res.json();
        handleResponse(data);
      } catch (err) {
        term.write(`\x1b[1;31m(error) Failed to reach bridge (http://localhost:8000): ${err.message}\x1b[0m\r\n`);
        term.write('\x1b[1;32mredis>\x1b[0m ');
      }
    };

    const disposable = term.onData((data) => {
      // Enter Key
      if (data === '\r') {
        term.write('\r\n');
        const trimmed = inputBuffer.trim();
        inputBuffer = '';

        if (!trimmed) {
          term.write('\x1b[1;32mredis>\x1b[0m ');
          return;
        }

        const tokens = parseCommandLine(trimmed);
        if (tokens.length === 0) {
          term.write('\x1b[1;32mredis>\x1b[0m ');
          return;
        }

        executeCommand(tokens);
        return;
      }

      // Backspace Key
      if (data === '\u007f' || data === '\b') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Ctrl + C (Cancel current line)
      if (data === '\u0003') {
        inputBuffer = '';
        term.write('^C\r\n\x1b[1;32mredis>\x1b[0m ');
        return;
      }

      // Ctrl + L (Clear screen)
      if (data === '\u000c') {
        term.clear();
        term.write('\x1b[1;32mredis>\x1b[0m ' + inputBuffer);
        return;
      }

      // Printable Characters
      if (data.length === 1 && data >= ' ') {
        inputBuffer += data;
        term.write(data);
      }
    });

    // Cleanup on component unmount
    return () => {
      disposable.dispose();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      term.dispose();
    };
  }, []);

  const clearTerminal = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      xtermInstance.current.write('\x1b[1;32mredis>\x1b[0m ');
    }
  };

  const focusTerminal = () => {
    if (xtermInstance.current) {
      xtermInstance.current.focus();
    }
  };

  return (
    <div
      onClick={focusTerminal}
      className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden cursor-text"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 select-none">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          <span className="text-sm font-semibold text-slate-200 ml-2">Redis CLI Terminal</span>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              status === 'connected'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : status === 'fallback'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            ● {status === 'connected' ? 'Connected (WS)' : status === 'fallback' ? 'HTTP Mode Active' : 'Connecting...'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearTerminal();
            }}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="p-3">
        <div
          ref={termRef}
          className="w-full"
          style={{ minHeight: '280px' }}
        />
      </div>
    </div>
  );
}

export default Terminal;
