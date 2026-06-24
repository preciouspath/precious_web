import React, { useState, useEffect } from 'react';
import StaticPageHero from '../components/StaticPageHero';
import { getSupportInfo, submitContactInquiry } from '../api/supportApi';
import { toast } from 'react-toastify';

const ContactUs: React.FC = () => {
    const [contactInfo, setContactInfo] = useState({
        email: 'support@yopmail.com', // Default for testing
        phone: '+1 234 567 890'
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [errors, setErrors] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await getSupportInfo();
                if (response.data.success && response.data.data) {
                    setContactInfo(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch contact info:", error);
            }
        };
        fetchInfo();
    }, []);

    const validate = () => {
        const newErrors: any = {};
        if (!formData.name) newErrors.name = "Name is required";
        else if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters";

        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";

        if (!formData.subject) newErrors.subject = "Subject is required";
        if (!formData.message) newErrors.message = "Message is required";
        else if (formData.message.length < 10) newErrors.message = "Message must be at least 10 characters";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const response = await submitContactInquiry(formData);
            if (response.data.success) {
                toast.success(response.data.message || "Inquiry submitted successfully!");
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                toast.error(response.data.message || "Failed to submit inquiry.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
            
        <div className="bg-white">
            <StaticPageHero title="Contact Us" />
            
            <section className="py-10 lg:py-18 pb-20">
                <div className="container">
                    <div className="max-w-6xl mx-auto bg-white rounded-[20px] overflow-hidden border border-[#F1F5F9] flex flex-col lg:flex-row">
                        
                        {/* Left Side: Reach Out Info (Gray) */}
                        <div className="bg-[#F8FAFC] p-[15px] lg:p-[30px] flex flex-col justify-start flex-1">
                            <div className="mb-12">
                                <h2 className="headings-web-h3-headline text-[#000000] mb-4 leading-tight">
                                    Reach Out <br/> We’re Here to Guide You
                                </h2>
                            </div>
                            
                            <div className="space-y-[30px]">
                                <div className="flex items-center gap-6">
                                    <div className="w-[52px] h-[52px] bg-[#F5E7FF] rounded-[13px] flex items-center justify-center text-[#9146C1]">
                                     <img src="/images/c-icon1.svg" alt="icon"/>
                                    </div>
                                    <div>   
                                        <h3 className="headings-web-h5-headline text-[#374151] mb-0.5">Email</h3>
                                        <p className="body-text-body-2 !text-[#62748E]">{contactInfo.email}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="w-[52px] h-[52px] bg-[#F5E7FF] rounded-[13px] flex items-center justify-center text-[#9146C1]">
                                      <img src="/images/c-icon2.svg" alt="icon"/>
                                    </div>
                                    <div>
                                        <h3 className="headings-web-h5-headline text-[#374151] mb-0.5">Phone number</h3>
                                        <p className="body-text-body-2 !text-[#62748E]">{contactInfo.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Contact Form (White) */}
                        <div className="lg:flex-1 bg-white p-[15px] lg:p-[30px]">
                            <h3 className="headings-web-h3-headline text-[#000000] mb-4 leading-tight">
                                Need Help? Our Tech Navigates for You
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2 gap-x-6">
                                    <div className="form-group mb-4 text-left">
                                        <label className="block mb-1 font-medium">Name</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter name" 
                                            className={`form-control w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`} 
                                        />
                                        {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                                    </div>
                                    <div className="form-group mb-4 text-left">
                                        <label className="block mb-1 font-medium">Email</label>
                                        <input 
                                            type="email" 
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter email" 
                                            className={`form-control w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
                                        />
                                        {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                                    </div>
                                </div>
                                <div className="form-group mb-4 text-left">
                                    <label className="block mb-1 font-medium">Subject</label>
                                    <input 
                                        type="text" 
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Enter subject" 
                                        className={`form-control w-full p-2 border rounded ${errors.subject ? 'border-red-500' : 'border-gray-300'}`} 
                                    />
                                    {errors.subject && <span className="text-red-500 text-xs">{errors.subject}</span>}
                                </div>
                                <div className="form-group mb-4 text-left">
                                    <label className="block mb-1 font-medium">Message</label>
                                    <textarea 
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Please your message here" 
                                        rows={5} 
                                        className={`form-control w-full p-2 border rounded ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                                    ></textarea>
                                    {errors.message && <span className="text-red-500 text-xs">{errors.message}</span>}
                                </div>
                                <div className='text-left'>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="btn min-w-[175px] bg-[#9146C1] text-white py-2 rounded hover:bg-[#7a3aa3] disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactUs;
