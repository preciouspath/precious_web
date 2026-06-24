import React from 'react';

const PrivacyPolicyApp: React.FC = () => {
    return (
        <div className="bg-white">
            <section className="py-10 lg:py-18">
                <div className="container">
                    <div className="space-y-12">    
                        <div>
                            <h2 className="headings-h5-headline bold text-[#222222] mb-6">Privacy Policy</h2>
                            <div className="bg-[#F8FAFC] p-[15px] rounded-[16px] space-y-4">
                                <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                    At Smart Health Management, we are committed to protecting your privacy and ensuring the security of your personal health information. This Privacy Policy outlines how we collect, use, and safeguard your data.
                                </p>
                                <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                    By using our services, you agree to the collection and use of information in accordance with this policy. We take your privacy seriously and implement robust technical and organizational measures to protect your information.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">1. Information We Collect</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                We collect various types of information, including personal identification (name, email, phone number) and health-related data (reports, prescriptions, vitals) that you or your doctor provide to the platform.
                            </p>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                We also collect device information and usage data to improve our services and provide a personalized experience. This includes information about your smartwatch if you choose to integrate it.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">2. How We Use Your Information</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                Your information is used to provide and maintain our services, notify you about changes, and allow you to participate in interactive features. Most importantly, it allows doctors to provide better care based on your health history.
                            </p>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                We do not sell your personal information to third parties. We only share data with authorized healthcare providers and service providers necessary for platform operation.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">3. Data Security</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                We use industry-standard encryption and security protocols to protect your data. This includes secure data transmission (SSL/TLS) and encrypted storage for sensitive health records.
                            </p>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                While we strive to use commercially acceptable means to protect your personal information, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicyApp;
