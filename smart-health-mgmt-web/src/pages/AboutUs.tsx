import React, { useState, useEffect } from 'react';
import StaticPageHero from '../components/StaticPageHero';
import { getSystemSettings } from '../api/supportApi';

const AboutUs: React.FC = () => {
    const [data, setData] = useState<any>({
        about_us_intro_text: "At Precious Path, we believe that managing your health shouldn't be a burden. Our platform brings together cutting-edge technology and human-centric design to help you stay on top of your well-being.",
        about_us_doctor_image: "/images/doctor.png",
        about_us_vision_text: "Our vision is to empower every individual with the tools they need to live a healthier, longer life. We aim to bridge the gap between complex health data and daily actionable insights.\n\nBy leveraging artificial intelligence and data science, we provide personalized recommendations that adapt to your unique lifestyle and health goals.",
        about_us_vision_image: "/images/Frame.png",
        about_us_team_description: "Meet the visionaries driving our mission to deliver exceptional healthcare services.",
        about_us_member1_name: "Michael Rodriguez",
        about_us_member1_role: "CEO & Co-Founder",
        about_us_member1_image: "/images/team1.png",
        about_us_member2_name: "Nancy Wilson",
        about_us_member2_role: "Chief Technology Officer",
        about_us_member2_image: "/images/team2.png",
        about_us_member3_name: "Emily Chen",
        about_us_member3_role: "Chief Marketing Officer",
        about_us_member3_image: "/images/team3.png",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const keys = [
                    'about_us_intro_text', 'about_us_doctor_image',
                    'about_us_vision_text', 'about_us_vision_image',
                    'about_us_team_description',
                    'about_us_member1_name', 'about_us_member1_role', 'about_us_member1_image',
                    'about_us_member2_name', 'about_us_member2_role', 'about_us_member2_image',
                    'about_us_member3_name', 'about_us_member3_role', 'about_us_member3_image'
                ].join(',');
                const response = await getSystemSettings(keys);
                if (response.data.success && response.data.data) {
                    setData((prev: any) => ({ ...prev, ...response.data.data }));
                }
            } catch (error) {
                console.error("Failed to fetch About Us data:", error);
            }
        };
        fetchData();
    }, []);

    return (
     <>
      <StaticPageHero title="About Us" />
      
      <div className="container px-4">
        <section className='py-12 md:py-18'>
            {/* Intro Section */}
            <div className="mb-[30px] md:mb-[70px]">
                <p className="label-label-2-regular text-center !text-[#71717A] mb-10 leading-relaxed px-4 max-w-4xl mx-auto">
                    {data.about_us_intro_text}
                </p>
                <div className="rounded-[15px] overflow-hidden w-full max-h-[600px]">
                    <img 
                        src={data.about_us_doctor_image} 
                        alt="Doctors Team" 
                        className="w-full h-full object-cover object-top rounded-[15px]" 
                    />
                </div>
            </div>

            {/* Vision Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                <div className="order-2 lg:order-1">
                    <h2 className="headings-web-h2-headline font-bold text-gray-900 mb-6">Our Vision</h2>
                    <div className="space-y-6 label-label-2-regular leading-relaxed">
                        {data.about_us_vision_text.split('\n\n').map((para: string, idx: number) => (
                            <p key={idx} className="!text-[#71717A]">
                                {para}
                            </p>
                        ))}
                    </div>
                </div>
                <div className="order-1 lg:order-2 rounded-[15px] overflow-hidden">
                    <img 
                        src={data.about_us_vision_image} 
                        alt="Our Vision" 
                        className="w-full h-full object-cover rounded-[15px]"
                    />
                </div>
            </div>
        </section>    

        {/* Team Section */}
        <section className="text-center pb-12 md:pb-18">
         <div className='container'>
            <h2 className="headings-web-h2-headline font-bold text-gray-900 mb-3">Our Team</h2>
            <p className="label-label-2-regular !text-[#71717A] mb-12">{data.about_us_team_description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3].map(num => (
                    <div key={num} className="rounded-[30px] overflow-hidden relative group h-[400px] md:h-[450px] shadow-sm hover:shadow-md transition-shadow">
                        <img 
                            src={data[`about_us_member${num}_image`]} 
                            alt={data[`about_us_member${num}_name`]} 
                            className="w-full h-full object-cover" 
                        />
                        <div className="absolute bottom-6 left-0 right-0 px-4">
                            <div className="bg-white rounded-xl py-4 px-4 shadow-lg mx-auto w-full max-w-[90%]">
                                <h3 className="headings-web-h6-headline font-bold text-gray-900">
                                    {data[`about_us_member${num}_name`]}
                                </h3>
                                <p className="label-label-2-regular !text-[#71717A] mt-1">
                                    {data[`about_us_member${num}_role`]}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>   
        </section>
      </div>
     </>
    );
};

export default AboutUs;
