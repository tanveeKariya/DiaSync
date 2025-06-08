import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast data structure
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Context type
interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Default values
const defaultContext: ToastContextType = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
};

// Create context
const ToastContext = createContext<ToastContextType>(defaultContext);

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// Custom hook to use toast
export const useToast = () => useContext(ToastContext);

// Individual toast component
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const typeClasses = {
    success: 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-100',
    error: 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:border-red-600 dark:text-red-100',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-100',
    info: 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-100',
  };

  return (
    <div 
      className={`flex items-center justify-between p-4 mb-3 border-l-4 rounded-r-md shadow-md ${typeClasses[toast.type]} animate-slideInRight`}
    >
      <div className="flex-1 mr-4">{toast.message}</div>
      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
        aria-label="Close toast"
      >
        <X size={18} />
      </button>
    </div>
  );
};

// Toaster component that displays all toasts
export const Toaster: React.FC = () => {
  // If ToastProvider is not used, create a minimal internal state
  const [internalToasts, setInternalToasts] = useState<Toast[]>([]);
  
  // Try to use context, fall back to internal state if needed
  let { toasts, removeToast } = useToast();
  
  // If context is empty (ToastProvider not used), use internal state
  if (toasts.length === 0 && toasts === defaultContext.toasts) {
    toasts = internalToasts;
    removeToast = (id: string) => {
      setInternalToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    };
  }

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toaster;