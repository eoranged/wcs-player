import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/DebugPanel.module.css';

const DebugPanel = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const originalConsoleLog = useRef(null);
  const originalConsoleError = useRef(null);
  const originalConsoleWarn = useRef(null);
  const originalConsoleInfo = useRef(null);
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
    setLogs([]);
  };

  useEffect(() => {
    // Store original console methods
    originalConsoleLog.current = console.log;
    originalConsoleError.current = console.error;
    originalConsoleWarn.current = console.warn;
    originalConsoleInfo.current = console.info;

    // Override console methods to capture logs
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [...prevLogs, { type: 'log', message, timestamp: new Date() }]);
      originalConsoleLog.current(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [...prevLogs, { type: 'error', message, timestamp: new Date() }]);
      originalConsoleError.current(...args);
    };

    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [...prevLogs, { type: 'warn', message, timestamp: new Date() }]);
      originalConsoleWarn.current(...args);
    };

    console.info = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [...prevLogs, { type: 'info', message, timestamp: new Date() }]);
      originalConsoleInfo.current(...args);
    };

    // Restore original console methods on unmount
    return () => {
      console.log = originalConsoleLog.current;
      console.error = originalConsoleError.current;
      console.warn = originalConsoleWarn.current;
      console.info = originalConsoleInfo.current;
    };
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
          <button onClick={clearLogs} className={styles.clearButton} title="Clear logs">
            Clear
          </button>
          <button onClick={togglePanel} className={styles.closeButton} title="Close debug panel">
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
