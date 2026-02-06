import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import syncService from '@/services/syncService';
import db from '@/db/FieldOpsDB';

export function SyncStatusBar() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Subscriptions
        const unsubState = syncService.subscribeToSyncState(setIsSyncing);

        // Poll for pending count
        const interval = setInterval(async () => {
            try {
                const pending = await db.getPendingActivities();
                setPendingCount(pending.length);
            } catch (e) {
                console.error("Failed to check pending", e);
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubState();
            clearInterval(interval);
        };
    }, []);

    const handleSync = async () => {
        if (!isOnline) return;
        setSyncError(null);
        try {
            const results = await syncService.sync();
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                setSyncError(`${failures.length} items failed`);
            }
        } catch (e) {
            setSyncError('Sync failed');
        }
    };

    if (isOnline && pendingCount === 0 && !syncError) {
        return null; // Hidden when nothing pending to upload
    }

    return (
        <div className={`
            sticky top-0 z-50 w-full px-4 py-2 flex items-center justify-between text-sm font-medium transition-colors duration-300
            ${!isOnline ? 'bg-red-600 text-white' : ''}
            ${isOnline && pendingCount > 0 ? 'bg-orange-100 text-orange-800' : ''}
            ${isOnline && isSyncing ? 'bg-blue-100 text-blue-800' : ''}
        `}>
            <div className="flex items-center gap-2">
                {!isOnline ? (
                    <>
                        <WifiOff className="h-4 w-4" />
                        <span>You're offline. Working in local mode.</span>
                    </>
                ) : isSyncing ? (
                    <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{pendingCount > 0 ? `Syncing ${pendingCount} items...` : 'Checking for updates...'}</span>
                    </>
                ) : syncError ? (
                    <>
                        <AlertCircle className="h-4 w-4" />
                        <span>{syncError}</span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="h-4 w-4" />
                        <span>{pendingCount} items waiting to sync</span>
                    </>
                )}
            </div>

            {isOnline && (
                <Button
                    variant={pendingCount > 0 ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 text-xs ${pendingCount > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                    onClick={handleSync}
                    disabled={isSyncing}
                >
                    {isSyncing ? 'Syncing...' : syncError ? 'Retry' : 'Sync Now'}
                </Button>
            )}
        </div>
    );
}
