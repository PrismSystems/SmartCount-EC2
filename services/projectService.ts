

import type { Project, SymbolInfo, Discipline, PdfFile, Area, LinearMeasurement, MeasurementGroup, DaliNetwork, DaliDevice, EcdType, DaliNetworkTemplate } from '../types';

const API_BASE = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const projectService = {
    async getProjects(): Promise<Project[]> {
        const response = await fetch(`${API_BASE}/projects`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        return await response.json();
    },

    async createProject(name: string, filesWithLevels: { file: File, level: string }[], templateId: string | null): Promise<Project> {
        // Upload PDFs first
        const pdfPromises = filesWithLevels.map(async ({ file, level }) => {
            const fileData = await this.fileToBase64(file);
            const uploadResponse = await fetch(`${API_BASE}/pdfs/upload`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: fileData.split(',')[1], // Remove data:... prefix
                    contentType: file.type
                })
            });
            const { fileId } = await uploadResponse.json();
            return { id: fileId, name: file.name, level };
        });

        const pdfs = await Promise.all(pdfPromises);
        
        const projectData = {
            name,
            pdfs,
            symbols: [],
            disciplines: [],
            // ... other project data
        };

        const response = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, data: projectData })
        });

        return await response.json();
    },

    async saveProject(project: Project): Promise<void> {
        await fetch(`${API_BASE}/projects/${project.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ data: project })
        });
    },

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
};
