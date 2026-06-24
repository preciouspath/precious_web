import React from 'react';

const AboutUsApp: React.FC = () => {
    return (
        <div className="bg-white">
            <section className="py-10 lg:py-18">
                <div className="container">
                    <div className="space-y-12">
                        <div>
                            <h2 className="headings-h5-headline bold text-[#222222] mb-6">About Us</h2>
                            <div className="bg-[#F8FAFC] p-[15px] rounded-[16px] space-y-4">
                                <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                    Smart Health Management is a dedicated platform designed to bridge the gap between patients and healthcare providers. Our goal is to empower individuals to take control of their health through technology and data-driven insights.
                                </p>
                                <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                    Our platform provides a seamless experience for managing health records, tracking vitals, and connecting with doctors in a secure and efficient manner.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">Our Mission</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                To make healthcare simpler, smarter, and more accessible for everyone. We believe that managing your health should be easy, secure, and empowering—whether you are tracking daily wellness or managing complex medical history.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">Our Vision</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                To be the global leader in personal health management, creating a world where every person has immediate access to their complete health picture and the tools to improve it.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">Our Core Values</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                - **Integrity**: We prioritize the privacy and security of your health data above all else.
                                <br />
                                - **Innovation**: We constantly strive to bring the latest technology to healthcare management.
                                <br />
                                - **Empathy**: We build tools with the patient's well-being and convenience at the center.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUsApp;
