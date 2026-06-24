import React, { type ReactNode } from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string | ReactNode;
    description?: string | ReactNode;
    icon: ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    cancelButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    icon,
    confirmText = "Yes",
    cancelText = "No",

}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[452px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 relative">
                <div className="p-[20px]">
                    <div className="w-[77px] h-[77px] bg-[#F5E7FF] text-[#9146C1] rounded-full flex items-center justify-center mx-auto mb-6">
                        {icon}
                    </div>
                    <h3 className="headings-web-h4-headline text-center text-slate-800 mb-2 tracking-tight whitespace-pre-line">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-sm text-center text-slate-500 mb-8 font-['AeonikMedium']">
                            {description}
                        </p>
                    )}
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className={`flex-1 btn py-3.5 rounded-xl font-['AeonikBold'] bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50`}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 btn-medical py-3.5 rounded-xl border-none outline-none`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
