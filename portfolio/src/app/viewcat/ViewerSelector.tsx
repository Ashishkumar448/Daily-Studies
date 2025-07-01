'use client';
import React from 'react';
import { motion } from 'framer-motion';



export default function ViewerSelector() {
  const roles = [
    'HR',
    'Kids',
    'Developer',
    'Gamer',
    'Graphic designer',
    'Video editor',
    'Others',
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Animated Gradient Background Grid */}
      <motion.div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 2 }}
      />

      {/* Glow Animation Layer */}
      <motion.div
        className="absolute -z-10 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 2, delay: 0.5, type: 'spring' }}
      />

      {/* Title */}
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-white relative z-10 mb-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Who is seeing this portfolio?
      </motion.h1>

      {/* Role Buttons */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl relative z-10"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {roles.map((role) => (
          <motion.button
            key={role}
            className="backdrop-blur-md border border-white/30 text-white px-6 py-4 rounded-xl text-lg font-medium
                       bg-white/10 hover:bg-white/20 transition-all shadow-xl hover:scale-105"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {role}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}