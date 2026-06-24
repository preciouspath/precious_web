import React from 'react';
import { Link } from 'react-router-dom';


// Features data interface
interface Feature {
  icon: string;
  bgColor: string;
  title: string;
  description: string;
}

// Features data
const features: Feature[] = [
  {
    icon: '/images/icon1.svg',
    bgColor: 'bg-blue-100',
    title: 'Real-Time Health Monitoring',
    description: 'Connect your smartwatch to track heart rate, steps, blood oxygen, and more in real-time with AI-powered activity detection.'
  },
  {
    icon: '/images/icon2.svg',
    bgColor: 'bg-green-100',
    title: 'QR Code Integration',
    description: 'Doctors can instantly upload prescriptions and reports to your account by scanning your unique QR code.'
  },
  {
    icon: '/images/icon3.svg',
    bgColor: 'bg-yellow-100',
    title: 'OCR Document Processing',
    description: 'Automatic transcription of prescriptions and medical reports using advanced OCR technology for easy reading.'
  },
  {
    icon: '/images/icon4.svg',
    bgColor: 'bg-purple-100',
    title: 'Secure & Private',
    description: 'Your health data is encrypted and stored securely. You control who has access to your medical information.'
  },
  {
    icon: '/images/icon5.svg',
    bgColor: 'bg-red-100',
    title: 'Trusted Doctor Network',
    description: 'Add your trusted doctors and get instant health alerts sent directly to them when anomalies are detected.'
  },
  {
    icon: '/images/icon6.svg',
    bgColor: 'bg-orange-100',
    title: 'Pharmacy Discounts',
    description: 'Receive personalized discounts and offers from nearby pharmacies based on your prescriptions.'
  }
];

// How it works steps data
interface Step {
  number: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Sign Up',
    description: 'Create your account and complete your health profile'
  },
  {
    number: 2,
    title: 'Connect Device',
    description: 'Link your smartwatch for real-time health tracking'
  },
  {
    number: 3,
    title: 'Share QR Code',
    description: 'Let doctors upload prescriptions directly to your account'
  },
  {
    number: 4,
    title: 'Stay Healthy',
    description: 'Monitor your health and get instant alerts'
  }
];


const Home: React.FC = () => {
  return (
    <div className='home-bg'>
      {/* Hero Section */}
      <section className="relative pt-12 bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-4 items-center">
            {/* Left Content */}
            <div className="space-y-6 z-10">
              <h1 className="headings-web-h1-headline text-slate-900 leading-tight">
                Your Smart Health Companion
              </h1>
              <p className="headings-h5-headline !text-[var(--color-gray-500)] max-w-lg !leading-relaxed">
                Manage your health effortlessly with real-time monitoring, secure medical records, and seamless doctor communication—all in one place.
              </p>
              <div>
                <Link to="/login">
                  <button className="btn min-w-[220px]">
                    Start Your Health Journey
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Content - Doctor Image */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Doctor Image Placeholder */}
              <div className="relative z-10 w-full">
                <img 
                  src="/images/hero.png" 
                  alt="Doctor with smartphone" 
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl -z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300/20 rounded-full blur-2xl -z-0"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="headings-web-h2-headline text-slate-900 mb-4">
              Everything You Need for Better Health
            </h2>
            <p className="body-text-body-lg !text-[var(--color-gray-500)] !leading-relaxed">
              Comprehensive health management at your fingertips
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                  <img src={feature.icon} alt={feature.title} />
                </div>
                <h3 className="headings-h4-headline text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="body-text-body-2 !text-[var(--color-gray-500)] !leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-[var(--theme-color-primary-shade-50)]">
        <div className="container">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="headings-web-h2-headline text-slate-900 mb-4">
              How Precious Path Works
            </h2>
            <p className="body-text-body-lg !text-[var(--color-gray-500)] !leading-relaxed">
              Simple steps to better health management
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="bg-white rounded-[8px] shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                {/* Step Number Circle */}
                <div className="w-16 h-16 bg-[var(--theme-color-primary-shade-600)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="headings-h5-headline text-white">
                    {step.number}
                  </span>
                </div>
                
                {/* Step Title */}
                <h3 className="headings-h5-headline text-slate-900 mb-2">
                  {step.title}
                </h3>
                
                {/* Step Description */}
                <p className="body-text-body-2 !text-[var(--color-gray-500)] !leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Home;
