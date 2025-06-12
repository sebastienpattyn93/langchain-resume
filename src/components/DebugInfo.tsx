'use client';

import { useEffect, useState } from 'react';

export default function DebugInfo() {
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    // Store original console.error
    const originalError = console.error;
    
    // Override console.error to capture errors
    console.error = (...args: unknown[]) => {
      setErrors(prev => [...prev, args.map(arg => String(arg)).join(' ')]);
      originalError(...args);
    };
    
    // Restore on cleanup
    return () => {
      console.error = originalError;
    };
  }, []);
  
  if (errors.length === 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.8)',
      color: 'red',
      padding: '10px',
      maxHeight: '200px',
      overflowY: 'auto',
      width: '100%',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h4>Debug Info:</h4>
      <ul>
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
}
