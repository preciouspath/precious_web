// Footer data interfaces
interface FooterLink {
    label: string;
    href: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

// Footer columns data
const footerColumns: FooterColumn[] = [
    {
        title: 'Home',
        links: [
            { label: 'Home', href: '/' },
            { label: 'About Us', href: '/about' },
            { label: 'Contact Us', href: '/contact' },
            { label: 'FAQ', href: '/faq' }
        ]
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            // { label: 'Cookie Policy', href: '/cookies' }
        ]
    }
];

// Dashboard Footer Component

const DashboardFooter = () => {
    return (
        <footer className="bg-[#0A0A0B] py-16 lg:py-24">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 text-left">
                    {/* Logo & Description Column */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/images/logo.svg" alt="Precious Path" className="h-8" />
                        </div>
                        <p className="text-[15px] font-['AeonikMedium'] text-slate-400 mb-8 max-w-xs leading-relaxed">
                            Your Smart Health Companion Platform
                        </p>
                        
                        {/* Social Media Icons */}
                        <div className="flex gap-6">
                            {[
                                { icon: '/images/s-icon1.svg', name: 'FB' },
                                { icon: '/images/s-icon2.svg', name: 'X' },
                                { icon: '/images/s-icon3.svg', name: 'PN' },
                                { icon: '/images/s-icon4.svg', name: 'IG' }
                            ].map((social, index) => (
                                <a 
                                    key={index}
                                    href="#" 
                                    className="opacity-100 hover:opacity-80 transition-opacity"
                                >
                                  <img src={social.icon} alt={social.name} className="w-5 h-5 invert" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Footer Columns */}
                    {footerColumns.map((column, index) => (
                        <div key={index}>
                            <h3 className="text-[18px] font-['AeonikBold'] text-white mb-6">
                                {column.title}
                            </h3>
                            <ul className="space-y-4 p-0 list-none">
                                {column.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <a 
                                            href={link.href} 
                                            className="text-[15px] font-['AeonikMedium'] text-slate-400 hover:text-white transition-colors duration-300 no-underline"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Download App Column */}
                    <div>
                        <h3 className="text-[18px] font-['AeonikBold'] text-white mb-6">
                            Download App
                        </h3>
                        <div className="space-y-4">
                            <a href="#" className="block hover:opacity-90 transition-opacity">
                                <img src="/images/google-play.svg" alt="Get it on Google Play" className="h-10" />
                            </a>
                            <a href="#" className="block hover:opacity-90 transition-opacity">
                                <img src="/images/app-store.svg" alt="Download on the App Store" className="h-10" />
                            </a>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 pt-8 border-t border-slate-900 text-center">
                    <p className="text-slate-500 text-xs text-center">
                        © 2025 Precious Path. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default DashboardFooter;
