"use client"

import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const plans = [
  {
    name: "Explorer",
    price: "Free",
    period: "forever",
    description: "Perfect for casual users and weekend adventurers",
    features: [
      "Basic offline maps",
      "Up to 3 saved locations",
      "Standard navigation",
      "Community support",
      "Basic search functionality"
    ],
    buttonText: "Get Started",
    popular: false
  },
  {
    name: "Navigator",
    price: "12",
    period: "month",
    description: "Ideal for frequent travelers and outdoor enthusiasts",
    features: [
      "Premium offline maps",
      "Unlimited saved locations",
      "Advanced navigation features",
      "Priority support",
      "Detailed POI database",
      "Route optimization",
      "Weather integration",
      "Export capabilities"
    ],
    buttonText: "Start Free Trial",
    popular: true
  },
  {
    name: "Professional",
    price: "29",
    period: "month",
    description: "Built for businesses and professional use cases",
    features: [
      "Everything in Navigator",
      "Team collaboration tools",
      "Advanced analytics",
      "Custom map layers",
      "API access",
      "White-label options",
      "Dedicated support",
      "Enterprise security"
    ],
    buttonText: "Contact Sales",
    popular: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Choose your <span className="text-gradient">adventure plan</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our free plan and upgrade as your navigation needs grow. 
            All plans include our core offline-first technology.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>Most Popular</span>
                  </span>
                </div>
              )}
              
              <Card className={`h-full ${plan.popular ? 'border-primary shadow-xl scale-105' : 'border-gray-200'} transition-all duration-300 hover:shadow-lg pt-6`}>
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price === "Free" ? "Free" : `$${plan.price}`}
                    </span>
                    {plan.price !== "Free" && (
                      <span className="text-gray-600">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'bg-white border border-primary text-primary hover:bg-primary hover:text-white'
                    }`}
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-4">
            All plans include 30-day money-back guarantee
          </p>
          <div className="flex flex-wrap justify-center items-center space-x-8 text-sm text-gray-500">
            <span>✓ No setup fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 24/7 support</span>
            <span>✓ Secure payments</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}