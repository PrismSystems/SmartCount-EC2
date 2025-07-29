

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
            
            // Create default project structure
            let projectData = {
                ...project,
                pdfs,
                symbols: [],
                disciplines: [{
                    id: `disc_electrical_${Date.now()}`,
                    name: 'Electrical',
                    parentId: null
                }],
                areas: [],
                measurements: [],
                measurementGroups: [],
                daliNetworks: [],
                daliDevices: [],
                ecdTypes: [],
                daliNetworkTemplates: []
            };
            
            // Apply template if provided
            if (templateId) {
                const projects = await this.getProjects();
                const template = projects.find(p => p.id === templateId);
                if (template) {
                    projectData = {
                        ...projectData,
                        disciplines: template.disciplines || projectData.disciplines,
                        ecdTypes: template.ecdTypes || [],
                        daliNetworkTemplates: template.daliNetworkTemplates || []
                    };
                }
            }
            
            // Save the initial project data
            await this.saveProject(username, projectData);
            
            return projectData;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    async saveProject(username: string, project: Project): Promise<void> {
        try {
            console.log('Saving project:', project.id, project.name);
            const response = await fetch(`${API_BASE_URL}/api/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: project })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save project: ${response.status} ${response.statusText}`);
            }
            
            console.log('Project saved successfully');
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
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
            
            // Convert to base64 safely for large files
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = '';
            const chunkSize = 8192; // Process in chunks to avoid stack overflow
            
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
                const chunk = uint8Array.slice(i, i + chunkSize);
                binary += String.fromCharCode.apply(null, Array.from(chunk));
            }
            
            const base64 = btoa(binary);
            return `data:application/pdf;base64,${base64}`;
        } catch (error) {
            console.error('Error fetching PDF:', error);
            return null;
        }
    },

    async addPdfsToProject(username: string, project: Project, filesWithLevels: { file: File, level: string }[]): Promise<Project> {
        try {
            // Upload PDFs
            const newPdfs = [];
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
                newPdfs.push(pdf);
            }
            
            // Return updated project with new PDFs
            return {
                ...project,
                pdfs: [...project.pdfs, ...newPdfs]
            };
        } catch (error) {
            console.error('Error adding PDFs to project:', error);
            throw error;
        }
    },

    async deleteProject(username: string, projectId: string): Promise<void> {
        try {
            console.log('Deleting project:', projectId);
            const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete project: ${response.status} ${response.statusText}`);
            }
            
            console.log('Project deleted successfully');
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    },

    async exportAllBackup(username: string): Promise<void> {
        try {
            const projects = await this.getProjects();
            const backup = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                username,
                projects
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smartcount-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    },

    async exportSingleProjectBackup(username: string, projectId: string): Promise<void> {
        try {
            const projects = await this.getProjects();
            const project = projects.find(p => p.id === projectId);
            if (!project) throw new Error('Project not found');
            
            const backup = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                username,
                type: 'single-project',
                project
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smartcount-project-${project.name}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error creating project backup:', error);
            throw error;
        }
    },

    async importAllBackup(username: string, file: File): Promise<{ success: boolean; message: string }> {
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            
            if (!backup.projects || !Array.isArray(backup.projects)) {
                return { success: false, message: 'Invalid backup file format' };
            }
            
            // This would require server-side implementation to restore all projects
            return { success: false, message: 'Full backup restore not implemented yet' };
        } catch (error) {
            console.error('Error importing backup:', error);
            return { success: false, message: 'Failed to parse backup file' };
        }
    },

    async importSingleProjectBackup(username: string, file: File): Promise<{ success: boolean; message: string }> {
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            
            if (!backup.project) {
                return { success: false, message: 'Invalid project backup file format' };
            }
            
            // This would require server-side implementation to restore the project
            return { success: false, message: 'Single project restore not implemented yet' };
        } catch (error) {
            console.error('Error importing project backup:', error);
            return { success: false, message: 'Failed to parse backup file' };
        }
    },
};
