const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-ec2-domain.com/api' 
  : 'http://localhost:3001/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  async register(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  async getProjects() {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: this.getAuthHeaders()
    });
    return response.json();
  }

  async createProject(name: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name, data })
    });
    return response.json();
  }

  async updateProject(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ data })
    });
    return response.json();
  }

  async uploadPdf(file: File) {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/pdfs/upload`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData
    });
    return response.json();
  }
}

export const apiService = new ApiService();