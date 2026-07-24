import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function ScrollHint() {
  const scrollDown = () => {
    window.scrollTo({ top: window.innerHeight * 0.95, behavior: "smooth" });
  };

  return (
    <motion.button
      onClick={scrollDown}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.8 }}
      className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5 text-amber-500/70 transition hover:text-amber-300"
      aria-label="Scroll down for more"
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.28em]">
        Scroll to explore
      </span>
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-5 w-5" />
      </motion.span>
    </motion.button>
  );
}