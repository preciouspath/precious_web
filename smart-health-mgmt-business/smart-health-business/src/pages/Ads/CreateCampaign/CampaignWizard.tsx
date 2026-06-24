import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Rocket, CreditCard } from 'lucide-react';
import StepObjective from './StepObjective';
import StepAudience from './StepAudience';
import StepPlacement from './StepPlacement';
import StepBudget from './StepBudget';
import StepCreative from './StepCreative';
import StepReview from './StepReview';
import StepPayment from './StepPayment';
import { toast } from 'react-toastify';
import { createAd } from '../../../api/authApi';

const steps = [
  { id: 'objective', title: 'Objective' },
  { id: 'audience', title: 'Audience' },
  { id: 'placement', title: 'Placement' },
  { id: 'budget', title: 'Budget' },
  { id: 'creative', title: 'Creative' },
  { id: 'review', title: 'Review' },
  { id: 'payment', title: 'Payment' },
];

const CampaignWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    objective: 'reach',
    locations: [] as any[],
    ageRange: { min: 18, max: 65 },
    genders: ['all'],
    interests: [] as string[],
    placement: 'dashboard_banner',
    dailyBudget: 10,
    duration: 7,
    billingModel: 'cpm' as 'cpm' | 'cpc',
    startDate: new Date().toISOString().split('T')[0],
    creativeType: 'image' as 'image',
    headline: '',
    description: '',
    ctaType: 'learn_more',
    ctaLink: '',
    imageFile: null as File | null,
    imageUrl: '',
  });

  const updateFormData = (fields: any) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Audience
        if (formData.locations.length === 0) {
          toast.error("Please select at least one location.");
          return false;
        }
        if (formData.interests.length === 0) {
          toast.error("Please select at least one health interest.");
          return false;
        }
        if (formData.genders.length === 0) {
          toast.error("Please select at least one gender.");
          return false;
        }
        return true;
      case 4: // Creative
        if (!formData.headline.trim()) {
          toast.error("Please enter a headline.");
          return false;
        }
        if (!formData.description.trim()) {
          toast.error("Please enter a description.");
          return false;
        }
        if (!formData.ctaLink.trim()) {
          toast.error("Please enter a destination URL (CTA Link).");
          return false;
        }
        if (!formData.imageFile && !formData.imageUrl) {
          toast.error("Please upload a banner image.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    // Step 5 (Review, index 5) → clicking "Continue" creates the campaign as draft, then goes to payment step
    if (currentStep === 5) {
      submitCampaignDraft();
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Don't allow going back from payment step once campaign is created
      if (currentStep === 6) return;
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // Creates the campaign as DRAFT, then moves to payment step
  const submitCampaignDraft = async () => {
    try {
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append('name', formData.headline || `Campaign ${Date.now()}`);
      payload.append('objective', formData.objective);
      payload.append('totalBudget', (formData.dailyBudget * formData.duration).toString());
      payload.append('dailyBudget', formData.dailyBudget.toString());
      payload.append('startDate', formData.startDate);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + formData.duration);
      payload.append('endDate', endDate.toISOString());
      payload.append('billingModel', formData.billingModel);

      // Targeting
      payload.append('targeting', JSON.stringify({
        locations: formData.locations,
        ageRange: formData.ageRange,
        genders: formData.genders,
        interests: formData.interests
      }));

      payload.append('placement', formData.placement);
      payload.append('creativeType', formData.creativeType);
      payload.append('headline', formData.headline);
      payload.append('description', formData.description);
      payload.append('ctaType', formData.ctaType);
      payload.append('ctaLink', formData.ctaLink);

      if (formData.imageFile) {
        payload.append('image', formData.imageFile);
      }

      const response = await createAd(payload);

      if (response.data.success) {
        const newCampaignId = response.data.data.campaignId;
        setCampaignId(newCampaignId);
        // Move to payment step
        setCurrentStep(6);
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    navigate('/ads/pending');
  };

  const totalBudget = formData.dailyBudget * formData.duration;

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepObjective selected={formData.objective} onSelect={(id) => updateFormData({ objective: id })} />;
      case 1: return <StepAudience data={formData} updateData={updateFormData} />;
      case 2: return <StepPlacement selected={formData.placement} onSelect={(id) => updateFormData({ placement: id })} />;
      case 3: return <StepBudget data={formData} updateData={updateFormData} />;
      case 4: return <StepCreative data={formData} updateData={updateFormData} />;
      case 5: return <StepReview data={formData} />;
      case 6: return campaignId ? (
        <StepPayment
          campaignId={campaignId}
          totalBudget={totalBudget}
          onPaymentSuccess={handlePaymentSuccess}
        />
      ) : null;
      default: return null;
    }
  };

  // Don't show footer nav on payment step (payment has its own submit button)
  const showFooterNav = currentStep < 6;

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-6 font-['AeonikRegular']">
      {/* Header & Stepper */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-['AeonikBold'] text-slate-900 flex items-center gap-3">
            <Rocket className="text-[#9146C1]" size={32} /> Create Smart Campaign
          </h1>
          <div className="text-sm font-['AeonikBold'] text-slate-400 uppercase tracking-widest">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        <div className="flex gap-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-[#9146C1]' : 'bg-slate-100'
                }`} />
              <p className={`text-[10px] font-['AeonikBold'] uppercase tracking-widest mt-2 transition-colors flex items-center gap-1 ${idx === currentStep ? 'text-[#9146C1]' : 'text-slate-400'
                }`}>
                {step.id === 'payment' && <CreditCard size={10} />}
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Controls - Hidden on payment step */}
      {showFooterNav && (
        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-['AeonikBold'] text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-10 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-['AeonikBold'] shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              "Creating Campaign..."
            ) : currentStep === 5 ? (
              <>Proceed to Payment <CreditCard size={18} /></>
            ) : (
              <>Continue <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignWizard;
