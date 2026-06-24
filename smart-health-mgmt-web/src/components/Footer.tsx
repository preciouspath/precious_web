import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSystemSettings } from '../api/supportApi';


// Footer data interfaces
interface FooterLink {
    label: string;
    href: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface SocialLink {
    name: string;
    icon: string;
    href: string;
    key: string;
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

// Social media links templates
const socialTemplates: SocialLink[] = [
    { name: 'Facebook', icon: '/images/s-icon1.svg', href: 'https://facebook.com/login', key: 'facebook_url' },
    { name: 'Twitter', icon: '/images/s-icon2.svg', href: 'https://twitter.com/login', key: 'twitter_url' },
    { name: 'Pinterest', icon: '/images/s-icon3.svg', href: 'https://pinterest.com/login', key: 'pinterest_url' },
    { name: 'Instagram', icon: '/images/s-icon4.svg', href: 'https://instagram.com/accounts/login', key: 'instagram_url' }
];

const Footer = () => {
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>(socialTemplates);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const socialKeys = socialTemplates.map(t => t.key).join(',');
                const response = await getSystemSettings(socialKeys);
                if (response.data.success && response.data.data) {
                    const settings = response.data.data;
                    const updatedLinks = socialTemplates.map(link => ({
                        ...link,
                        href: settings[link.key] || '#'
                    }));
                    setSocialLinks(updatedLinks);
                }
            } catch (error) {
                console.error("Failed to fetch social links:", error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <>
            <footer id="footer">
                {/* CTA Section */}
                <section className="relative py-20 lg:py-28 bg-[url('/images/cta-bg.png')] bg-cover bg-center bg-no-repeat overflow-hidden">
                    <div className="container relative z-10">
                        <div className="text-center max-w-3xl mx-auto">
                            {/* Heading */}
                            <h2 className="headings-web-h2-headline text-white mb-4">
                                Ready to Take Control of Your Health?
                            </h2>

                            {/* Description */}
                            <p className="body-text-body-lg !text-[var(--color-gray-50)] mb-8">
                                Join thousands of users who trust Precious Path for their health management
                            </p>

                            {/* CTA Button */}
                            <Link to="/login">
                                <button className="btn btn-white">
                                    Get Started Now
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer Links Section */}
                <section className="bg-slate-950 py-12 lg:py-24">
                    <div className="container">
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
                            {/* Logo & Description Column */}
                            <div className="lg:col-span-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <img src="/images/logo.svg" alt="Precious Path" className="h-8" />
                                </div>
                                <p className="body-text-body-2 medium !text-[var(--color-gray-400)] mb-6">
                                    Your Smart Health Companion Platform
                                </p>

                                {/* Social Media Icons */}
                                <div className="flex gap-4">
                                    {socialLinks.map((social, index) => (
                                        <a
                                            key={index}
                                            href={social.href}
                                            className=""
                                            aria-label={social.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <img src={social.icon} alt={social.name} />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Columns */}
                            {footerColumns.map((column, index) => (
                                <div key={index}>
                                    <h3 className="headings-web-h4-headline text-white mb-6">
                                        {column.title}
                                    </h3>
                                    <ul className="space-y-3">
                                        {column.links.map((link, linkIndex) => (
                                            <li key={linkIndex}>
                                                <Link
                                                    to={link.href}
                                                    className="headings-web-h6-headline text-slate-400 hover:text-white transition-colors duration-300 no-underline"
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}

                            {/* Download App Column */}
                            <div id="footer-download">
                                <h3 className="headings-web-h4-headline text-white mb-6">
                                    Download App
                                </h3>
                                <div className="space-y-3">
                                    <a href="#" className="block">
                                        <img src="/images/google-play.svg" alt="Get it on Google Play" className="h-11" />
                                    </a>
                                    <a href="#" className="block">
                                        <img src="/images/app-store.svg" alt="Download on the App Store" className="h-11" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </footer>
        </>
    )
}

export default Footer