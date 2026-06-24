import React from 'react';
import StaticPageHero from '../components/StaticPageHero';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="bg-white">
            <StaticPageHero title="Privacy Policy" />
            
            <section className="py-10 lg:py-18">
                <div className="container">
                    <div className="space-y-12">
                        <div>
                            <h2 className="headings-h5-headline bold text-[#222222] mb-6">Introduction</h2>
                            <div className="bg-[#F8FAFC] p-[15px] rounded-[16px] space-y-4">
                                <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                                </p>
                                <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                    If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">1. Nature of Services</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.
                            </p>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                At Smart Health Management, our mission is to make healthcare simpler, smarter, and more accessible for everyone. We believe that managing your health should be easy, secure, and empowering—whether you are tracking daily wellness, managing appointments, or accessing medical records.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">2. Account Registration</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                            </p>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h3 className="headings-h5-headline bold text-[#222222]">3. Health Data Accuracy</h3>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                            </p>
                            <p className="body-text-body-1 !text-[#71717A] !leading-relaxed">
                                Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
