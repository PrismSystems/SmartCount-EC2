

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { PdfViewer } from './components/PdfViewer';
import { exportExcelWithSchedule } from './services/excelExportService';
import { projectService } from './services/projectService';
import type { SymbolInfo, Location, Discipline, Project, PdfFile, Area, LinearMeasurement, ScaleInfo, ManualEntry, MeasurementGroup, DaliNetwork, DaliDevice, DaliDeviceType, EcdType, DaliNetworkTemplate, PsuLocation } from './types';
import { ProjectScreen } from './components/ProjectScreen';
import { CopySymbolModal } from './components/CopySymbolModal';
import { AddPdfsModal } from './components/AddPdfsModal';
import { AuthScreen } from './components/AuthScreen';
import { authService } from './services/authService';
import { ExportExcelModal } from './components/ExportExcelModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { ReassignSymbolModal } from './components/ReassignSymbolModal';
import { AreaNamingModal } from './components/AreaNamingModal';
import { CountsTableModal } from './components/CountsTableModal';
import { ScaleModal } from './components/ScaleModal';
import { ManualLengthModal } from './components/ManualLengthModal';
import { LinearComponentModal } from './components/LinearComponentModal';
import { exportMarkedUpPdf, exportDaliPdf } from './services/pdfExportService';
import { LINEAR_DISCIPLINE_NAME } from './constants';
import { EcdTypeAssignModal } from './components/EcdTypeAssignModal';
import { EcdScheduleModal } from './components/EcdScheduleModal';
import { PsuLocationModal } from './components/PsuLocationModal';
import { SyncStatus } from './components/SyncStatus';
import { syncService } from './services/syncService';
import { offlineService } from './services/offlineService';

