import React from 'react';

export default function PortfolioTypeSelector() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col justify-center items-center overflow-hidden">
      {/* Slick grid background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none
          bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]
          bg-[size:40px_40px]"
      />

      {/* Top-left brand label */}
      <div className="absolute top-6 left-6 z-20">
        <span className="text-white text-lg font-semibold tracking-wide">
          Ashish&apos;s Portfolio
        </span>
      </div>

      <h1 className="relative z-10 text-white text-2xl md:text-3xl lg:text-4xl font-semibold text-center mb-10">
        Which type of portfolio do you want to see?
      </h1>
      <div className="relative z-10 flex gap-6">
        <button
          className="bg-white text-black px-8 py-3 rounded-lg text-lg font-medium transition hover:bg-gray-200 focus:outline-none"
        >
          Minimal
        </button>
        <button
          className="bg-white text-black px-8 py-3 rounded-lg text-lg font-medium transition hover:bg-gray-200 focus:outline-none"
        >
          Animated
        </button>
      </div>
    </div>
  );
}
