const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: { id: string; email: string; isAdmin: boolean };
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

    async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: { id: string; email: string; isAdmin: boolean } }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data: AuthResponse & { user?: { id: string; email: string; isAdmin: boolean } } = await response.json();
            
            if (data.success && data.token && data.user) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', data.user.email);
                localStorage.setItem('isAdmin', data.user.isAdmin.toString());
                return { success: true, message: data.message, user: data.user };
            }
            
            return { success: data.success, message: data.message };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    },

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAdmin');
    },

    getCurrentUser(): string | null {
        return localStorage.getItem('currentUser');
    },

    isAdmin(): boolean {
        return localStorage.getItem('isAdmin') === 'true';
    },

    getAuthToken(): string | null {
        return localStorage.getItem('authToken');
    },

    saveCurrentUser(email: string): void {
        localStorage.setItem('currentUser', email);
    }
};
