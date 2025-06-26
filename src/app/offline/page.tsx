"use client";
import Link from "next/link";
import { WifiOff, RefreshCw, Navigation } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <WifiOff className="w-12 h-12 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You are offline
        </h1>
        <p className="text-gray-600 mb-6">
          Some features are unavailable. Please check your internet connection
          to access live navigation, search, and premium features.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/navigation">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all">
              <Navigation className="w-5 h-5" />
              Return to Navigation
            </button>
          </Link>
          <button
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-5 h-5" />
            Retry Connection
          </button>
        </div>
        <div className="mt-6 text-xs text-gray-400">
          Offline mode: You can view cached maps and routes if available.
        </div>
      </div>
    </div>
  );
}
