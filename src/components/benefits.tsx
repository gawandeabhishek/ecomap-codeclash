"use client";

import { motion } from "framer-motion";
import { CheckCircle, Users, Globe, Clock, Award } from "lucide-react";

const benefits = [
  {
    icon: CheckCircle,
    title: "Offline-First Reliability",
    description: "Navigate confidently anywhere, even without internet.",
    stats: "99.9% uptime",
  },
  {
    icon: Users,
    title: "Loved by Explorers",
    description: "Join over 500,000 users who trust EcoMap for their journeys.",
    stats: "500K+ users",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Detailed maps for every country and region worldwide.",
    stats: "195 countries",
  },
  {
    icon: Clock,
    title: "Save Time & Data",
    description:
      "Download once, use forever. No more worrying about data usage.",
    stats: "90% data savings",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Why choose <span className="text-gradient">EcoMap Premium</span>
                ?
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Unlock the full power of offline navigation. Premium users enjoy
                unlimited offline caching, advanced features, and priority
                support.
              </p>
            </div>

            <div className="space-y-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                    <span className="inline-flex items-center text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {benefit.stats}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=center"
                alt="Person using EcoMap for outdoor navigation"
                className="rounded-3xl shadow-2xl w-full h-[500px] sm:h-[700px] object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-3xl"></div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                viewport={{ once: true }}
                className="absolute bottom-8 left-8 right-8"
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Adventure Mode Activated
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Navigate confidently through any terrain with our
                    offline-first technology. Your adventure starts here.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
