```typescript
import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/Toaster';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useToast();

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        
        if (options.successMessage) {
          addToast(options.successMessage, 'success');
        }
        
        options.onSuccess?.(result);
        return result;
      } catch (err: any) {
        setError(err);
        
        const errorMessage = options.errorMessage || 
          err.response?.data?.message ||
          err.message ||
          'An error occurred';
          
        addToast(errorMessage, 'error');
        options.onError?.(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, options, addToast]
  );

  return {
    execute,
    isLoading,
    error,
  };
}
```