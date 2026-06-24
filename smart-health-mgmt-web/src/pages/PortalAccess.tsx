import React from 'react';
import { ChevronRight, Stethoscope, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const businessPortalUrl = import.meta.env.VITE_BUSINESS_PANEL_URL as string | undefined;
// const adminPortalUrl = import.meta.env.VITE_ADMIN_PANEL_URL as string | undefined;

const portalCards = [
    {
        title: 'Patient',
        description: 'Access reports, monitoring, insurance, subscriptions, and your personal health dashboard.',
        accent: 'from-emerald-500 to-teal-500',
        icon: Stethoscope,
        actionLabel: 'Continue as Patient',
        to: '/login/patient',
        external: false,
    },
    {
        title: 'Business',
        description: 'Manage campaigns, ad performance, support activity, and your business account workflows.',
        accent: 'from-violet-500 to-fuchsia-500',
        icon: Building2,
        actionLabel: 'Open Business Panel',
        to: businessPortalUrl,
        external: true,
    },
    // {
    //     title: 'Admin',
    //     description: 'Review operations, approvals, platform settings, tickets, and system-wide management tools.',
    //     accent: 'from-slate-700 to-slate-900',
    //     icon: ShieldCheck,
    //     actionLabel: 'Open Admin Panel',
    //     to: adminPortalUrl,
    //     external: true,
    // },
];

const PortalAccess: React.FC = () => {
    const handleExternalRedirect = (url?: string) => {
        if (!url) {
            toast.error('Portal URL is not configured yet.');
            return;
        }

        window.open(url, '_blank');
    };

    return (
        <section className="min-h-screen flex items-center justify-center py-12">
            <div className="container">
                <div className="max-w-[920px] mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-['AeonikBold'] uppercase tracking-widest text-slate-500 shadow-sm backdrop-blur-sm">
                            Smart Health Access
                        </div>
                        <h1 className="mt-5 headings-web-h2-headline text-slate-900">
                            Choose how you want to sign in
                        </h1>
                        <p className="mt-3 body-text-body-lg !text-slate-500 !leading-relaxed">
                            Start from one place and head straight into the portal built for your role.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        {portalCards.map((portal) => (
                            <div
                                key={portal.title}
                                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(15,23,42,0.2)] hover:-translate-y-1"
                            >
                                <div className={`h-1.5 w-full bg-gradient-to-r ${portal.accent}`} />
                                <div className="flex w-full flex-col p-7 md:p-8">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.accent} text-white flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110`}>
                                        <portal.icon size={22} />
                                    </div>

                                    <div className="mt-5 flex-1">
                                        <h2 className="text-[20px] leading-[1.2] font-['AeonikBold'] text-slate-900">{portal.title}</h2>
                                        <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                                            {portal.description}
                                        </p>
                                    </div>

                                    <div className="mt-6">
                                        {portal.external ? (
                                            <button
                                                type="button"
                                                onClick={() => handleExternalRedirect(portal.to)}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-[12px] font-['AeonikBold'] uppercase tracking-widest text-white transition-all duration-200 hover:bg-slate-800 hover:gap-3"
                                            >
                                                {portal.actionLabel}
                                                <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                                            </button>
                                        ) : (
                                            <Link
                                                to={portal.to || '/login/patient'}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-[12px] font-['AeonikBold'] uppercase tracking-widest text-white transition-all duration-200 hover:bg-slate-800 hover:gap-3"
                                            >
                                                {portal.actionLabel}
                                                <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-400">
                        Patient access stays in this app. Business and admin access open their dedicated panels.
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PortalAccess;
