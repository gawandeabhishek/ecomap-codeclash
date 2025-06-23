"use client"

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Outdoor Guide",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b829?w=60&h=60&fit=crop&crop=face",
    content: "EcoMap has been a game-changer for our hiking expeditions. The offline functionality works flawlessly even in the most remote locations.",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "Travel Blogger",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
    content: "I've traveled to 47 countries and EcoMap has never let me down. The download-once approach saves me so much on roaming charges.",
    rating: 5
  },
  {
    name: "Emily Johnson",
    role: "Urban Planner",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face",
    content: "The accuracy and detail of EcoMap's offline maps are incredible. It's become an essential tool for our field research work.",
    rating: 5
  },
  {
    name: "David Kim",
    role: "Adventure Photographer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face",
    content: "Whether I'm in the mountains or exploring urban landscapes, EcoMap helps me discover hidden gems that other apps miss.",
    rating: 5
  },
  {
    name: "Lisa Thompson",
    role: "Delivery Driver",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop&crop=face",
    content: "EcoMap's reliability has improved my delivery efficiency tremendously. No more losing signal in dead zones or tunnels.",
    rating: 5
  },
  {
    name: "James Wilson",
    role: "Marine Biologist",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face",
    content: "For coastal research expeditions, EcoMap's offline capabilities are unmatched. It works perfectly even on remote islands.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Trusted by <span className="text-gradient">professionals</span> worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From outdoor enthusiasts to urban professionals, see why thousands choose EcoMap 
            for their navigation needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300 border-gray-100">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                  <p className="text-gray-700 leading-relaxed pl-6">
                  &quot;{testimonial.content}&quot;
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">500K+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">4.8★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-gray-900">195</div>
              <div className="text-gray-600">Countries Covered</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}