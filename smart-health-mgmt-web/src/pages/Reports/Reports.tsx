import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getReportCountsApi } from "../../api/authApi";
import Loader from "../../components/common/Loader";

interface ReportsProps {
    onNavigateToMyUpload?: () => void;
    onNavigateToDoctorUpload?: () => void;
}

const Reports: React.FC<ReportsProps> = ({ onNavigateToMyUpload, onNavigateToDoctorUpload }) => {

    const { data: countsRes, isLoading } = useQuery({
        queryKey: ["reports", "counts"],
        queryFn: () => getReportCountsApi()
    });

    const myCount = countsRes?.data?.data?.myCount || 0;
    const doctorCount = countsRes?.data?.data?.doctorCount || 0;

    if (isLoading) return <div className="flex justify-center py-20"><Loader text="Loading reports..." /></div>;

    return (
        <section className="py-10 lg:py-18 bg-[var(--color-slate-50)]">
            <div className="container">
                <div className="bg-white rounded-[15px]">
                    {/* Header */}
                    <div className="p-[15px] border-b border-[var(--color-slate-100)] flex items-center justify-between flex-wrap gap-[10px]">
                        <h1 className="headings-web-h4-headline bold text-[var(--color-gray-700)]">Reports</h1>
                        {/* Create Folder button removed - moved to MyUpload */}
                    </div>

                    <div className="p-[15px] md:p-[20px]">
                        {/* Primary Folders only */}
                        <div className="grid gap-6 mb-12 grid-cols-[repeat(auto-fit,162px)]">
                            {/* Doctor Uploads */}
                            <div
                                onClick={onNavigateToDoctorUpload}
                                className="flex flex-col gap-[10px] items-center justify-center transition-colors"
                            >
                                <div className="bg-[#F4ECFB] rounded-[10px] p-[15px] text-center cursor-pointer hover:bg-[#E9D5FF] w-full justify-center items-center flex aspect-square">
                                    <div className="w-[50px] h-[50px] bg-[#9146C1] text-white rounded-full flex items-center justify-center">
                                        <img src="/images/icon001.svg" alt="icon" />
                                    </div>
                                </div>
                                <div className="des-box text-left w-full">
                                    <h4 className="headings-web-h6-headline text-[var(--color-gray-700)] mb-[5px]">
                                        Doctor Upload
                                    </h4>
                                    <p className="text-[12px] !text-[var(--color-slate-500)]">
                                        {doctorCount} New Documents
                                    </p>
                                </div>
                            </div>

                            {/* My Uploads */}
                            <div
                                onClick={onNavigateToMyUpload}
                                className="flex flex-col gap-[10px] items-center justify-center transition-colors"
                            >
                                <div className="bg-[#F4ECFB] rounded-[10px] p-[15px] text-center cursor-pointer hover:bg-[#E9D5FF] w-full justify-center items-center flex aspect-square">
                                    <div className="w-[50px] h-[50px] bg-[#9146C1] text-white rounded-full flex items-center justify-center">
                                        <img src="/images/icon002.svg" alt="icon" />
                                    </div>
                                </div>
                                <div className="des-box text-left w-full">
                                    <h4 className="headings-web-h6-headline text-[var(--color-gray-700)] mb-[5px]">
                                        My Upload
                                    </h4>
                                    <p className="text-[12px] !text-[var(--color-slate-500)]">
                                        {myCount} Documents
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Removed: New Folders section */}
                    </div>

                </div>
            </div>

            {/* Removed: Create Folder Modal, Rename Modal, Delete Modal */}
        </section>
    );
};

export default Reports;