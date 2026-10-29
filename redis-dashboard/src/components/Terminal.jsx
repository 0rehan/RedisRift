import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

// Simple placeholder terminal component
function Terminal() {
  const termRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cols: 80,
      rows: 24,
      cursorBlink: true,
    });
    // Attach terminal to the DOM element
    if (termRef.current) {
      term.open(termRef.current);
      term.writeln('Welcome to RedisRift Dashboard');
      term.writeln('');
    }
    // Cleanup on unmount
    return () => {
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={termRef}
      style={{ width: '100%', height: '300px', backgroundColor: '#000' }}
    />
  );
}

export default Terminal;

