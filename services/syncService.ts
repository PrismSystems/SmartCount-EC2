import { offlineService } from './offlineService';
import { networkService } from './networkService';
import { projectService } from './projectService';

class SyncService {
    private syncInProgress = false;
    private syncListeners: Array<(status: 'syncing' | 'synced' | 'error') => void> = [];

    constructor() {
        networkService.addListener(this.handleNetworkChange);
    }

    private handleNetworkChange = async (isOnline: boolean) => {
        if (isOnline && !this.syncInProgress) {
            await this.syncOfflineActions();
        }
    };

    async syncOfflineActions(): Promise<void> {
        if (this.syncInProgress || !networkService.isOnline) {
            return;
        }

        this.syncInProgress = true;
        this.notifyListeners('syncing');

        try {
            const actions = await offlineService.getQueuedActions();
            console.log(`Syncing ${actions.length} offline actions`);

            for (const action of actions.sort((a, b) => a.timestamp - b.timestamp)) {
                try {
                    await this.processAction(action);
                    await offlineService.removeAction(action.id);
                    console.log('Synced action:', action.type);
                } catch (error) {
                    console.error('Failed to sync action:', action, error);
                    // Could implement retry logic here
                }
            }

            this.notifyListeners('synced');
        } catch (error) {
            console.error('Sync failed:', error);
            this.notifyListeners('error');
        } finally {
            this.syncInProgress = false;
        }
    }

    private async processAction(action: any): Promise<void> {
        const username = localStorage.getItem('userEmail') || '';
        
        switch (action.type) {
            case 'CREATE_PROJECT':
                await projectService.createProject(username, action.data.name, action.data.data);
                break;
                
            case 'UPDATE_PROJECT':
                await projectService.updateProject(username, action.data.id, action.data.data);
                break;
                
            case 'DELETE_PROJECT':
                await projectService.deleteProject(username, action.data.id);
                break;
                
            case 'UPLOAD_PDF':
                // Handle PDF upload - would need to store file data in IndexedDB
                break;
                
            case 'DELETE_PDF':
                await projectService.deletePdfFromProject(username, action.data.projectId, action.data.pdfId);
                break;
                
            default:
                console.warn('Unknown action type:', action.type);
        }
    }

    private notifyListeners(status: 'syncing' | 'synced' | 'error') {
        this.syncListeners.forEach(listener => listener(status));
    }

    addSyncListener(listener: (status: 'syncing' | 'synced' | 'error') => void) {
        this.syncListeners.push(listener);
    }

    removeSyncListener(listener: (status: 'syncing' | 'synced' | 'error') => void) {
        this.syncListeners = this.syncListeners.filter(l => l !== listener);
    }

    get isSyncing(): boolean {
        return this.syncInProgress;
    }
}

export const syncService = new SyncService();