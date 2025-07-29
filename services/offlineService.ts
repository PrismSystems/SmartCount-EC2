interface OfflineAction {
    id: string;
    type: 'CREATE_PROJECT' | 'UPDATE_PROJECT' | 'DELETE_PROJECT' | 'UPLOAD_PDF' | 'DELETE_PDF';
    data: any;
    timestamp: number;
    retryCount: number;
}

class OfflineService {
    private dbName = 'smartcount-offline';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Store for offline actions queue
                if (!db.objectStoreNames.contains('offlineActions')) {
                    const actionStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
                    actionStore.createIndex('timestamp', 'timestamp');
                }
                
                // Store for cached data
                if (!db.objectStoreNames.contains('cachedProjects')) {
                    db.createObjectStore('cachedProjects', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('cachedPdfs')) {
                    db.createObjectStore('cachedPdfs', { keyPath: 'id' });
                }
            };
        });
    }

    async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
        if (!this.db) await this.init();
        
        const offlineAction: OfflineAction = {
            ...action,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            retryCount: 0
        };
        
        const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');
        await store.add(offlineAction);
        
        console.log('Queued offline action:', offlineAction);
    }

    async getQueuedActions(): Promise<OfflineAction[]> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['offlineActions'], 'readonly');
            const store = transaction.objectStore('offlineActions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeAction(actionId: string): Promise<void> {
        if (!this.db) await this.init();
        
        const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
        const store = transaction.objectStore('offlineActions');
        await store.delete(actionId);
    }

    async cacheProject(project: any): Promise<void> {
        if (!this.db) await this.init();
        
        const transaction = this.db!.transaction(['cachedProjects'], 'readwrite');
        const store = transaction.objectStore('cachedProjects');
        await store.put({ ...project, cachedAt: Date.now() });
    }

    async getCachedProjects(): Promise<any[]> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['cachedProjects'], 'readonly');
            const store = transaction.objectStore('cachedProjects');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async cachePdfData(pdfId: string, data: ArrayBuffer): Promise<void> {
        if (!this.db) await this.init();
        
        const transaction = this.db!.transaction(['cachedPdfs'], 'readwrite');
        const store = transaction.objectStore('cachedPdfs');
        await store.put({ id: pdfId, data, cachedAt: Date.now() });
    }

    async getCachedPdfData(pdfId: string): Promise<ArrayBuffer | null> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['cachedPdfs'], 'readonly');
            const store = transaction.objectStore('cachedPdfs');
            const request = store.get(pdfId);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

export const offlineService = new OfflineService();