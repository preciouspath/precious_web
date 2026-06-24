"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
    text?: string;
    minHeight?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = "Loading...", minHeight = "200px" }) => {
    return (
        <div
            className="flex flex-col items-center justify-center gap-4 transition-all"
            style={{ minHeight }}
        >
            <div className="relative">
                <Loader2 className="w-12 h-12 text-[#9146C1] animate-spin" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-purple-100 rounded-full"></div>
            </div>
            {text && (
                <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-[2px] animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

export default Loader;
