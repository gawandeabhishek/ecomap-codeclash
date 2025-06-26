"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Ready to unlock full offline navigation?
            </h2>

            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Upgrade to EcoMap Premium and enjoy unlimited offline caching,
              advanced navigation, and priority support. Start your journey
              today!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Button
              size="lg"
              className="group bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg"
              onClick={() => (window.location.href = "/payment")}
            >
              Go Premium
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-white/70 text-sm"
          >
            No credit card required • Free forever plan available
          </motion.div>
        </div>
      </div>
    </section>
  );
}