const PIN_SIZE = 8; // base size in unscaled units for location pins

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(() => authService.getCurrentUser());
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activePdfId, setActivePdfId] = useState<string | null>(null);
    const [activePdfData, setActivePdfData] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSymbolId, setActiveSymbolId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [activeDisciplineId, setActiveDisciplineId] = useState<string | null>(null);
    
    const [mode, setMode] = useState<'idle' | 'selecting_manual' | 'placing_dots' | 'drawing_area' | 'setting_scale' | 'drawing_measurement' | 'placing_dali_device' | 'selecting_dali_painter_source' | 'painting_dali_device' | 'placing_dali_psu' | 'painting_dali_psu_location'>('idle');
    const [symbolToCopy, setSymbolToCopy] = useState<SymbolInfo | null>(null);
    const [pinToReassign, setPinToReassign] = useState<{ symbolId: string; locationIndex: number } | null>(null);
    const [filesToAdd, setFilesToAdd] = useState<File[] | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
    const [isNamingArea, setIsNamingArea] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<{x: number, y: number}[]>([]);
    const [isCountsTableOpen, setIsCountsTableOpen] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingDaliPdf, setIsExportingDaliPdf] = useState(false);

    // Measurement State
    const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
    const [scaleCalibrationLine, setScaleCalibrationLine] = useState<{x: number, y: number}[] | null>(null);
    const [activeDrawingMeasurementId, setActiveDrawingMeasurementId] = useState<string | null>(null);
    const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
    const [editingManualEntry, setEditingManualEntry] = useState<{measurementId: string; segmentIndex: number; pointIndex: number; entryId?: string;} | null>(null);
    const [isLinearComponentModalOpen, setIsLinearComponentModalOpen] = useState(false);
    const [linearComponentCreationPoint, setLinearComponentCreationPoint] = useState<{x:number, y:number} | null>(null);
    const [draggedMeasurementNode, setDraggedMeasurementNode] = useState<{
        measurementId: string;
        segmentIndex: number;
        pointIndex: number;
    } | null>(null);
    const [pdfOpacity, setPdfOpacity] = useState(1);
    
    // DALI State
    const [activeDaliPlacement, setActiveDaliPlacement] = useState<{ networkId: string; deviceType: DaliDeviceType } | null>(null);
    const [editingEcdDevice, setEditingEcdDevice] = useState<DaliDevice | null>(null);
    const [isEcdScheduleModalOpen, setIsEcdScheduleModalOpen] = useState(false);
    const [hoveredDaliNetworkId, setHoveredDaliNetworkId] = useState<string | null>(null);
    const [daliDeviceToPaint, setDaliDeviceToPaint] = useState<{
        networkId: string;
        deviceType: DaliDeviceType;
        ecdTypeId?: string;
    } | null>(null);
    const [daliPsuLocationToPaint, setDaliPsuLocationToPaint] = useState<string | null>(null);
    const [showDaliLabels, setShowDaliLabels] = useState(true);
    const [activeDaliPsuPlacementNetworkId, setActiveDaliPsuPlacementNetworkId] = useState<string | null>(null);
    const [editingPsuNetwork, setEditingPsuNetwork] = useState<DaliNetwork | null>(null);

    // Undo/Redo State
    const [undoStack, setUndoStack] = useState<Project[]>([]);
    const [redoStack, setRedoStack] = useState<Project[]>([]);

    const activeProject = useMemo(() => {
        try {
            if (!Array.isArray(projects) || !activeProjectId) return undefined;
            const project = projects.find(p => p.id === activeProjectId);
            console.log('Active project found:', project);
            
            // Ensure the project has all required arrays
            if (project) {
                return {
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
                };
            }
            return undefined;
        } catch (error) {
            console.error('Error in activeProject memo:', error);
            return undefined;
        }
    }, [projects, activeProjectId]);
    const activePdfMetadata = useMemo(() => {
        try {
            if (!activeProject || !Array.isArray(activeProject.pdfs)) return undefined;
            return activeProject.pdfs.find(p => p.id === activePdfId);
        } catch (error) {
            console.error('Error in activePdfMetadata memo:', error);
            return undefined;
        }
    }, [activeProject, activePdfId]);

    const commitUpdate = (newProjectState: Project, fromUndoRedo: boolean = false) => {
        if (!fromUndoRedo && activeProject) {
            setUndoStack(prev => [...prev.slice(-29), activeProject]); // Keep last 30 states
            setRedoStack([]);
        }
        setProjects(prev => prev.map(p => (p.id === newProjectState.id ? newProjectState : p)));
    };

    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return;

        const newUndoStack = [...undoStack];
        const lastState = newUndoStack.pop();

        if (lastState && activeProject) {
            setRedoStack(prev => [...prev, activeProject]);
            commitUpdate(lastState, true);
            setUndoStack(newUndoStack);
        }
    }, [undoStack, activeProject]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;

        const newRedoStack = [...redoStack];
        const nextState = newRedoStack.pop();

        if (nextState && activeProject) {
            setUndoStack(prev => [...prev, activeProject]);
            commitUpdate(nextState, true);
            setRedoStack(newRedoStack);
        }
    }, [redoStack, activeProject]);
    
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

            // Shortcuts for when an action is in progress (e.g., drawing)
            if (mode !== 'idle') {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    if (mode === 'drawing_area' && drawingPoints.length > 2 && e.key === 'Enter') {
                        handleFinishAreaDrawing();
                    } else if (mode === 'setting_scale' && drawingPoints.length >= 2 && e.key === 'Enter') {
                        handleFinishScaleLine();
                    } else if (mode === 'drawing_measurement' && drawingPoints.length >= 2 && e.key === 'Enter') {
                        handleSaveMeasurement();
                    } else {
                        // General cancel/finish action
                        setMode('idle');
                        setDrawingPoints([]);
                        setActiveDrawingMeasurementId(null);
                        setActiveDaliPlacement(null);
                        setDaliDeviceToPaint(null);
                        setActiveDaliPsuPlacementNetworkId(null);
                        setDaliPsuLocationToPaint(null);
                    }
                }
                return; // Don't process other shortcuts while in a specific mode
            }

            // Shortcuts for when the app is 'idle'
            if (!isInputFocused) {
                // Undo/Redo
                if (e.ctrlKey || e.metaKey) {
                    if (e.key.toLowerCase() === 'z') {
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleRedo();
                        } else {
                            handleUndo();
                        }
                    }
                    if (e.key.toLowerCase() === 'y') {
                        e.preventDefault();
                        handleRedo();
                    }
                }

                // DALI Device Painter shortcut
                if (e.key.toLowerCase() === 'p') {
                    e.preventDefault();
                    handleStartDaliPaintSelection();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [mode, drawingPoints, handleUndo, handleRedo]);


  useEffect(() => {
    if (!currentUser) {
        setActiveProjectId(null);
        setActivePdfId(null);
        setProjects([]);
    } else {
        setIsLoading(true);
        projectService.getProjects().then(projects => {
            console.log('Loaded projects:', projects); // Debug log
            // Ensure projects is always an array
            setProjects(Array.isArray(projects) ? projects : []);
            setIsLoading(false);
        }).catch(error => {
            console.error('Failed to load projects:', error);
            setProjects([]);
            setIsLoading(false);
        });
    }
}, [currentUser]);

    // Fetch PDF data from IndexedDB when active PDF changes
    useEffect(() => {
        if (activePdfId) {
            let isCancelled = false;
            setIsLoading(true);
            setError(null);
            setActivePdfData(null);

            projectService.getPdfData(activePdfId)
                .then(data => {
                    if (!isCancelled) {
                        if (data) {
                            setActivePdfData(data);
                        } else {
                            setError(`Could not load PDF data for ${activePdfMetadata?.name || 'the selected document'}. It may be missing from storage.`);
                        }
                    }
                })
                .catch(err => {
                    if (!isCancelled) {
                        console.error("Failed to fetch PDF data:", err);
                        setError("An error occurred while loading the PDF.");
                    }
                })
                .finally(() => {
                    if (!isCancelled) {
                        setIsLoading(false);
                    }
                });

            return () => {
                isCancelled = true;
            };
        } else {
            setActivePdfData(null);
        }
    }, [activePdfId, activePdfMetadata?.name]);


    useEffect(() => {
        if (activeProject && currentUser) {
            projectService.saveProject(currentUser, activeProject);
        }
    }, [activeProject, currentUser]);

    const handleLoginSuccess = (email: string) => {
        authService.saveCurrentUser(email);
        setCurrentUser(email);
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
    };

    const handleCreateProject = async (name: string, filesWithLevels: { file: File, level: string }[], templateId: string | null) => {
        if (!currentUser) return;
        const newProject = await projectService.createProject(currentUser, name, filesWithLevels, templateId);
        setProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
        setActivePdfId(newProject.pdfs[0]?.id || null);
        setUndoStack([]);
        setRedoStack([]);
    };

    const handleLoadProject = (id: string) => {
        const projectToLoad = projects.find(p => p.id === id);
        if (!projectToLoad) return;
        setActiveProjectId(id);
        setActivePdfId(projectToLoad.pdfs[0]?.id || null);
        setMode('idle');
        setActiveSymbolId(null);
        setActiveDisciplineId(null);
        setActiveDaliPlacement(null);
        setCurrentPage(1);
        setError(null);
        setUndoStack([]);
        setRedoStack([]);
    };

    const handleDeleteProject = async (id: string) => {
        if (!currentUser) return;
        await projectService.deleteProject(currentUser, id);
        setProjects(prev => prev.filter(p => p.id !== id));
        if (activeProjectId === id) {
            setActiveProjectId(null);
            setActivePdfId(null);
        }
    };
    
    const handleSwitchPdf = (pdfId: string) => {
        setActivePdfId(pdfId);
        setCurrentPage(1);
        setActiveSymbolId(null);
        setActiveDisciplineId(null);
        setActiveDaliPlacement(null);
        setMode('idle');
    };
    
    const handleAddPdfs = async (files: File[]) => {
        if (!activeProject || !currentUser || files.length === 0) return;
        setFilesToAdd(files);
    };

    const handleConfirmAddPdfs = async (filesWithLevels: { file: File; level: string }[]) => {
        if (!activeProject || !currentUser) return;

        const updatedProject = await projectService.addPdfsToProject(currentUser, activeProject, filesWithLevels);
        
        commitUpdate(updatedProject);

        const lastAddedPdf = updatedProject.pdfs[updatedProject.pdfs.length - 1];
        if (lastAddedPdf) {
            handleSwitchPdf(lastAddedPdf.id);
        }
        setFilesToAdd(null); // Close modal
    };
    
    const handleUpdatePdfLevel = (pdfId: string, newLevel: string) => {
        if (!activeProject) return;
        const newProject = {
            ...activeProject,
            pdfs: activeProject.pdfs.map(p => {
                if (p.id === pdfId) {
                    return { ...p, level: newLevel };
                }
                return p;
            })
        };
        commitUpdate(newProject);
    };

    const handleDeletePdf = async (pdfId: string) => {
        if (!activeProject || !currentUser) return;
        if (!window.confirm("Are you sure you want to delete this document and all of its associated symbols and areas? This action cannot be undone.")) {
            return;
        }
    
        setIsLoading(true);
        try {
            const updatedProject = await projectService.deletePdfFromProject(currentUser, activeProject.id, pdfId);
    
            if (updatedProject) {
                commitUpdate(updatedProject);
    
                if (activePdfId === pdfId) {
                    if (updatedProject.pdfs.length > 0) {
                        handleSwitchPdf(updatedProject.pdfs[0].id);
                    } else {
                        setActivePdfId(null);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to delete PDF:", err);
            setError("An error occurred while deleting the document.");
        } finally {
            setIsLoading(false);
        }
        
        if (activeDisciplineId) {
            const getAllChildDisciplineIds = (dId: string, allIds: Set<string>) => {
                allIds.add(dId);
                activeProject.disciplines.forEach(child => {
                    if (child.parentId === dId) {
                        getAllChildDisciplineIds(child.id, allIds);
                    }
                });
            };
            const disciplineIds = new Set<string>();
            getAllChildDisciplineIds(activeDisciplineId, disciplineIds);

            return activeProject.symbols.filter(s => 
                s.disciplineId && 
                disciplineIds.has(s.disciplineId) && 
                s.page === currentPage && 
                s.pdfId === activePdfId
            );
        }

        return [];
    }, [activeProject, activePdfId, currentPage, mode, activeSymbolId, activeDisciplineId]);

    if (!currentUser) {
        return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (!activeProject) {
        return <ProjectScreen 
            projects={projects} 
            onCreate={handleCreateProject} 
            onLoad={handleLoadProject} 
            onDelete={handleDeleteProject}
        />;
    }
    
    const activeSymbolColor = activeProject.symbols?.find(s => s.id === activeSymbolId)?.color;
    const areasForCurrentPdf = activeProject.areas?.filter(a => a.pdfId === activePdfId) || [];
    const measurementsForCurrentPdf = activeProject.measurements?.filter(m => m.pdfId === activePdfId) || [];
    const manualEntryToEdit = editingManualEntry ? activeProject.measurements.find(m => m.id === editingManualEntry.measurementId)?.manualEntries?.find(e => e.id === editingManualEntry.entryId) : undefined;

    const getSelectionBanner = () => {
        if (mode === 'selecting_manual') {
            return <div className="absolute top-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50">Draw a box around the symbol to add manually. Press 'Escape' to cancel.</div>;
        }
        if (mode === 'placing_dots') {
            return <div className="absolute top-4 bg-blue-500 text-white p-3 rounded-lg shadow-lg z-50">Click to place pins. Press 'Enter' or 'Escape' to finish.</div>;
        }
        if (mode === 'drawing_area') {
            return <div className="absolute top-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50">Click to draw polygon points. Press 'Enter' to finish or 'Escape' to cancel.</div>;
        }
        if (mode === 'setting_scale') {
            return <div className="absolute top-4 bg-purple-500 text-white p-3 rounded-lg shadow-lg z-50">Draw a line over a known distance. Press 'Enter' when done or 'Escape' to cancel.</div>;
        }
        if (mode === 'drawing_measurement') {
            const text = activeDrawingMeasurementId ? 'Click to add a new segment. Press \'Enter\' to save.' : 'Click to draw measurement points. Press \'Enter\' to save.';
            return <div className="absolute top-4 bg-purple-500 text-white p-3 rounded-lg shadow-lg z-50">{text} Press 'Escape' to cancel.</div>;
        }
        if (mode === 'placing_dali_device') {
            const network = activeProject?.daliNetworks?.find(n => n.id === activeDaliPlacement?.networkId);
            const deviceTypeName = activeDaliPlacement?.deviceType === 'ECG' ? 'ECG (Gear)' : 'ECD (Control)';
            return <div className="absolute top-4 bg-cyan-500 text-white p-3 rounded-lg shadow-lg z-50">Click to place a {deviceTypeName} for network {network?.name}. Press 'Enter' or 'Escape' to finish.</div>;
        }
        if (mode === 'selecting_dali_painter_source') {
            return <div className="absolute top-4 bg-violet-500 text-white p-3 rounded-lg shadow-lg z-50">Click on a DALI device or PSU to copy its properties. Press 'Escape' to cancel.</div>;
        }
        if (mode === 'painting_dali_device') {
            return <div className="absolute top-4 bg-violet-500 text-white p-3 rounded-lg shadow-lg z-50">Click to place copies. Press 'Enter' or 'Escape' to finish.</div>;
        }
        if (mode === 'painting_dali_psu_location') {
            return <div className="absolute top-4 bg-violet-500 text-white p-3 rounded-lg shadow-lg z-50">Click on other PSUs to apply the location. Press 'Enter' or 'Escape' to finish.</div>;
        }
        if (mode === 'placing_dali_psu') {
            const network = activeProject?.daliNetworks?.find(n => n.id === activeDaliPsuPlacementNetworkId);
            return <div className="absolute top-4 bg-indigo-500 text-white p-3 rounded-lg shadow-lg z-50">Click to place a Power Supply Unit for network {network?.name}. Press 'Escape' to finish.</div>;
        }
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar
                projects={projects}
                activeProject={activeProject}
                onSwitchProject={handleLoadProject}
                onCreateNewProject={() => {setActiveProjectId(null); setActivePdfId(null);}}
                onDeleteProject={handleDeleteProject}
                onLogout={handleLogout}
                activePdfId={activePdfId}
                currentPage={currentPage}
                onSwitchPdf={handleSwitchPdf}
                onAddPdfs={handleAddPdfs}
                onUpdatePdfLevel={handleUpdatePdfLevel}
                onDeletePdf={handleDeletePdf}
                onStartManualSelection={startManualSelection}
                onExportExcel={handleOpenExportModal}
                onExportPdfReport={handleExportPdfReport}
                onExportDaliPdfReport={handleExportDaliPdfReport}
                onViewCounts={() => setIsCountsTableOpen(true)}
                isExporting={isLoading}
                isExportingPdf={isExportingPdf}
                isExportingDaliPdf={isExportingDaliPdf}
                isLoading={isLoading || isRestoring}
                mode={mode}
                onSymbolNameChange={handleSymbolNameChange}
                onSymbolColorChange={handleSymbolColorChange}
                onSymbolImageChange={handleSymbolImageChange}
                onSymbolDelete={handleSymbolDelete}
                onAddPoints={handleAddPoints}
                onOpenCopyModal={handleOpenCopyModal}
                activeSymbolId={activeSymbolId}
                setActiveSymbolId={handleSetActiveSymbol}
                onAddDiscipline={handleAddDiscipline}
                onUpdateDisciplineName={handleUpdateDisciplineName}
                onAssignDiscipline={handleAssignDiscipline}
                activeDisciplineId={activeDisciplineId}
                setActiveDisciplineId={handleSetActiveDiscipline}
                onDeleteDiscipline={handleDeleteDiscipline}
                onUpdateDisciplineParent={handleUpdateDisciplineParent}
                onStartAreaDrawing={handleStartAreaDrawing}
                onDeleteArea={handleDeleteArea}
                onUpdateArea={handleUpdateArea}
                onStartSetScale={handleStartSetScale}
                onStartMeasure={handleStartMeasure}
                onStartAddToMeasurement={handleStartAddToMeasurement}
                onUpdateMeasurement={handleUpdateMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
                measurements={measurementsForCurrentPdf}
                measurementGroups={activeProject.measurementGroups}
                onAddMeasurementGroup={handleAddMeasurementGroup}
                onUpdateMeasurementGroupName={handleUpdateMeasurementGroupName}
                onDeleteMeasurementGroup={handleDeleteMeasurementGroup}
                onAssignMeasurementToGroup={handleAssignMeasurementToGroup}
                onUpdateMeasurementGroupParent={handleUpdateMeasurementGroupParent}
                scaleInfo={activePdfMetadata?.scaleInfo}
                selectedMeasurementId={selectedMeasurementId}
                onSelectMeasurement={handleSelectMeasurementForEditing}
                onOpenManualLengthModal={handleOpenManualLengthModal}
                onDeleteManualEntry={handleDeleteManualEntry}
                pdfOpacity={pdfOpacity}
                onPdfOpacityChange={handlePdfOpacityChange}
                onAddDaliNetwork={handleAddDaliNetwork}
                onUpdateDaliNetwork={handleUpdateDaliNetwork}
                onDeleteDaliNetwork={handleDeleteDaliNetwork}
                onStartDaliPlacement={handleStartDaliPlacement}
                onOpenEcdSchedule={() => setIsEcdScheduleModalOpen(true)}
                onDaliNetworkHover={setHoveredDaliNetworkId}
                onStartDaliPaintSelection={handleStartDaliPaintSelection}
                showDaliLabels={showDaliLabels}
                onToggleDaliLabels={handleToggleDaliLabels}
                onStartPlacePsu={handleStartPlacePsu}
                onDeletePsu={handleDeletePsu}
                onRenumberDaliNetwork={handleRenumberDaliNetwork}
                onSaveDaliNetworkAsTemplate={handleSaveDaliNetworkAsTemplate}
            />
            <main className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-200 overflow-auto">
                {error && <div className="absolute top-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50 animate-pulse" onClick={() => setError(null)}>{error}</div>}
                {getSelectionBanner()}
                <PdfViewer
                    pdfData={activePdfData}
                    mode={mode}
                    onSymbolSelected={handleSymbolSelected}
                    onPlaceDot={handlePlaceDot}
                    onQuickPlaceDot={handleQuickPlaceDot}
                    onLocationDelete={handleLocationDelete}
                    onStartReassignPin={handleStartReassignPin}
                    symbolsToHighlight={symbolsToHighlight}
                    activeSymbolId={activeSymbolId}
                    activeSymbolColor={activeSymbolColor}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    onCancelSelection={handleCancelDrawing}
                    onFinishAreaDrawing={handleFinishAreaDrawing}
                    areas={areasForCurrentPdf}
                    drawingPoints={drawingPoints}
                    onDrawPoint={handleDrawPoint}
                    measurements={measurementsForCurrentPdf}
                    scaleInfo={activePdfMetadata?.scaleInfo}
                    activeDrawingMeasurementId={activeDrawingMeasurementId}
                    selectedMeasurementId={selectedMeasurementId}
                    onOpenManualLengthModal={handleOpenManualLengthModal}
                    onStartCreateLinearComponent={handleStartCreateLinearComponent}
                    onDeleteMeasurementSegment={handleDeleteMeasurementSegment}
                    onStartDragMeasurementNode={handleStartDragMeasurementNode}
                    onUpdateMeasurementPoint={handleUpdateMeasurementPoint}
                    onEndDragMeasurementNode={handleEndDragMeasurementNode}
                    pdfOpacity={pdfOpacity}
                    daliNetworks={activeProject.daliNetworks || []}
                    daliDevices={activeProject.daliDevices?.filter(d => d.pdfId === activePdfId) || []}
                    ecdTypes={activeProject.ecdTypes || []}
                    onPlaceDaliDevice={handlePlaceDaliDevice}
                    onDeleteDaliDevice={handleDeleteDaliDevice}
                    onStartEditEcdDevice={handleStartEditEcdDevice}
                    activeDaliPlacement={activeDaliPlacement}
                    hoveredDaliNetworkId={hoveredDaliNetworkId}
                    onDaliNetworkHover={setHoveredDaliNetworkId}
                    onDaliDevicePickedForPainting={handleDaliDevicePicked}
                    onDaliPsuPickedForPainting={handleDaliPsuPickedForPainting}
                    onPaintDaliDevice={handlePaintDaliDevice}
                    onPaintDaliPsuLocation={handlePaintDaliPsuLocation}
                    daliDeviceToPaint={daliDeviceToPaint}
                    daliPsuLocationToPaint={daliPsuLocationToPaint}
                    showDaliLabels={showDaliLabels}
                    onPlacePsu={handlePlacePsu}
                    onDeletePsu={handleDeletePsu}
                    onStartEditPsuLocation={handleStartEditPsuLocation}
                    activeDaliPsuPlacementNetworkId={activeDaliPsuPlacementNetworkId}
                    activePdfId={activePdfId}
                />
            </main>
            <CopySymbolModal
                isOpen={!!symbolToCopy}
                onClose={handleCloseCopyModal}
                onCopy={handleCopySymbols}
                symbolToCopy={symbolToCopy}
                pdfsInProject={activeProject.pdfs}
            />
            <AddPdfsModal
                isOpen={!!filesToAdd}
                onClose={() => setFilesToAdd(null)}
                onAdd={handleConfirmAddPdfs}
                files={filesToAdd || []}
            />
            <ExportExcelModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={handleConfirmExport}
                isExporting={isLoading}
            />
            <ExportPdfModal
                isOpen={isExportPdfModalOpen}
                onClose={() => setIsExportPdfModalOpen(false)}
                onConfirm={handleConfirmExportPdfReport}
                isExporting={isExportingPdf}
            />
            <ReassignSymbolModal
                isOpen={!!pinToReassign}
                onClose={() => setPinToReassign(null)}
                onConfirm={handleConfirmReassignPin}
                currentSymbol={activeProject.symbols.find(s => s.id === pinToReassign?.symbolId)}
                availableSymbols={reassignableSymbols}
                disciplines={activeProject.disciplines}
            />
            <AreaNamingModal
                isOpen={isNamingArea}
                onClose={handleCancelDrawing}
                onConfirm={handleCreateArea}
            />
            <CountsTableModal
                isOpen={isCountsTableOpen}
                onClose={() => setIsCountsTableOpen(false)}
                project={activeProject}
            />
            <ScaleModal
                isOpen={isScaleModalOpen}
                onClose={handleCancelDrawing}
                onConfirm={handleConfirmScale}
            />
            <ManualLengthModal
                isOpen={!!editingManualEntry}
                onClose={() => setEditingManualEntry(null)}
                onConfirm={handleSaveManualLength}
                initialLength={manualEntryToEdit?.length}
            />
            <LinearComponentModal
                isOpen={isLinearComponentModalOpen}
                onClose={() => setIsLinearComponentModalOpen(false)}
                onConfirm={handleConfirmCreateLinearComponent}
                project={activeProject}
            />
            <EcdTypeAssignModal
                isOpen={!!editingEcdDevice}
                onClose={() => setEditingEcdDevice(null)}
                onConfirm={handleAssignEcdTypeToDevice}
                ecdTypes={activeProject.ecdTypes || []}
                device={editingEcdDevice}
            />
            <EcdScheduleModal
                isOpen={isEcdScheduleModalOpen}
                onClose={() => setIsEcdScheduleModalOpen(false)}
                ecdTypes={activeProject.ecdTypes || []}
                onAdd={handleAddEcdType}
                onUpdate={handleUpdateEcdType}
                onDelete={handleDeleteEcdType}
            />
            <PsuLocationModal
                isOpen={!!editingPsuNetwork}
                onClose={() => setEditingPsuNetwork(null)}
                onConfirm={handleSavePsuLocation}
                initialLocation={editingPsuNetwork?.psuLocation?.location}
            />
        </div>
    );
};

export default App;
