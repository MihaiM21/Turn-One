"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ObfuscatedEmail } from "@/components/ui/obfuscated-email";
import {MainNav} from "@/components/navigation/main-nav";

export default function ApiLaunchPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showQ2, setShowQ2] = useState(false);

  // Alternate between "soon" and "Q2 2026" every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowQ2((prev) => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
        (process.env.NODE_ENV === 'development' ? 'http://localhost:5271/api' : 'https://backend.t1f1.com/api');
      
      const response = await fetch(`${API_URL}/ApiWishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }
      
      setIsSubmitted(true);
      toast.success("You're on the list! We'll notify you when we launch.");
      setEmail("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden ">
      <MainNav />
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-red-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-red-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-8"
        >
          <div className="relative">
            <Rocket className="w-24 h-24 text-red-500" />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white mb-4"
        >
          T1 API
        </motion.h1>

        {/* Subheading with animated text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-4xl text-gray-300 mb-6 flex items-center gap-3 flex-wrap justify-center"
        >
          <span>Launching</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={showQ2 ? "q2" : "soon"}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="font-bold text-red-500 min-w-[180px] inline-block"
            >
              {showQ2 ? "Q2 2026" : "soon"}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12"
        >
          Access real-time Formula 1 data, live timing, race statistics, and more.
          Join the wishlist to be notified when we go public.
        </motion.p>

        {/* Wishlist form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-md"
        >
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 h-12 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-8 bg-red-500 hover:bg-red-600 text-white font-semibold"
              >
                Join Wishlist
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-semibold">You're on the list!</span>
            </motion.div>
          )}
        </motion.div>

        {/* Features preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"
        >
          {[
            { title: "Live Timing", desc: "Real-time race data" },
            { title: "Historical Data", desc: "Complete F1 archives" },
            { title: "WebSocket Support", desc: "Instant updates" },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
              className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 hover:border-red-500/50 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12 text-sm text-gray-500"
        >
          <p>Questions? Contact us at <ObfuscatedEmail user="contact" domain="t1f1.com" /></p>
        </motion.div>
      </div>
    </div>
  );
}
