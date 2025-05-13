import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/DebugPanel.module.css';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  // Function to toggle the debug panel
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // Function to clear logs
  const clearLogs = (e) => {
    e.stopPropagation();
    setLogs([]);
  };

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current && isOpen) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // Override console methods to capture logs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Save original console methods
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    // Helper to format arguments
    const formatArgs = (args) => {
      return args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    };

    // Override console methods
    console.log = (...args) => {
      originalConsole.log(...args);
      setLogs(prev => [...prev, { type: 'log', content: formatArgs(args), time: new Date() }]);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      setLogs(prev => [...prev, { type: 'error', content: formatArgs(args), time: new Date() }]);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      setLogs(prev => [...prev, { type: 'warn', content: formatArgs(args), time: new Date() }]);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      setLogs(prev => [...prev, { type: 'info', content: formatArgs(args), time: new Date() }]);
    };

    // Restore original console methods on cleanup
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    };
  }, []);

  // Format timestamp
  const formatTime = (date) => {
    return date.toTimeString().split(' ')[0];
  };

  return (
    <>
      {/* Bug icon button */}
      <div className={styles.debugButton} onClick={togglePanel}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2l4 4 4-4"></path>
          <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
          <path d="M12 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
          <path d="M12 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
          <path d="M20 12h-4"></path>
          <path d="M4 12h4"></path>
          <path d="M16 5.5v-3.5"></path>
          <path d="M8 5.5v-3.5"></path>
          <path d="M16 18.5v3.5"></path>
          <path d="M8 18.5v3.5"></path>
        </svg>
      </div>

      {/* Debug panel */}
      {isOpen && (
        <div className={styles.debugPanel}>
          <div className={styles.debugHeader}>
            <h3>Debug Console</h3>
            <div className={styles.debugControls}>
              <button onClick={clearLogs} className={styles.clearButton}>Clear</button>
              <button onClick={togglePanel} className={styles.closeButton}>×</button>
            </div>
          </div>
          <div className={styles.debugContent} ref={logContainerRef}>
            {logs.length === 0 ? (
              <div className={styles.emptyState}>No logs yet</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`${styles.logEntry} ${styles[log.type]}`}>
                  <span className={styles.logTime}>{formatTime(log.time)}</span>
                  <pre className={styles.logContent}>{log.content}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DebugPanel;
