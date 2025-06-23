"use client"

import { motion } from 'framer-motion';
import { 
  Map, 
  Search, 
  Navigation, 
  Share, 
  Shield,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Map,
    title: 'Offline Maps',
    description: 'Download detailed maps for any region and access them without internet connection.',
    image: 'https://images.unsplash.com/photo-1627666260660-812e4684a600?w=400&h=300&fit=crop'
  },
  {
    icon: Navigation,
    title: 'GPS Navigation', 
    description: 'Turn-by-turn navigation that works even in remote areas without cell coverage.',
    image: 'https://images.unsplash.com/photo-1486520299386-6d106b22014b?w=400&h=300&fit=crop'
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Find locations, addresses, and points of interest instantly, even offline.',
    image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop'
  },
  {
    icon: Share,
    title: 'Location Sharing',
    description: 'Share your location and routes with friends and family safely.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your location data stays on your device. No tracking, no data collection.',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and efficiency. Quick startup, instant search results.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Everything you need for{' '}
            <span className="text-gradient">reliable navigation</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for adventurers, professionals, and everyday users who need maps they can count on, 
            no matter where they are or what the connection is like.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group border-gray-100 hover:border-primary/20">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center space-x-3">
                    <feature.icon className="w-6 h-6 text-primary" />
                    <span>{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}