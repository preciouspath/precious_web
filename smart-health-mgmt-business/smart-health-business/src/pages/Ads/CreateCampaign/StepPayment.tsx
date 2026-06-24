import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Shield, Lock, CheckCircle, DollarSign, Loader2 } from 'lucide-react';
import { createAdPaymentIntent, confirmAdPayment } from '../../../api/authApi';
import { toast } from 'react-toastify';

interface StepPaymentProps {
  campaignId: string;
  totalBudget: number;
  onPaymentSuccess: () => void;
}

// ─── Inner Form Component (inside Stripe Elements provider) ───
const PaymentForm: React.FC<{
  campaignId: string;
  paymentIntentId: string;
  totalBudget: number;
  onPaymentSuccess: () => void;
}> = ({ campaignId, paymentIntentId, totalBudget, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const processingLock = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || processingLock.current) return;

    processingLock.current = true;
    setIsProcessing(true);

    try {
      console.log("Calling stripe.confirmPayment...");
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/ads/pending',
        },
        redirect: 'if_required',
      });

      console.log("Stripe confirmPayment result:", { error, paymentIntent });

      if (error) {
        console.error("Stripe confirmPayment error:", error);
        
        // If Stripe literally tells us it's already succeeded, we can proceed
        if (error.code === 'payment_intent_unexpected_state' && error.message?.includes('already succeeded')) {
           console.log("Recovering from unexpected state (already succeeded). Calling backend...");
           try {
             const intentId = (error as any).payment_intent?.id || paymentIntentId;
             const res = await confirmAdPayment({ campaignId, paymentIntentId: intentId });
             if (res.data.success) {
               toast.success('Payment successful! Campaign submitted for review.');
               onPaymentSuccess();
               return;
             }
           } catch (e: any) {
             console.error("Backend verification failed after unexpected state:", e);
             toast.error(e?.response?.data?.message || "Backend verification failed.");
           }
        } else {
           // Standard error (card declined, zip invalid, etc.)
           toast.error(error.message || 'Payment failed. Please try again.');
        }
        
        setIsProcessing(false);
        processingLock.current = false;
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log("Stripe succeeded! Calling backend...");
        try {
          await confirmAdPayment({ campaignId, paymentIntentId: paymentIntent.id });
          toast.success('Payment successful! Campaign submitted for review.');
          onPaymentSuccess();
        } catch (confirmErr: any) {
          console.error("Backend confirm error:", confirmErr);
          toast.error(confirmErr?.response?.data?.message || 'Payment received but confirmation failed. Contact support.');
        }
      } else if (paymentIntent) {
        console.warn("Stripe did not error, but status is not succeeded:", paymentIntent.status);
        toast.error(`Payment status: ${paymentIntent.status}. Please check your payment method.`);
      }

      setIsProcessing(false);
      processingLock.current = false;
    } catch (err: any) {
      console.error("Unexpected error in handleSubmit:", err);
      toast.error('An unexpected error occurred processing your payment.');
      setIsProcessing(false);
      processingLock.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-[#9146C1]" />
          </div>
          <div>
            <h3 className="text-sm font-['AeonikBold'] text-slate-900">Card Details</h3>
            <p className="text-[10px] font-['AeonikBold'] text-slate-400 uppercase tracking-widest">Secured by Stripe</p>
          </div>
        </div>

        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-slate-900 text-white text-sm font-['AeonikBold'] shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {isProcessing ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock size={16} />
            Pay ${totalBudget.toFixed(2)} & Submit Campaign
          </>
        )}
      </button>
    </form>
  );
};

// ─── Main StepPayment Component ───────────────────────────────
const StepPayment: React.FC<StepPaymentProps> = ({ campaignId, totalBudget, onPaymentSuccess }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await createAdPaymentIntent({ campaignId });
        const data = res.data?.data || res.data;

        if (data.clientSecret && data.publishableKey) {
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
          setPublishableKey(data.publishableKey);
        } else {
          setError('Failed to initialize payment. Please try again.');
        }
      } catch (err: any) {
        console.error('Payment init error:', err);
        setError(err?.response?.data?.message || 'Failed to initialize payment.');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      initPayment();
    }
  }, [campaignId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 size={40} className="text-[#9146C1] animate-spin" />
        <p className="text-sm font-['AeonikBold'] text-slate-500">Initializing secure payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
          <CreditCard size={28} className="text-rose-500" />
        </div>
        <h3 className="text-lg font-['AeonikBold'] text-slate-900">Payment Error</h3>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-['AeonikBold'] uppercase tracking-widest"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!clientSecret || !publishableKey || !paymentIntentId) {
    return null;
  }

  const stripePromise = loadStripe(publishableKey);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-['AeonikBold'] text-slate-900">Secure Payment</h2>
        <p className="text-slate-500 mt-2">Complete payment to submit your campaign for review.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#9146C1',
              colorBackground: '#ffffff',
              colorText: '#1e293b',
              colorDanger: '#ef4444',
              fontFamily: 'AeonikRegular, system-ui, sans-serif',
              borderRadius: '12px',
              spacingUnit: '4px',
            },
            rules: {
              '.Input': {
                border: '1px solid #e2e8f0',
                boxShadow: 'none',
                padding: '12px 16px',
              },
              '.Input:focus': {
                border: '2px solid #9146C1',
                boxShadow: '0 0 0 3px rgba(145, 70, 193, 0.1)',
              },
              '.Label': {
                fontWeight: '600',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748b',
              },
            }
          }}}>
            <PaymentForm
              campaignId={campaignId}
              paymentIntentId={paymentIntentId}
              totalBudget={totalBudget}
              onPaymentSuccess={onPaymentSuccess}
            />
          </Elements>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-['AeonikBold']">Payment Summary</h3>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                <span className="text-slate-400">Campaign Budget</span>
                <span className="font-['AeonikBold']">${totalBudget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                <span className="text-slate-400">Service Fee</span>
                <span className="font-['AeonikBold'] text-emerald-400">$0.00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Total Charge</span>
                <div className="text-right">
                  <span className="text-3xl font-['AeonikBold'] block">${totalBudget.toFixed(2)}</span>
                  <span className="text-[10px] font-['AeonikBold'] text-purple-400 uppercase tracking-widest mt-1">
                    USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Badges */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-emerald-500" />
              <p className="text-xs font-['AeonikBold'] text-slate-600">256-bit SSL Encryption</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-500" />
              <p className="text-xs font-['AeonikBold'] text-slate-600">PCI DSS Compliant</p>
            </div>
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-emerald-500" />
              <p className="text-xs font-['AeonikBold'] text-slate-600">Secured by Stripe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepPayment;
