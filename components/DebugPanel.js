import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/DebugPanel.module.css';

// Store console logs globally to persist between component mounts
let globalLogs = [];
let consoleOverrideApplied = false;

// Override console methods at module level
if (typeof window !== 'undefined' && !consoleOverrideApplied) {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
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
    const message = formatArgs(args);
    globalLogs.push({ type: 'log', message, timestamp: new Date() });
    originalConsole.log(...args);
  };

  console.error = (...args) => {
    const message = formatArgs(args);
    globalLogs.push({ type: 'error', message, timestamp: new Date() });
    originalConsole.error(...args);
  };

  console.warn = (...args) => {
    const message = formatArgs(args);
    globalLogs.push({ type: 'warn', message, timestamp: new Date() });
    originalConsole.warn(...args);
  };

  console.info = (...args) => {
    const message = formatArgs(args);
    globalLogs.push({ type: 'info', message, timestamp: new Date() });
    originalConsole.info(...args);
  };

  // Limit the number of logs to prevent memory issues
  setInterval(() => {
    if (globalLogs.length > 1000) {
      globalLogs = globalLogs.slice(-1000);
    }
  }, 10000);

  consoleOverrideApplied = true;
}

const DebugPanel = ({ onClose }) => {
  const [logs, setLogs] = useState(globalLogs);
  const [isOpen, setIsOpen] = useState(true);
  const logContainerRef = useRef(null);

  // Toggle panel visibility
  const togglePanel = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      if (onClose) onClose();
    }
  };

  // Clear logs
  const clearLogs = () => {
    globalLogs = [];
    setLogs([]);
  };

  // Copy logs to clipboard
  const copyLogs = () => {
    if (logs.length === 0) return;
    
    // Format logs for clipboard
    const formattedLogs = logs.map(log => {
      const time = formatTime(log.timestamp);
      const type = log.type.toUpperCase();
      return `[${time}] [${type}] ${log.message}`;
    }).join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(formattedLogs)
      .then(() => {
        // Show temporary success message
        const tempMessage = { 
          type: 'info', 
          message: 'Logs copied to clipboard!', 
          timestamp: new Date() 
        };
        setLogs(prevLogs => [...prevLogs, tempMessage]);
      })
      .catch(err => {
        console.error('Failed to copy logs:', err);
      });
  };

  // Update logs state when global logs change
  useEffect(() => {
    const updateLogs = () => {
      setLogs([...globalLogs]);
    };
    
    // Update logs immediately
    updateLogs();
    
    // Set up an interval to update logs periodically
    const intervalId = setInterval(updateLogs, 500);
    
    return () => clearInterval(intervalId);
  }, []);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logContainerRef.current && isOpen) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div className={styles.debugPanel}>
      <div className={styles.debugHeader}>
        <h3>Debug Console</h3>
        <div className={styles.debugControls}>
          <button onClick={copyLogs} className={styles.iconButton} title="Copy logs to clipboard" aria-label="Copy logs to clipboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button onClick={clearLogs} className={styles.iconButton} title="Clear logs" aria-label="Clear logs">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button onClick={togglePanel} className={styles.closeButton} title="Close debug panel" aria-label="Close debug panel">
            ×
          </button>
        </div>
      </div>
      <div className={styles.debugContent} ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className={styles.emptyState}>No logs to display</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`${styles.logEntry} ${styles[log.type]}`}>
              <span className={styles.timestamp}>{formatTime(log.timestamp)}</span>
              <pre className={styles.logMessage}>{log.message}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
