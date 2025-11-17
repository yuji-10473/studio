'use client';

import { useEffect } from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { errorEmitter } from '@/firebase/error-emitter';

// This component is only active in development to surface permission errors.
export function FirebaseErrorListener() {
  const handleError = useErrorHandler();

  useEffect(() => {
    const handlePermissionError = (error: Error) => {
      // Use the error boundary to display the error overlay
      handleError(error);
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [handleError]);

  // This component does not render anything itself
  return null;
}
