
'use client';

import { useState, useEffect } from 'react';

// This component ensures that date formatting only runs on the client,
// preventing hydration errors caused by server/client timezone mismatches.
export default function ClientFormattedDate({ timestamp }: { timestamp: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This code runs only on the client, after the component has mounted
    setFormattedDate(new Date(timestamp).toLocaleString());
  }, [timestamp]);

  // Return a placeholder or null on the server and initial client render
  if (!formattedDate) {
    return <span className="text-xs italic">calculating...</span>;
  }

  return <span>{formattedDate}</span>;
}
