import { apiService } from './apiService';

export const authService = {
    async register(email: string, password: string): Promise<{ success: boolean; message: string }> {
        try {
            const result = await apiService.register(email, password);
            return result;
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    },

    async login(email: string, password: string): Promise<{ success: boolean; message: string; token?: string }> {
        try {
            const result = await apiService.login(email, password);
            if (result.success && result.token) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('currentUser', email);
            }
            return result;
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    },

    getCurrentUser(): string | null {
        return localStorage.getItem('currentUser');
    },

    saveCurrentUser(email: string): void {
        localStorage.setItem('currentUser', email);
    },

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
};
