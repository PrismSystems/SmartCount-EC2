class NetworkService {
    private listeners: Array<(isOnline: boolean) => void> = [];
    private _isOnline = navigator.onLine;

    constructor() {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    private handleOnline = () => {
        this._isOnline = true;
        this.notifyListeners(true);
        console.log('Network: Online');
    };

    private handleOffline = () => {
        this._isOnline = false;
        this.notifyListeners(false);
        console.log('Network: Offline');
    };

    private notifyListeners(isOnline: boolean) {
        this.listeners.forEach(listener => listener(isOnline));
    }

    get isOnline(): boolean {
        return this._isOnline;
    }

    addListener(listener: (isOnline: boolean) => void) {
        this.listeners.push(listener);
    }

    removeListener(listener: (isOnline: boolean) => void) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    // Test actual connectivity with a lightweight request
    async testConnectivity(): Promise<boolean> {
        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const networkService = new NetworkService();