'use client';

import { useEffect } from 'react';

// The deployed Cognito client already allows the origin root as its callback.
// Keep that contract while the workspace now lives at /login/.
export default function AuthCallback() {
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.has('code') || query.has('error')) {
      location.replace('/login/' + location.search + location.hash);
    }
  }, []);
  return null;
}
