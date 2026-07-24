import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Network, Cable, ArrowRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useAuth } from "@/lib/AuthContext";
import CouncilTeaser from "@/components/landing/CouncilTeaser";
import CapabilitiesSection from "@/components/landing/CapabilitiesSection";

const HERO_IMAGE =
  "https://media.base44.com/images/public/69f8a0352756110b9a8a3e08/314e5e8f6_generated-image.jpg";

const PILLARS = [
  {
    icon: Code2,
    title: "Writes Code",
    desc: "An AI companion that drafts, refactors, and ships Unity C# alongside you.",
  },
  {
    icon: Network,
    title: "Consults a Council",
    desc: "Second opinions from a council of AI models, synthesized into one answer.",
  },
  {
    icon: Cable,
    title: "Lives in Unity",
    desc: "Connects to your live Unity editor — sees your scenes, runs your code.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-stone-200 selection:bg-amber-500/30">
      <section className="relative flex min-h-screen items-center">
        {/* Radial brass glow behind the clockwork woman */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[85vw] w-[85vw] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.14),rgba(245,158,11,0.05)_38%,transparent_68%)] md:h-[60vw] md:w-[60vw]" />
        </div>

        {/* Clockwork woman — faded atmospheric ghost behind the title */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.30]"
          style={{ filter: "blur(1px)" }}
        >
          <Image
            src={HERO_IMAGE}
            alt="Steampunk clockwork woman — brass gears and mechanisms forming her head and hair"
            className="h-full w-full"
            fittingType="fit"
          />
        </div>

        {/* Edge vignette so the ghost melts into black at the borders */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,0.92)_100%)]" />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-center md:px-10">
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="mb-6 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80">
                <span className="h-px w-7 bg-amber-500/50" />
                AI Companion · Unity Game Development
                <span className="h-px w-7 bg-amber-500/50" />
              </span>

              <h1 className="forge-title font-display text-6xl font-bold leading-[1.02] tracking-[0.06em] text-[#FFF6E0] drop-shadow-[0_2px_20px_rgba(0,0,0,0.85)] sm:text-7xl md:text-8xl">
                Lovelace Forge
              </h1>

              <p className="mt-6 text-lg font-normal leading-relaxed text-stone-100/95 md:text-xl">
                An AI that builds games with you — inside your Unity editor.
              </p>

              <p className="mx-auto mt-3 max-w-md text-[11px] leading-relaxed tracking-[0.06em] text-amber-200/55 md:text-xs">
                Named for Ada Lovelace — who wrote the world's first computer
                algorithm in 1843, and imagined machines that could create.
              </p>

              <p className="mt-5 max-w-lg text-sm leading-relaxed text-stone-300/75 md:text-base">
                An AI with a PhD in game development — a senior Unity engineer that
                connects to your live editor, sees your scenes, writes your code,
                and builds alongside you from first prototype to shipped game.
              </p>

              {/* Three pillars */}
              <div className="mx-auto mt-9 grid max-w-lg grid-cols-1 gap-5 sm:grid-cols-3">
                {PILLARS.map((p, i) => (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
                    className="flex flex-col gap-1.5"
                  >
                    <p.icon className="h-5 w-5 text-amber-500/90" strokeWidth={1.5} />
                    <p className="font-display text-sm font-semibold tracking-wide text-stone-200">
                      {p.title}
                    </p>
                    <p className="text-xs leading-relaxed text-stone-500">{p.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-11"
              >
                <Link
                  to={isAuthenticated ? "/app" : "/register"}
                  className="group inline-flex items-center gap-2 rounded-md border border-amber-500/50 px-7 py-3 text-sm font-medium tracking-wide text-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.22)] transition-all duration-300 hover:border-amber-300/80 hover:bg-amber-500/10 hover:shadow-[0_0_34px_rgba(245,158,11,0.45)]"
                >
                  Enter the Forge
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Origin story — the Ada Lovelace connection */}
      <section className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-7 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-amber-500/80"
        >
          <span className="h-px w-7 bg-amber-500/40" />
          Named for a Visionary
        </motion.span>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
          className="mx-auto max-w-[640px] text-base leading-relaxed text-stone-100/85 md:text-[1.05rem]"
        >
          Ada Lovelace saw what no one else could — that a machine of gears and
          cogs could do more than calculate; it could create. In 1843 she wrote
          the{" "}
          <span className="font-medium text-amber-300">
            world's first algorithm
          </span>
          , becoming history's{" "}
          <span className="font-medium text-amber-300">
            first computer programmer
          </span>
          , and imagined machines composing music and art a century before they
          existed.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="mx-auto mt-6 max-w-[640px] text-base leading-relaxed text-stone-100/85 md:text-[1.05rem]"
        >
          Lovelace Forge carries her spark. Where she saw poetry in the engine,
          we build intelligence in the forge — an AI companion that turns
          imagination into working game code.{" "}
          <span className="font-medium text-amber-300">
            Born from community.
          </span>{" "}
          <span className="font-medium text-amber-300">Built for humanity.</span>
        </motion.p>
      </section>

      <CapabilitiesSection />

      <CouncilTeaser />

      <footer className="border-t border-white/5 px-6 py-8 text-center md:px-10">
        <p className="font-display text-xs font-medium tracking-[0.22em] text-amber-500/60">
          An AI that builds games with you — inside your Unity editor.
        </p>
      </footer>
    </div>
  );
}