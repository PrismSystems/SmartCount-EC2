const API_BASE = '/api';

export const authService = {
    async register(email: string, password: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    },

    async login(email: string, password: string): Promise<{ success: boolean; message: string; token?: string }> {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            
            if (result.success && result.token) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('currentUser', result.user.email);
            }
            
            return result;
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    },

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    },

    getCurrentUser(): string | null {
        return localStorage.getItem('currentUser');
    },

    getAuthToken(): string | null {
        return localStorage.getItem('authToken');
    }
};
