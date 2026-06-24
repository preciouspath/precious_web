import React, { useState, useEffect } from 'react';
import StaticPageHero from '../components/StaticPageHero';
import { getFAQs } from '../api/supportApi';

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const response = await getFAQs();
                if (response.data.success && response.data.data) {
                    setFaqs(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch FAQs:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="bg-white">
            <StaticPageHero title="Frequently Asked Questions" />
            
            <section className="py-10 lg:py-18 pb-20">
                <div className="container">
                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="inline-block w-8 h-8 border-4 border-[#9146C1] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {faqs.length > 0 ? (
                                faqs.map((faq, i) => (
                                    <div key={i} className="rounded-[10px] overflow-hidden transition-all duration-300 bg-white shadow-[0px_3px_24px_rgba(0,0,0,0.05)]">
                                        <button 
                                            onClick={() => toggleFAQ(i)}
                                            className="w-full flex items-center justify-between p-[15px] text-left transition-colors"
                                        >
                                            <span className="headings-web-h5-headline leading-tight text-[#222222]">
                                                {faq.question}
                                            </span>
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openIndex === i ? 'rotate-180' : ''}`}>
                                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 16.8006C11.3 16.8006 10.6 16.5306 10.07 16.0006L3.55002 9.48062C3.26002 9.19062 3.26002 8.71062 3.55002 8.42062C3.84002 8.13063 4.32002 8.13063 4.61002 8.42062L11.13 14.9406C11.61 15.4206 12.39 15.4206 12.87 14.9406L19.39 8.42062C19.68 8.13063 20.16 8.13063 20.45 8.42062C20.74 8.71062 20.74 9.19062 20.45 9.48062L13.93 16.0006C13.4 16.5306 12.7 16.8006 12 16.8006Z" fill="#27272A"/>
                                               </svg>
                                            </div>
                                        </button>
                                        
                                        <div 
                                            className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                            <div className="p-[15px] !pt-0 body-text-body-2 text-[#62748E] !leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-500">
                                    No FAQs found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FAQ;
