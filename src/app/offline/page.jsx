'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, Home, Download } from 'lucide-react';
import { useDownload } from '@/context/DownloadContext';

export default function OfflinePage() {
  const router = useRouter();
  const { downloadCount } = useDownload();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">You're Offline</h1>
        <p className="text-xl text-gray-400 mb-8">
          This page is not available offline. Please check your connection.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
          
          {downloadCount > 0 && (
            <button
              onClick={() => router.push('/downloads')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              View Downloads ({downloadCount})
            </button>
          )}
        </div>

        <div className="mt-12 p-4 rounded-xl bg-blue-900/30 border border-blue-800">
          <h3 className="font-semibold text-blue-100 mb-2 text-sm">
            💡 Tip: Download for Offline Listening
          </h3>
          <p className="text-xs text-blue-300">
            Download your favorite songs when online to enjoy them anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
