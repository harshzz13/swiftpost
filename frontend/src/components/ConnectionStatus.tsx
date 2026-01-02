import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show alert if already offline
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert) return null;

  return (
    <Alert className="fixed top-4 left-4 right-4 z-50 bg-red-50 border-red-200">
      <WifiOff className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        You're currently offline. Some features may not work properly.
      </AlertDescription>
    </Alert>
  );
}