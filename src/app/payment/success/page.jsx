// src/app/payment/success/page.jsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { handlePaymentSuccess } from '../../../../action'; // Adjust path as needed

const PaymentSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session_id = searchParams.get('session_id');
  const inquiry_id = searchParams.get('inquiry_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inquiryData, setInquiryData] = useState(null);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      if (!session_id || !inquiry_id) {
        setError('Missing payment information');
        setLoading(false);
        return;
      }

      try {
        const response = await handlePaymentSuccess(session_id, inquiry_id);
        
        if (response.success) {
          setInquiryData(response.data);
          
          // Redirect to feed after 3 seconds
          setTimeout(() => {
            router.push('/feed/couple');
          }, 3000);
        } else {
          setError(response.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setError('Failed to verify payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    processPaymentSuccess();
  }, [session_id, inquiry_id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/find-creative')}
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your payment. We're now matching you with the perfect creatives for your special day.
        </p>

        <div className="bg-white rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              We'll match you with qualified creatives in your area
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              You'll receive proposals within 24-48 hours
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Review and connect with your favorite creatives
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Redirecting you to your dashboard in a few seconds...
        </p>

        <button
          onClick={() => router.push('/feed/couple')}
          className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;