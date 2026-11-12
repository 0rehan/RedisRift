import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

const REDIS_COMMANDS = [
  'PING',
  'SET',
  'GET',
  'DEL',
  'EXPIRE',
  'ECHO',
  'KEYS',
  'INFO',
  'DBSIZE',
  'CLEAR',
];

const QUICK_COMMANDS = [
  { label: 'PING', cmd: 'PING' },
  { label: 'SET', cmd: 'SET ' },
  { label: 'GET', cmd: 'GET ' },
  { label: 'DEL', cmd: 'DEL ' },
  { label: 'KEYS *', cmd: 'KEYS *' },
  { label: 'DBSIZE', cmd: 'DBSIZE' },
  { label: 'INFO', cmd: 'INFO' },
];

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

  // Command History tracking
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  // Ref for injecting quick commands into the terminal input buffer
  const inputBufferRef = useRef('');

  useEffect(() => {
    if (!termRef.current) return;
    termRef.current.innerHTML = '';

    // 1. Initialize XTerm instance
    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'Consolas, "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0c1021',
        foreground: '#e2e8f0',
        cursor: '#f43f5e',
        selectionBackground: 'rgba(244, 63, 94, 0.3)',
        black: '#1e293b',
        red: '#f43f5e',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e2e8f0',
        brightBlack: '#475569',
        brightRed: '#fb7185',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
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

    term.open(termRef.current);
    term.writeln('\x1b[1;36m=== RedisRift Interactive Web Terminal ===\x1b[0m');
    term.writeln('Shortcuts: \x1b[33m↑/↓\x1b[0m for history, \x1b[33mTab\x1b[0m for autocomplete, \x1b[33mCtrl+L\x1b[0m to clear');
    term.write('\r\n\x1b[90mConnecting to bridge...\x1b[0m');

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
      if (data === '\r' || data === '\n') {
        term.write('\r\n');
        const trimmed = inputBuffer.trim();
        inputBuffer = '';
        inputBufferRef.current = '';

        if (!trimmed) {
          term.write('\x1b[1;32mredis>\x1b[0m ');
          return;
        }

        // Add to command history
        if (
          historyRef.current.length === 0 ||
          historyRef.current[historyRef.current.length - 1] !== trimmed
        ) {
          historyRef.current.push(trimmed);
        }
        historyIndexRef.current = historyRef.current.length;

        // Custom local commands (e.g. CLEAR)
        if (trimmed.toUpperCase() === 'CLEAR') {
          term.clear();
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

      // Tab Key (Autocomplete)
      if (data === '\t') {
        const currentTrim = inputBuffer.trimStart();
        if (currentTrim && !currentTrim.includes(' ')) {
          const upper = currentTrim.toUpperCase();
          const match = REDIS_COMMANDS.find((c) => c.startsWith(upper));
          if (match) {
            inputBuffer = match + ' ';
            inputBufferRef.current = inputBuffer;
            term.write('\r\x1b[K\x1b[1;32mredis>\x1b[0m ' + inputBuffer);
          }
        }
        return;
      }

      // Up Arrow: History backward
      if (data === '\x1b[A') {
        if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
          historyIndexRef.current -= 1;
          inputBuffer = historyRef.current[historyIndexRef.current];
          inputBufferRef.current = inputBuffer;
          term.write('\r\x1b[K\x1b[1;32mredis>\x1b[0m ' + inputBuffer);
        }
        return;
      }

      // Down Arrow: History forward
      if (data === '\x1b[B') {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current += 1;
          inputBuffer = historyRef.current[historyIndexRef.current];
          inputBufferRef.current = inputBuffer;
          term.write('\r\x1b[K\x1b[1;32mredis>\x1b[0m ' + inputBuffer);
        } else if (historyIndexRef.current === historyRef.current.length - 1) {
          historyIndexRef.current = historyRef.current.length;
          inputBuffer = '';
          inputBufferRef.current = '';
          term.write('\r\x1b[K\x1b[1;32mredis>\x1b[0m ');
        }
        return;
      }

      // Backspace Key
      if (data === '\u007f' || data === '\b') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          inputBufferRef.current = inputBuffer;
          term.write('\b \b');
        }
        return;
      }

      // Ctrl + C (Cancel current line)
      if (data === '\u0003') {
        inputBuffer = '';
        inputBufferRef.current = '';
        historyIndexRef.current = historyRef.current.length;
        term.write('^C\r\n\x1b[1;32mredis>\x1b[0m ');
        return;
      }

      // Ctrl + L (Clear screen)
      if (data === '\u000c') {
        term.clear();
        term.write('\x1b[1;32mredis>\x1b[0m ' + inputBuffer);
        return;
      }

      // Printable Characters (ignores other unhandled ANSI sequences starting with \x1b)
      if (!data.startsWith('\x1b') && data >= ' ') {
        inputBuffer += data;
        inputBufferRef.current = inputBuffer;
        term.write(data);
      }
    });

    // Cleanup on component unmount
    return () => {
      disposable.dispose();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      term.dispose();
      if (termRef.current) termRef.current.innerHTML = '';
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

  const insertQuickCommand = (cmd) => {
    if (!xtermInstance.current) return;
    const term = xtermInstance.current;
    // Clear current input line and write the quick command
    term.write('\r\x1b[K\x1b[1;32mredis>\x1b[0m ' + cmd);
    inputBufferRef.current = cmd;
    // We need to sync inputBuffer inside the onData closure.
    // The simplest way: write it char by char through the terminal's input handler.
    // Instead, we clear and re-write — the inputBufferRef is used indirectly.
    // Since inputBuffer is local to the useEffect closure, we simulate by
    // clearing and typing the command into the terminal.
    // Actually let's just clear and type it:
    term.write('\r\x1b[K\x1b[1;32mredis>\x1b[0m ');
    // Feed the command text into the terminal data handler
    for (const ch of cmd) {
      term.input(ch);
    }
    term.focus();
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Interactive CLI
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Execute raw Redis commands with full RESP protocol support
          </p>
        </div>
      </div>

      {/* Terminal Card — gradient border + frosted glass */}
      <div className="relative group">
        {/* Gradient border wrapper */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-rose-500/30 via-purple-500/20 to-cyan-500/30 rounded-2xl blur-[1px] opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

        <div
          onClick={focusTerminal}
          className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.06] overflow-hidden cursor-text"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60 backdrop-blur-sm border-b border-white/[0.06] select-none">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57] inline-block shadow-[0_0_6px_rgba(255,95,87,0.4)]"></span>
              <span className="w-3 h-3 rounded-full bg-[#febc2e] inline-block shadow-[0_0_6px_rgba(254,188,46,0.4)]"></span>
              <span className="w-3 h-3 rounded-full bg-[#28c840] inline-block shadow-[0_0_6px_rgba(40,200,64,0.4)]"></span>
              <div className="flex items-center ml-3 gap-1.5">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3M5.25 20.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-sm font-mono font-medium text-slate-300 tracking-wide">
                  RedisRift CLI
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 transition-colors duration-300 ${
                  status === 'connected'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                    : status === 'fallback'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/25 shadow-[0_0_8px_rgba(244,63,94,0.1)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : status === 'fallback'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400 animate-pulse'
                }`} />
                {status === 'connected' ? 'WebSocket' : status === 'fallback' ? 'HTTP Fallback' : 'Connecting…'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearTerminal();
                }}
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83a1.125 1.125 0 011.59 0l6.375 6.375a1.125 1.125 0 010 1.59l-6.375 6.375a1.125 1.125 0 01-1.59 0z" />
                </svg>
                Clear
              </button>
            </div>
          </div>

          {/* Quick Commands strip */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/30 border-b border-white/[0.04] select-none overflow-x-auto">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium shrink-0">Quick:</span>
            {QUICK_COMMANDS.map(({ label, cmd }) => (
              <button
                key={label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  insertQuickCommand(cmd);
                }}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-rose-300 hover:border-rose-500/30 hover:bg-rose-500/[0.08] transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Terminal Viewport */}
          <div className="p-4" style={{ boxShadow: 'inset 0 8px 16px -4px rgba(0,0,0,0.3)' }}>
            <div
              ref={termRef}
              className="w-full"
              style={{ minHeight: '320px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terminal;
