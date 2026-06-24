import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, ShieldCheck } from 'lucide-react';
import {
    validateCoupon,
    createSubscriptionPayment,
    verifySubscriptionPayment,
    // downgradeSubscription,
    getSubscriptionStatus,
    getSubscriptionPlans
} from '../api/subscriptionApi';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';

interface Plan {
    planId: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    description: string;
    features: string[];
}

// ─── Main Subscription Component ────────────────────────────────────────────
const Subscription: React.FC = () => {
    const { fetchMe } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();

    // Plan & subscription state
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | null>(null);
    const [isExpiredPremium, setIsExpiredPremium] = useState(false);

    // Modal state
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    // const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [originalAmount, setOriginalAmount] = useState(0);
    const [finalAmount, setFinalAmount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponMessage, setCouponMessage] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    // Payment state
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    // Fetch initial subscription data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoadingPlans(true);
                const [statusRes, plansRes] = await Promise.all([
                    getSubscriptionStatus(),
                    getSubscriptionPlans()
                ]);

                if (statusRes.data.success) {
                    const statusData = statusRes.data.data;
                    setCurrentPlan(statusData.plan);
                    if (statusData.endDate) {
                        setSubscriptionEndDate(new Date(statusData.endDate));
                    }
                    if (statusData.isExpired) {
                        setIsExpiredPremium(true);
                    }
                }

                if (plansRes.data.success) {
                    setPlans(plansRes.data.data);
                    // Set premium plan price
                    const premiumPlan = plansRes.data.data.find((p: Plan) => p.planId === 'premium');
                    if (premiumPlan) {
                        setOriginalAmount(premiumPlan.price);
                        setFinalAmount(premiumPlan.price);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch subscription data", error);
                toast.error("Failed to load subscription plans");
            } finally {
                setIsLoadingPlans(false);
            }
        };
        fetchInitialData();
    }, []);

    // Check for payment redirect from Stripe Checkout
    useEffect(() => {
        const checkPaymentStatus = async () => {
            const paymentStatus = searchParams.get('payment');
            const sessionId = searchParams.get('session_id');

            if (paymentStatus === 'success' && sessionId) {
                setIsProcessing(true);
                try {
                    await verifySubscriptionPayment(sessionId);
                    setPaymentResult('success');
                    setCurrentPlan('premium');
                    fetchMe();
                    setShowUpgradeModal(true);
                    toast.success('Payment successful! Your subscription has been activated.');
                } catch (error) {
                    console.error("Verification error:", error);
                    setPaymentResult('failed');
                    setPaymentError('Could not verify payment. Please check your subscription status or contact support.');
                    setShowUpgradeModal(true);
                } finally {
                    setIsProcessing(false);
                    // Remove query params
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('payment');
                    newParams.delete('session_id');
                    setSearchParams(newParams, { replace: true });
                }
            } else if (paymentStatus === 'cancel') {
                setPaymentResult('failed');
                setPaymentError('Payment was cancelled.');
                setShowUpgradeModal(true);
                // Remove query params
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('payment');
                setSearchParams(newParams, { replace: true });
            }
        };
        checkPaymentStatus();
    }, [searchParams, setSearchParams, fetchMe]);

    // ─── Coupon Handlers ─────────────────────────────────────────────────────
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        try {
            setIsValidating(true);
            setCouponMessage('');
            const response = await validateCoupon(couponCode.trim(), 'premium');

            if (response.data.success) {
                const data = response.data.data;
                setDiscount(data.discountAmount);
                setOriginalAmount(data.originalAmount);
                setFinalAmount(data.finalAmount);
                setCouponApplied(true);
                setCouponMessage(`${data.discountType === 'flat' ? `$${data.discountAmount} off` : `${data.discountPercentage}% off`} applied!`);
                toast.success(response.data.message);
            }
        } catch (error: any) {
            setDiscount(0);
            setFinalAmount(originalAmount);
            setCouponApplied(false);
            const message = error.response?.data?.message || 'Failed to validate coupon';
            setCouponMessage('');
            toast.error(message);
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveCoupon = () => {
        setDiscount(0);
        setFinalAmount(originalAmount);
        setCouponApplied(false);
        setCouponCode('');
        setCouponMessage('');
        toast.info('Coupon removed');
    };

    // ─── Plan Click Handlers ─────────────────────────────────────────────────
    const handleFreePlanClick = () => {
        if (currentPlan === 'free') {
            toast.info('You are already on the Free Plan.');
            return;
        }
        // Premium users cannot downgrade — they must wait for expiry or contact support
        toast.info('You are on the Premium Plan. Your plan will expire at the end of the billing cycle.');
    };

    const handlePremiumPlanClick = () => {
        if (currentPlan === 'premium') {
            toast.info('You are already on the Premium Plan.');
        } else {
            // Reset state when opening modal
            setPaymentResult(null);
            setPaymentError('');
            setShowUpgradeModal(true);
        }
    };

    // ─── Payment Handlers ────────────────────────────────────────────────────
    const handleProceedToPayment = async () => {
        try {
            setIsProcessing(true);
            setPaymentError('');

            const response = await createSubscriptionPayment(
                'premium',
                couponApplied ? couponCode.trim() : undefined
            );

            if (response.data.success) {
                const data = response.data.data;

                if (!data.requiresPayment) {
                    // 100% discount — subscription activated directly
                    setPaymentResult('success');
                    setCurrentPlan('premium');
                    fetchMe();
                    toast.success('Subscription activated with full discount!');
                    return;
                }

                // Redirect to Stripe Checkout
                if (data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                } else {
                    toast.error('Did not receive checkout URL');
                }
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to initiate payment';
            setPaymentError(message);
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCloseModal = () => {
        setShowUpgradeModal(false);
        setPaymentResult(null);
        setPaymentError('');
        setCouponCode('');
        setCouponApplied(false);
        setDiscount(0);
        setFinalAmount(originalAmount);
        setCouponMessage('');
    };

    const handleRetryPayment = () => {
        setPaymentResult(null);
        setPaymentError('');
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <section className="py-10 lg:py-18">
            <div className="container">
                <div className="bg-white rounded-[15px]">
                    {/* Header */}
                    <div className="flex justify-between items-center p-[15px] border-b border-[#F1F5F9]">
                        <h1 className="headings-web-h4-headline bold text-[#374151]">
                            Subscription Management
                        </h1>
                    </div>

                    {/* Content */}
                    <div className="p-[15px] md:p-[20px]">
                        <h2 className="headings-web-h4-headline text-[var(--color-gray-700)] mb-2">
                            Choose Plan
                        </h2>
                        <p className="text-[16px] text-[var(--color-gray-700)] mb-8">
                            Choose the plan that best fits your needs.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px]">
                            {isLoadingPlans ? (
                                <div className="col-span-2 text-center py-10">Loading plans...</div>
                            ) : (
                                plans.map((plan) => (
                                    <div
                                        key={plan.planId}
                                        onClick={() => {
                                            if (plan.planId === 'free') {
                                                handleFreePlanClick();
                                            } else {
                                                handlePremiumPlanClick();
                                            }
                                        }}
                                        className="relative rounded-[10px] border bg-[#F1F5F9] border-[#F1F5F9] shadow-[0px_3px_24px_rgba(0,0,0,0.05)] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex justify-between bg-[#F1F5F9] py-[20px] md:py-[25px] px-[15px]">
                                            <div>
                                                <h3 className="headings-web-h4-headline text-[var(--black-white-black)] mb-[4px]">
                                                    {plan.name}
                                                </h3>
                                                <div className="headings-web-h3-headline text-[var(--theme-color-primary-shade-600)]">
                                                    {plan.price === 0 ? 'FREE' : `$${plan.price.toFixed(2)}${plan.interval === 'monthly' ? '/mo' : '/yr'}`}
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 ${currentPlan === plan.planId ? 'bg-[#9146C1] border-[#9146C1]' : 'border-slate-300'} flex items-center justify-center`}>
                                                {currentPlan === plan.planId && <span className="text-white text-xs">✓</span>}
                                            </div>
                                        </div>

                                        <ul className="space-y-4 text-[14px] text-[var(--color-slate-500)] bg-white shadow-[0px_3px_24px_rgba(0,0,0,0.05)] p-[15px] rounded-[10px]">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex gap-3">
                                                    <span><img src="/images/double-tik.svg" /></span> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-[#F1F5F9]">
                            {/* Professional Status Banner */}
                            {currentPlan === 'free' && (
                                <div className="mb-8 p-6 bg-amber-50/50 border border-amber-100 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[16px] font-bold text-amber-900 leading-tight">Free Trial Period</h4>
                                            <p className="text-[13px] text-amber-700 mt-1">
                                                {subscriptionEndDate 
                                                    ? `Your free access will exhaust in ${Math.ceil((subscriptionEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days (${subscriptionEndDate.toLocaleDateString()})`
                                                    : 'Your free access is currently active. Upgrade to Premium for unlimited services.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePremiumPlanClick}
                                        className="btn px-8 py-3 w-full md:w-auto shadow-lg shadow-amber-200/50 bg-[#9146C1] hover:bg-[#7a39a5]"
                                        id="upgrade-premium-btn"
                                    >
                                        Upgrade To Premium
                                    </button>
                                </div>
                            )}

                            {currentPlan === 'premium' && subscriptionEndDate && !isExpiredPremium && (
                                <div className="mb-8 p-6 bg-green-50/50 border border-green-100 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[16px] font-bold text-green-900 leading-tight">Premium Plan Active</h4>
                                            <p className="text-[13px] text-green-700 mt-1">
                                                Your subscription is active and will renew on <strong>{subscriptionEndDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        disabled
                                        className="btn px-8 py-3 w-full md:w-auto opacity-60 cursor-not-allowed bg-green-600"
                                    >
                                        ✓ Active
                                    </button>
                                </div>
                            )}

                            {isExpiredPremium && (
                                <div className="mb-8 p-6 bg-red-50/50 border border-red-100 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[16px] font-bold text-red-900 leading-tight">Subscription Expired</h4>
                                            <p className="text-[13px] text-red-700 mt-1">
                                                Your Premium plan has expired. Renew now to restore all features.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePremiumPlanClick}
                                        className="btn px-8 py-3 w-full md:w-auto bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200/50"
                                    >
                                        Renew Premium
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Upgrade Modal ─────────────────────────────────────────────────── */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[510px] rounded-[15px] overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-[20px]">
                            <h3 className="headings-web-h5-headline text-slate-800">
                                {paymentResult === 'success'
                                    ? '🎉 Payment Successful'
                                    : paymentResult === 'failed'
                                        ? '❌ Payment Failed'
                                        : 'Premium Plan'}
                            </h3>
                            <button onClick={handleCloseModal} id="close-upgrade-modal-btn">
                                <img src="/images/close.svg" alt="close" />
                            </button>
                        </div>

                        <div className="p-[20px] pt-0">
                            {/* ─── Success Result ─────────────────────────────────────── */}
                            {paymentResult === 'success' && (
                                <div className="text-center py-6">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Subscription Activated!</h4>
                                    <p className="text-slate-600 mb-6">
                                        Your Premium plan is now active. Enjoy all premium features!
                                    </p>
                                    <button
                                        onClick={handleCloseModal}
                                        className="btn px-8"
                                        id="payment-success-close-btn"
                                    >
                                        Continue
                                    </button>
                                </div>
                            )}

                            {/* ─── Failure Result ────────────────────────────────────── */}
                            {paymentResult === 'failed' && (
                                <div className="text-center py-6">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Payment Failed</h4>
                                    <p className="text-slate-600 mb-2">
                                        {paymentError || 'Your payment could not be processed.'}
                                    </p>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Please check your card details and try again.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={handleRetryPayment}
                                            className="btn px-6"
                                            id="payment-retry-btn"
                                        >
                                            Try Again
                                        </button>
                                        <button
                                            onClick={handleCloseModal}
                                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ─── Coupon & Summary (Pre-payment) ────────────────────── */}
                            {!paymentResult && (
                                <>
                                    <p className="text-[16px] !text-[var(--color-gray-700)] mb-3">
                                        Enter your promo code below to save on your subscription plan.
                                    </p>

                                    {/* Coupon Input */}
                                    <div className="bg-[#F1F5F9] rounded-[10px] p-[15px]">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter coupon code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                disabled={couponApplied}
                                                id="coupon-code-input"
                                            />
                                            {couponApplied ? (
                                                <button
                                                    onClick={handleRemoveCoupon}
                                                    className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium whitespace-nowrap"
                                                    id="remove-coupon-btn"
                                                >
                                                    Remove
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    disabled={isValidating}
                                                    className="btn px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    id="apply-coupon-btn"
                                                >
                                                    {isValidating ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                            Validating...
                                                        </span>
                                                    ) : 'Apply'}
                                                </button>
                                            )}
                                        </div>
                                        {couponApplied && couponMessage && (
                                            <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                {couponMessage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Price Summary */}
                                    <div className="space-y-3 pt-4 border border-[#F1F5F9] mt-[15px] p-[15px] rounded-[10px]">
                                        <h3 className='headings-h6-headline text-[var(--color-gray-700)]'>Summary</h3>
                                        <div className="flex justify-between text-[14px] text-slate-600">
                                            <span className='text-[16px] medium text-[var(--color-gray-700)]'>Subtotal</span>
                                            <span className='text-[16px] medium text-[var(--color-gray-700)]'>${originalAmount.toFixed(2)}</span>
                                        </div>

                                        {discount > 0 && (
                                            <div className="flex justify-between text-[14px] text-green-600">
                                                <div className="flex items-center gap-2">
                                                    <span>Discount</span>
                                                </div>
                                                <span>- ${discount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-[16px] font-bold text-slate-900 pt-2 border-t border-[#F1F5F9]">
                                            <span className='headings-h6-headline text-[var(--color-gray-700)]'>Total to pay</span>
                                            <span className='headings-h6-headline text-[var(--color-gray-700)]'>${finalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Error Message */}
                                    {paymentError && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                            {paymentError}
                                        </div>
                                    )}

                                    {/* Proceed to Payment Button */}
                                    <button
                                        onClick={handleProceedToPayment}
                                        disabled={isProcessing}
                                        className="btn mt-8 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                        id="proceed-to-payment-btn"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Preparing Payment...
                                            </span>
                                        ) : (
                                            `Proceed to Payment${finalAmount > 0 ? ` — $${finalAmount.toFixed(2)}` : ''}`
                                        )}
                                    </button>

                                    {/* Secure Payment Badge */}
                                    <p className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Secured by Stripe. Your payment info is encrypted.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Subscription;
