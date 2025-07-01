// Linktree-style page with categorized dev/social/media links (dark theme with framer motion layout polish)
"use client"
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FaGithub, FaGitlab, FaBitbucket, FaLinkedin, FaTwitter, FaStackOverflow,
  FaDev, FaMedium, FaCodepen, FaDribbble, FaBehance, FaFigma, FaDiscord,
  FaTelegramPlane, FaEnvelope, FaGlobe, FaYoutube, FaInstagram, FaTwitch,
  FaRedditAlien, FaQuora
} from 'react-icons/fa';
import {
  SiHashnode, SiHackerrank, SiCodeforces, SiLeetcode, SiCodechef, SiReplit,
  SiNotion, SiGumroad, SiProducthunt, SiPolywork, SiKaggle, SiGeeksforgeeks,
  SiExercism
} from 'react-icons/si';

const links = [
  { name: 'LeetCode', icon: SiLeetcode, url: 'https://leetcode.com', category: 'Coding' },
  { name: 'HackerRank', icon: SiHackerrank, url: 'https://www.hackerrank.com', category: 'Coding' },
  { name: 'Codeforces', icon: SiCodeforces, url: 'https://codeforces.com', category: 'Coding' },
  { name: 'CodeChef', icon: SiCodechef, url: 'https://www.codechef.com', category: 'Coding' },
  { name: 'Codepen', icon: FaCodepen, url: 'https://www.codepen.com', category: 'Coding' },
  { name: 'GeeksforGeeks', icon: SiGeeksforgeeks, url: 'https://www.geeksforgeeks.org', category: 'Coding' },
  { name: 'Exercism', icon: SiExercism, url: 'https://exercism.org', category: 'Coding' },
  { name: 'Replit', icon: SiReplit, url: 'https://replit.com', category: 'Coding' },

  { name: 'GitHub', icon: FaGithub, url: 'https://github.com', category: 'Dev Social' },
  { name: 'GitLab', icon: FaGitlab, url: 'https://gitlab.com', category: 'Dev Social' },
  { name: 'Bitbucket', icon: FaBitbucket, url: 'https://bitbucket.org', category: 'Dev Social' },
  { name: 'Stack Overflow', icon: FaStackOverflow, url: 'https://stackoverflow.com', category: 'Dev Social' },
  { name: 'Hashnode', icon: SiHashnode, url: 'https://hashnode.com', category: 'Dev Social' },
  { name: 'Dev.to', icon: FaDev, url: 'https://dev.to', category: 'Dev Social' },
  { name: 'Medium', icon: FaMedium, url: 'https://medium.com', category: 'Dev Social' },
  { name: 'Reddit', icon: FaRedditAlien, url: 'https://reddit.com', category: 'Dev Social' },
  { name: 'Quora', icon: FaQuora, url: 'https://quora.com', category: 'Dev Social' },

  { name: 'Dribbble', icon: FaDribbble, url: 'https://dribbble.com', category: 'Design' },
  { name: 'Behance', icon: FaBehance, url: 'https://www.behance.net', category: 'Design' },
  { name: 'Figma', icon: FaFigma, url: 'https://figma.com', category: 'Design' },

  { name: 'Notion', icon: SiNotion, url: 'https://www.notion.so', category: 'Portfolio' },
  { name: 'Polywork', icon: SiPolywork, url: 'https://www.polywork.com', category: 'Portfolio' },
  { name: 'Gumroad', icon: SiGumroad, url: 'https://gumroad.com', category: 'Portfolio' },
  { name: 'ProductHunt', icon: SiProducthunt, url: 'https://www.producthunt.com', category: 'Portfolio' },
  { name: 'Personal Portfolio', icon: FaGlobe, url: '#', category: 'Portfolio' },

  { name: 'LinkedIn', icon: FaLinkedin, url: 'https://linkedin.com', category: 'Communication' },
  { name: 'Twitter (X)', icon: FaTwitter, url: 'https://x.com', category: 'Communication' },
  { name: 'Discord', icon: FaDiscord, url: 'https://discord.com', category: 'Communication' },
  { name: 'Telegram', icon: FaTelegramPlane, url: 'https://telegram.org', category: 'Communication' },
  { name: 'Email', icon: FaEnvelope, url: 'mailto:someone@example.com', category: 'Communication' },

  { name: 'YouTube', icon: FaYoutube, url: 'https://youtube.com', category: 'Media' },
  { name: 'Instagram', icon: FaInstagram, url: 'https://instagram.com', category: 'Media' },
  { name: 'Twitch', icon: FaTwitch, url: 'https://twitch.tv', category: 'Media' }
];

const categories = ['Coding', 'Dev Social', 'Design', 'Portfolio', 'Communication', 'Media'];

export default function LinktreePage() {
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h1 className="text-3xl font-bold text-center mb-8" initial={{ y: -20 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>Ashish's Dev Linktree</motion.h1>

      <div className="flex flex-col items-center justify-start pb-12">
        {categories.map((category) => {
          const ref = useRef(null);
          const isInView = useInView(ref, { once: true });

          return (
            <motion.div
              key={category}
              ref={ref}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl my-6"
            >
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">{category}</h2>
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
                  },
                }}
              >
                {links.filter(link => link.category === category).map(({ name, icon: Icon, url }) => (
                  <motion.a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="border border-white/10 backdrop-blur-md bg-white/5 px-4 py-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-white/10"
                    whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="text-xl text-white" />
                    <span className="text-sm font-medium text-white">{name}</span>
                  </motion.a>
                ))}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
