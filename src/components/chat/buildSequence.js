import { LOGO_CUBE_CS } from "@/components/chat/logoCubeScript";
import { LOGO_TEXT_CS } from "@/components/chat/logoTextScript";

// The curated build sequence that renders and animates a Base44 logo cube in the
// user's live Unity scene, using only what the bridge can actually do
// (create/scale/position primitives, lights, camera framing, and create+attach
// a C# behaviour — which is what puts the real logo texture on every face).
//
// Each step carries THREE things:
//   - prompt:    the natural-language line (still used if a user types it manually)
//   - narration: a canned confirmation Lovelace posts — no LLM needed
//   - actions:   the exact ordered bridge actions this step runs, so the demo
//                executes with ZERO Groq calls.
export const BUILD_STEPS = [
  {
    n: 0,
    label: "Clear the stage",
    prompt:
      "Delete any leftover demo objects from a previous run: Base44Logo, Logo_A, Logo_B, Logo_C, Logo_Accent, Floor, KeyLight, RimLight.",
    narration:
      "Cleared out any leftovers from an earlier run — starting from a clean stage.",
    // Missing objects are fine here: this step never blocks the build.
    tolerant: true,
    actions: [
      { kind: "write", tool: "object.delete", args: { target: "Base44Logo" } },
      { kind: "write", tool: "object.delete", args: { target: "Logo_A" } },
      { kind: "write", tool: "object.delete", args: { target: "Logo_B" } },
      { kind: "write", tool: "object.delete", args: { target: "Logo_C" } },
      { kind: "write", tool: "object.delete", args: { target: "Logo_Accent" } },
      { kind: "write", tool: "object.delete", args: { target: "Floor" } },
      { kind: "write", tool: "object.delete", args: { target: "KeyLight" } },
      { kind: "write", tool: "object.delete", args: { target: "RimLight" } },
    ],
  },
  {
    n: 1,
    label: "Set the stage",
    prompt:
      "Create a plane named 'Floor' at 0,0,0, scale it to 4,1,4, and color it very dark gray (#111114).",
    narration:
      "Stage set — I've laid down a dark floor plane to catch the light.",
    actions: [
      { kind: "write", tool: "object.create", args: { type: "plane", name: "Floor", x: 0, y: 0, z: 0 } },
      { kind: "write", tool: "object.scale", args: { target: "Floor", x: 4, y: 1, z: 4 } },
      { kind: "write", tool: "object.color", args: { target: "Floor", color: "#111114" } },
    ],
  },
  {
    n: 2,
    label: "Place the logo cube",
    prompt:
      "Create a cube named 'Base44Logo' at 0,1.6,0 and scale it to 1.8,1.8,1.8.",
    narration: "Logo cube placed at the center of the stage.",
    actions: [
      { kind: "write", tool: "object.create", args: { type: "cube", name: "Base44Logo", x: 0, y: 1.6, z: 0 } },
      { kind: "write", tool: "object.scale", args: { target: "Base44Logo", x: 1.8, y: 1.8, z: 1.8 } },
      { kind: "write", tool: "object.rotate", args: { target: "Base44Logo", x: 0, y: 25, z: 0 } },
    ],
  },
  {
    n: 3,
    label: "Key spotlight",
    prompt:
      "Create a spot light named 'KeyLight' at 0,5,-4, color warm white (#FFF3E0), intensity 6, and rotate it to euler 55,0,0 so it points at the logo.",
    narration: "Warm key spotlight added, angled onto the cube.",
    actions: [
      { kind: "write", tool: "object.light", args: { mode: "spot", name: "KeyLight", color: "#FFF3E0", intensity: 6, x: 0, y: 5, z: -4 } },
      { kind: "write", tool: "object.rotate", args: { target: "KeyLight", x: 55, y: 0, z: 0 } },
    ],
  },
  {
    n: 4,
    label: "Rim glow",
    prompt:
      "Create a point light named 'RimLight' at 0,2,4, color Base44 orange (#FF6A00), intensity 5.",
    narration: "Orange rim light behind the cube for that signature glow.",
    actions: [
      { kind: "write", tool: "object.light", args: { mode: "point", name: "RimLight", color: "#FF6A00", intensity: 5, x: 0, y: 2, z: 4 } },
    ],
  },
  {
    n: 5,
    label: "Frame the shot",
    prompt: "Frame the Scene view camera on Base44Logo.",
    narration: "Framed the Scene view on the logo cube.",
    actions: [
      { kind: "write", tool: "camera.frame", args: { target: "Base44Logo" } },
    ],
  },
  {
    n: 6,
    label: "Write the logo behaviours",
    // Writing the script triggers a recompile + domain reload in Unity, so the
    // attach CANNOT ride along in the same batch — it gets its own step below.
    phase: "script-create",
    prompt:
      "Write a C# MonoBehaviour named 'Base44LogoCube' that downloads the Base44 logo, applies it to every face of the cube, spins it 40 degrees per second, and pulses its emission.",
    narration:
      "Wrote Base44LogoCube.cs and Base44LogoText.cs into your project — Unity is compiling them now.",
    actions: [
      {
        kind: "write",
        tool: "script.create",
        args: { script: "Base44LogoCube", code: LOGO_CUBE_CS },
      },
      {
        kind: "write",
        tool: "script.create",
        args: { script: "Base44LogoText", code: LOGO_TEXT_CS },
      },
    ],
  },
  {
    n: 7,
    label: "Skin it, spin it, make it glow",
    phase: "script-attach",
    attach: [
      { target: "Base44Logo", script: "Base44LogoCube" },
      { target: "Floor", script: "Base44LogoText" },
    ],
    prompt:
      "Attach Base44LogoCube to Base44Logo and Base44LogoText to Floor once Unity finishes compiling.",
    narration:
      "Base44 logo mapped onto all six faces, spinning at 40°/sec with a pulsing orange glow — and a floating orange BASE44 wordmark bobbing beside the cube.",
    actions: [
      { kind: "write", tool: "script.attach", args: { target: "Base44Logo", script: "Base44LogoCube" } },
      { kind: "write", tool: "script.attach", args: { target: "Floor", script: "Base44LogoText" } },
    ],
  },
];