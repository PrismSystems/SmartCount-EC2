const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: { id: string; email: string };
}

export const authService = {
    async register(email: string, password: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data: AuthResponse = await response.json();
            return { success: data.success, message: data.message };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    },

    async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data: AuthResponse = await response.json();
            
            if (data.success && data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', data.user!.email);
            }
            
            return { success: data.success, message: data.message };
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
    },

    saveCurrentUser(email: string): void {
        localStorage.setItem('currentUser', email);
    }
};
