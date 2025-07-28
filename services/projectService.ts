

import type { Project, SymbolInfo, Discipline, PdfFile, Area, LinearMeasurement, MeasurementGroup, DaliNetwork, DaliDevice, EcdType, DaliNetworkTemplate } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const projectService = {
    async getProjects(): Promise<Project[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/projects`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to fetch projects');
            const projects = await response.json();
            
            // Ensure each project has all required arrays
            return projects.map(project => ({
                ...project,
                pdfs: project.pdfs || [],
                symbols: project.symbols || [],
                disciplines: project.disciplines || [],
                areas: project.areas || [],
                measurements: project.measurements || [],
                measurementGroups: project.measurementGroups || [],
                daliNetworks: project.daliNetworks || [],
                daliDevices: project.daliDevices || [],
                ecdTypes: project.ecdTypes || [],
                daliNetworkTemplates: project.daliNetworkTemplates || []
            }));
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    },

    async createProject(username: string, name: string, filesWithLevels: { file: File, level: string }[], templateId: string | null): Promise<Project> {
        try {
            // Create project
            const projectResponse = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, data: {} })
            });
            
            const project = await projectResponse.json();
            
            // Upload PDFs
            const pdfs = [];
            for (const { file, level } of filesWithLevels) {
                const formData = new FormData();
                formData.append('pdf', file);
                formData.append('projectId', project.id);
                formData.append('name', file.name);
                formData.append('level', level);
                
                const pdfResponse = await fetch(`${API_BASE_URL}/api/pdfs/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                    body: formData
                });
                
                const pdf = await pdfResponse.json();
                pdfs.push(pdf);
            }
            
            return { ...project, pdfs };
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    async saveProject(username: string, project: Project): Promise<void> {
        try {
            await fetch(`${API_BASE_URL}/api/projects/${project.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ data: project })
            });
        } catch (error) {
            console.error('Error saving project:', error);
        }
    },

    async getPdfData(pdfId: string): Promise<string | null> {
        try {
            console.log('Fetching PDF data for ID:', pdfId);
            
            const response = await fetch(`${API_BASE_URL}/api/pdfs/${pdfId}/download`, {
                headers: getAuthHeaders()
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                console.log('Response not OK:', response.status, response.statusText);
                return null;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('ArrayBuffer size:', arrayBuffer.byteLength);
            
            // Convert to base64
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            return `data:application/pdf;base64,${base64}`;
        } catch (error) {
            console.error('Error fetching PDF:', error);
            return null;
        }
    }
};
