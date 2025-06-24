"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Globe, MapPin, Star, WifiOff } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-24 pb-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
              >
                <WifiOff className="w-4 h-4" />
                <span>Offline-First Technology</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Navigate anywhere,{" "}
                <span className="text-gradient">anytime</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                The most reliable offline-first mapping solution. Download once,
                navigate forever - from bustling cities to remote wilderness.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-white px-8"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              {/* <Button size="lg" variant="outline" className="group border-primary text-primary hover:bg-primary hover:text-white px-8">
                <Download className="w-4 h-4 mr-2" />
                Download App
              </Button> */}
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">500K+</div>
                <div className="text-sm text-gray-600 mt-1">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600 mt-1">Uptime</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center text-3xl font-bold text-gray-900">
                  4.8
                  <Star className="w-6 h-6 text-yellow-400 fill-current ml-1" />
                </div>
                <div className="text-sm text-gray-600 mt-1">App Rating</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl transform rotate-6"></div>
              <img
                src="https://images.unsplash.com/photo-1587813167683-a8717be30717?w=600&h=600&fit=crop&crop=center"
                alt="EcoMap interface showing offline maps"
                className="relative rounded-3xl shadow-2xl w-full h-[600px] object-cover ml-8 sm:ml-0"
              />

              {/* Floating status cards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-4 -left-4 animate-float ml-8 sm:mt-0"
              >
                <Card className="p-4 bg-white shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full pulse-ring"></div>
                    </div>
                    <span className="text-sm font-medium">Offline Ready</span>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-4 -right-4 animate-float-delayed"
              >
                <Card className="p-4 bg-white shadow-xl">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">12 Locations</div>
                      <div className="text-xs text-gray-500">Saved Offline</div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute top-1/2 -left-8 animate-float ml-8 sm:ml-0"
              >
                <Card className="p-3 bg-white shadow-xl">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium">195 Countries</span>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
