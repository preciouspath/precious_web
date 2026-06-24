import React from 'react';
import { Link } from 'react-router-dom';

const BannerCTA: React.FC = () => {
    return (
        <section className="relative py-24 overflow-hidden">
            {/* Dark background with Tech Pattern */}
            <div className="absolute inset-0 bg-[#0A0B0E]">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-20" 
                     style={{ 
                        backgroundImage: 'radial-gradient(#9146C1 0.5px, transparent 0.5px)', 
                        backgroundSize: '24px 24px' 
                     }}>
                </div>
                {/* Purple Glow/Gradient Sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9146C1]/20 to-transparent"></div>
            </div>
            
            <div className="container mx-auto px-4 relative z-10 text-center">
                <h2 className="headings-web-h2-headline text-white mb-6 font-bold tracking-tight">
                    Ready to Take Control of Your Health?
                </h2>
                <p className="body-text-body-1 text-slate-400 mb-10 max-w-2xl mx-auto">
                    Join thousands of users who trust Precious Path for their health management.
                </p>
                <Link to="/login">
                    <button className="bg-white text-[#0A0B0E] px-10 py-4 rounded-xl font-['AeonikBold'] text-[16px] hover:bg-slate-100 transition-all shadow-[0px_10px_30px_rgba(255,255,255,0.1)]">
                        Get Started Now
                    </button>
                </Link>
            </div>
        </section>
    );
};

export default BannerCTA;
