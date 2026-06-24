import React from 'react';


const Setting: React.FC = () => {



    return (
             <div className="p-6 lg:p-10 min-h-screen bg-[#F8FAFC]">
            {/* Main Container */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-50 min-h-[750px] flex flex-col relative overflow-hidden group">
                
                {/* Background Image with Overlay */}
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] ease-linear group-hover:scale-110"
                    style={{ backgroundImage: "url('/images/reports-bg.png')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-[#9146C1]/20 z-[1]"></div>
                
                {/* Decorative Background Elements (Glassy) */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl z-[2] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-3xl z-[2]"></div>

                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100/50 relative z-20 backdrop-blur-sm">
                    {/* <h1 className="text-[20px] font-bold text-[#1E293B] font-['AeonikBold']">Health Reports</h1> */}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-10 relative z-20">
                    {/* Glass Container */}
                    {/* <div className="max-w-3xl w-full bg-white/40 backdrop-blur-xl border border-white/60 p-12 lg:p-16 rounded-[48px] shadow-2xl shadow-purple-900/5 text-center space-y-10 animate-in fade-in zoom-in duration-1000"> */}
                        
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 rounded-full shadow-sm border border-slate-100 animate-bounce duration-[3000ms]">
                            {/* <span className="w-10 h-10 bg-[#9146C1] rounded-full"></span> */}
                            <span className="text-[50px] font-['AeonikBold'] text-[#9146C1] tracking-widest uppercase">
                              Coming Soon
                            </span>
                        {/* </div> */}

                      


                    
                    </div>
                </div>

                {/* Bottom Stats or Info */}
                <div className="px-10 py-6 text-center relative z-20">
                    <p className="text-[12px] text-slate-400 font-['AeonikMedium']">
                        © 2025 Smart Health Management. Empowering better medical decisions.
                    </p>
                </div>
            </div>

            {/* Injected Styles for the Gradient Animation */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-x {
                    animation: gradient-x 6s ease infinite;
                }
            `}} />
        </div>
        
    );
};

export default Setting;
