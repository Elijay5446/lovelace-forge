import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wand2, ArrowRight } from "lucide-react";

// Landing feature band: the AI character creation pipeline (image → rigged 3D
// character in Unity, via Meshy AI).
export default function CharacterPipeline() {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-6 text-center md:p-8"
      >
        <Wand2 className="mx-auto h-6 w-6 text-amber-400" strokeWidth={1.5} />
        <h3 className="mt-4 font-display text-xl font-semibold text-stone-100 md:text-2xl">
          AI Character Creation
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-400">
          Upload a 2D image and watch it become a fully rigged 3D character in your Unity
          editor. Powered by Meshy AI's latest model with PBR textures, auto-rigging, and
          built-in animations.
        </p>
        <Link
          to="/create-character"
          className="group mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-amber-500 hover:to-orange-500"
        >
          Try It Now
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}