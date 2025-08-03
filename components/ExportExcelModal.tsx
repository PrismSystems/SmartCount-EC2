
import React from 'react';

interface ExportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (onlyCounted: boolean) => void;
    isExporting: boolean;
}

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({ isOpen, onClose, onConfirm, isExporting }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-surface-overlay flex items-center justify-center z-modal transition-opacity animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-surface-elevated rounded-xl shadow-floating p-6 w-full max-w-md transform transition-all animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-neutral-800 mb-4">Export Options</h2>
                
                <p className="text-sm text-neutral-600 mb-6">
                    Choose which symbols to include in your Excel export.
                </p>
                
                <div className="flex flex-col space-y-3">
                    <button
                        onClick={() => onConfirm(false)}
                        disabled={isExporting}
                        className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-semibold disabled:bg-neutral-300 disabled:cursor-not-allowed"
                    >
                        {isExporting ? 'Exporting...' : 'Export All Symbols'}
                    </button>
                    <button
                        onClick={() => onConfirm(true)}
                        disabled={isExporting}
                        className="w-full px-4 py-3 bg-secondary text-white rounded-lg hover:bg-interactive-hover transition-colors font-semibold disabled:bg-neutral-300 disabled:cursor-not-allowed"
                    >
                         {isExporting ? 'Exporting...' : 'Export Only Symbols with Count > 0'}
                    </button>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isExporting}
                        className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition-colors font-semibold disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
