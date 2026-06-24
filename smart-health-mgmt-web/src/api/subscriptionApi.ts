import axiosClient from './axiosClient';

/**
 * Validate a coupon code and get discount calculations for a plan.
 * Returns: discountAmount, finalAmount, discountPercentage, discountType, originalAmount
 */
export const validateCoupon = (code: string, planId: string = 'premium') => {
    return axiosClient.post('/subscription/validate-coupon', { code, planId });
};

/**
 * Create a Stripe PaymentIntent for a subscription upgrade.
 * Backend validates coupon server-side and returns clientSecret.
 */
export const createSubscriptionPayment = (planId: string, couponCode?: string) => {
    return axiosClient.post('/payment/create-subscription-payment', { planId, couponCode });
};

export const verifySubscriptionPayment = (id: string) => {
    const isSessionId = id.startsWith('cs_');
    return axiosClient.post('/payment/verify-subscription-payment', {
        [isSessionId ? 'sessionId' : 'paymentIntentId']: id
    });
};

/**
 * Upgrade subscription (legacy — now handled via payment flow)
 */
export const upgradeSubscription = (planId: string, promoCode?: string) => {
    return axiosClient.post('/subscription/upgrade', { planId, promoCode });
};

export const downgradeSubscription = () => {
    return axiosClient.post('/subscription/downgrade');
};

export const getSubscriptionStatus = () => {
    return axiosClient.get('/subscription/status');
};

export const getSubscriptionPlans = () => {
    return axiosClient.get('/subscription/plans');
};
