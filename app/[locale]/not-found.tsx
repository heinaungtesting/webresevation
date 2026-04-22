'use client';

import Link from 'next/link';

export default function NotFoundLocalized() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-slate-50 text-center">
      <div className="space-y-6 max-w-md w-full">
        {/* Animated Brand Graphic */}
        <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 mb-8">
          <div className="absolute inset-0 bg-gradient-ocean rounded-3xl rotate-12 opacity-20 blur-xl animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-ocean rounded-3xl flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-xl overflow-hidden group">
            <span className="relative z-10 transition-transform group-hover:scale-110">404</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Page not found
        </h1>
        
        <p className="text-base sm:text-lg text-slate-500 max-w-sm mx-auto">
          We couldn't track down the page you're looking for. It might have moved or been deleted.
        </p>

        {/* Action Button */}
        <div className="pt-6">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white transition-all bg-slate-900 rounded-xl hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-md shadow-slate-900/10"
          >
            Return Home
            <svg 
              className="w-4 h-4 ml-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
