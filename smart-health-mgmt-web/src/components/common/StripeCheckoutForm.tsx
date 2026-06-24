import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';

interface StripeCheckoutFormProps {
    onSuccess: () => void;
    totalAmount: number;
    buttonText?: string;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({ 
    onSuccess, 
    totalAmount, 
    buttonText = "Pay Now" 
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            return;
        }

        setIsProcessing(true);

        // Confirm the payment using the elements.
        // redirect: "if_required" prevents a full page redirect for cards that do not require 3DS.
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required, even if we are not redirecting strictly
                return_url: window.location.origin + "/subscription",
            },
            redirect: "if_required"
        });

        if (error) {
            // This point will only be reached if there is an immediate error when
            // confirming the payment. Otherwise, your customer will be redirected to
            // your `return_url`. For some payment methods like iDEAL, your customer will
            // be redirected to an intermediate site first to authorize the payment, then
            // redirected to the `return_url`.
            toast.error(error.message || "An unexpected error occurred.");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // The payment has succeeded. 
            // Trigger the success callback to sync with the backend.
            onSuccess();
        } else {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6">
                <PaymentElement 
                    options={{ layout: 'tabs' }} 
                />
            </div>
            
            <button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className="btn w-full mt-4 flex items-center justify-center p-3 rounded-lg text-white font-semibold transition-all"
                style={{ backgroundColor: '#9146C1' }}
            >
                {isProcessing ? 'Processing Payment...' : `${buttonText} ($${totalAmount.toFixed(2)})`}
            </button>
        </form>
    );
};

export default StripeCheckoutForm;
