import React, { useState, useEffect } from 'react';
import { networkService } from '../services/networkService';
import { syncService } from '../services/syncService';

export const SyncStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(networkService.isOnline);
    const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error' | null>(null);

    useEffect(() => {
        const handleNetworkChange = (online: boolean) => {
            setIsOnline(online);
        };

        const handleSyncStatus = (status: 'syncing' | 'synced' | 'error') => {
            setSyncStatus(status);
            if (status === 'synced' || status === 'error') {
                setTimeout(() => setSyncStatus(null), 3000);
            }
        };

        networkService.addListener(handleNetworkChange);
        syncService.addSyncListener(handleSyncStatus);

        return () => {
            networkService.removeListener(handleNetworkChange);
            syncService.removeSyncListener(handleSyncStatus);
        };
    }, []);

    const getStatusColor = () => {
        if (!isOnline) return 'bg-red-500';
        if (syncStatus === 'syncing') return 'bg-yellow-500';
        if (syncStatus === 'synced') return 'bg-green-500';
        if (syncStatus === 'error') return 'bg-red-500';
        return 'bg-green-500';
    };

    const getStatusText = () => {
        if (!isOnline) return 'Offline';
        if (syncStatus === 'syncing') return 'Syncing...';
        if (syncStatus === 'synced') return 'Synced';
        if (syncStatus === 'error') return 'Sync Error';
        return 'Online';
    };

    return (
        <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="text-gray-600">{getStatusText()}</span>
            {!isOnline && (
                <span className="text-xs text-gray-500">(Changes saved locally)</span>
            )}
        </div>
    );
};