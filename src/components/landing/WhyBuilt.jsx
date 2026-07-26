import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: "easeOut", delay },
});

export default function WhyBuilt() {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
      <motion.span
        {...fade()}
        className="mb-7 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80"
      >
        <span className="h-px w-7 bg-amber-500/40" />
        Why I Built This
      </motion.span>

      <motion.div {...fade(0.05)} className="mx-auto max-w-[640px]">
        <Quote className="mx-auto mb-6 h-7 w-7 text-amber-500/70" strokeWidth={1.5} />
        <p className="text-lg leading-relaxed text-stone-100/90 md:text-xl">
          I built Lovelace Forge to strip away the friction of building{" "}
          <span className="font-medium text-amber-300">high tech in Unity</span>.
        </p>
      </motion.div>

      <motion.p
        {...fade(0.15)}
        className="mx-auto mt-6 max-w-[640px] text-base leading-relaxed text-stone-100/80 md:text-[1.05rem]"
      >
        Along the way I learned something firsthand: pairing with an AI that has,
        effectively, a{" "}
        <span className="font-medium text-amber-300">
          PhD in Unity game development
        </span>{" "}
        isn't just possible — it's{" "}
        <span className="font-medium text-amber-300">preferred</span>. It's a big
        deal, and a massive time saver.
      </motion.p>

      <motion.p
        {...fade(0.25)}
        className="mx-auto mt-6 max-w-[640px] text-base leading-relaxed text-stone-100/80 md:text-[1.05rem]"
      >
        A senior engineer sitting inside your editor — seeing your scenes, writing
        your code, catching what you'd miss — turns hours of grind into minutes of
        momentum. That's the forge: less fighting the tools, more building the game.
      </motion.p>
    </section>
  );
}