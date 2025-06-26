"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { MapPin, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useAuth();
  const [subStatus, setSubStatus] = useState<null | boolean>(null);

  useEffect(() => {
    fetch("/api/payment/status")
      .then((res) => res.json())
      .then((data) => setSubStatus(!!data.active));
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EcoMap</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Benefits
            </a>
            <a
              href="#testimonials"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Reviews
            </a>
            <a
              href="#pricing"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Pricing
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user.sessionId ? (
              <Link
                href="/navigation"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "text-sm font-semibold"
                )}
              >
                Navigate
              </Link>
            ) : (
              <Link
                href="/auth/sign-in"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-primary hover:bg-primary/90 text-white"
                )}
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <div className="flex items-center gap-4">
            {user.sessionId &&
              subStatus !== null &&
              (subStatus ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold text-sm">
                  Premium
                </span>
              ) : (
                <Link href="/payment">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm cursor-pointer hover:bg-yellow-200 transition">
                    Free
                  </span>
                </Link>
              ))}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-gray-100"
          >
            <nav className="flex flex-col space-y-4">
              <a
                href="#features"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Benefits
              </a>
              <a
                href="#testimonials"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Reviews
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Pricing
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                {user.sessionId ? (
                  <Link
                    href="/navigation"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "text-sm font-semibold"
                    )}
                  >
                    Navigate
                  </Link>
                ) : (
                  <Link
                    href="/auth/sign-in"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "bg-primary hover:bg-primary/90 text-white"
                    )}
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
