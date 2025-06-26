"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  CreditCard,
  Loader2,
  ArrowLeft,
  Shield,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { redirect } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const PLAN_AMOUNT = 1000; // ₹1000

  useEffect(() => {
    checkSubscriptionStatus();
    loadRazorpayScript();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const res = await fetch("/api/payment/status");
      const status = await res.json();
      setHasSubscription(status.active);
      setSubscriptionDetails(null);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasSubscription(false);
    }
  };

  const loadRazorpayScript = () => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () =>
      setError("Failed to load payment gateway. Please refresh and try again.");
    document.body.appendChild(script);
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      setError("Payment gateway not loaded. Please refresh and try again.");
      return;
    }

    if (!RAZORPAY_KEY_ID) {
      setError("Payment configuration error. Please contact support.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call backend to create a real Razorpay order
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: PLAN_AMOUNT * 100, currency: "INR" }),
      });
      const orderData = await res.json();
      if (!res.ok) {
        setError(orderData.error?.description || "Failed to create order");
        setLoading(false);
        return;
      }
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EcoMap Navigator",
        description: "Premium Offline Navigation Subscription - Monthly Plan",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verificationResult = await verifyRes.json();
            if (verificationResult.success) {
              setSuccess(true);
              setHasSubscription(true);
              setSubscriptionDetails(null);
              toast.success("Payment successful! Premium features activated.");
              setTimeout(() => {
                redirect("/navigation");
              }, 3000);
            } else {
              setError(
                verificationResult.message ||
                  "Payment verification failed. Please contact support."
              );
              toast.error("Payment verification failed");
            }
          } catch (error: any) {
            setError(
              error.message ||
                "Payment verification failed. Please contact support."
            );
            toast.error("Payment verification failed");
          } finally {
            setLoading(false);
            redirect("/navigation");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999",
        },
        notes: {
          plan: "premium_monthly",
          amount: PLAN_AMOUNT,
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info("Payment cancelled");
          },
          confirm_close: true,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        timeout: 300, // 5 minutes
        remember_customer: true,
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        toast.error("Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      setError(
        error.message || "Failed to initiate payment. Please try again."
      );
      toast.error("Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will lose access to premium features."
      )
    ) {
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setHasSubscription(false);
      setSubscriptionDetails(null);
      toast.success("Subscription cancelled (mocked)");
      setLoading(false);
    }, 1000);
  };

  if (hasSubscription === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">
                Checking subscription status...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasSubscription && subscriptionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="text-center shadow-2xl">
            <CardHeader>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => redirect("/navigation")}
                className="absolute top-4 left-4 h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Premium Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                You have an active premium subscription. Enjoy unlimited offline
                navigation and premium features!
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600 capitalize">
                      {subscriptionDetails.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium capitalize">
                      {subscriptionDetails.plan || "Premium Monthly"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">
                      {new Date(
                        subscriptionDetails.expiresAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => redirect("/navigation")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Navigation
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => redirect("/navigation")}
              className="absolute top-4 left-4 h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl text-gray-900 mb-2">
              Unlock Premium Navigation
            </CardTitle>
            <p className="text-gray-600">
              Get unlimited offline maps and advanced navigation features
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Premium Features:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Unlimited offline map downloads
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Turn-by-turn voice navigation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Advanced route optimization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Priority customer support
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  No ads, unlimited usage
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Real-time traffic updates
                </li>
              </ul>
            </div>

            {/* Pricing */}
            <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900">
                ₹{PLAN_AMOUNT}
              </div>
              <div className="text-gray-600">per month</div>
              <div className="text-sm text-green-600 mt-1 flex items-center justify-center">
                <Shield className="w-4 h-4 mr-1" />
                30-day money-back guarantee
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Payment successful! Your premium features are now active.
                  Redirecting to navigation...
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={loading || success || !razorpayLoaded}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing Payment...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Payment Successful!
                </>
              ) : !razorpayLoaded ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading Payment Gateway...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹{PLAN_AMOUNT} Securely
                </>
              )}
            </Button>

            {/* Security Info */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>Instant Activation</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Secure payment powered by Razorpay. Your card details are
              encrypted and never stored on our servers.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentPage;
