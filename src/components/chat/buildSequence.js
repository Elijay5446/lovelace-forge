// The curated 1→10 build sequence that renders and animates a Base44 logo in the
// user's live Unity scene, using only what the bridge can actually do
// (create/scale/position/color primitives, lights, camera framing, and
// create+attach a spin script).
//
// Each step carries THREE things:
//   - prompt:    the natural-language line (still used if a user types it manually)
//   - narration: a canned confirmation Lovelace posts — no LLM needed
//   - actions:   the exact ordered bridge actions this step runs, so the demo
//                executes with ZERO Groq calls (no router, no chat completion).
//
// Shared between the empty-state teaser, the in-chat build panel, and the
// run_build_step backend function so the outline is authored once.
export const BUILD_STEPS = [
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
    label: "First logo block",
    prompt:
      "Create a cube named 'Logo_A' at -1.1,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
    narration: "First block placed — Base44 blue, left position.",
    actions: [
      { kind: "write", tool: "object.create", args: { type: "cube", name: "Logo_A", x: -1.1, y: 1.4, z: 0 } },
      { kind: "write", tool: "object.scale", args: { target: "Logo_A", x: 0.9, y: 0.9, z: 0.9 } },
      { kind: "write", tool: "object.color", args: { target: "Logo_A", color: "#2563EB" } },
    ],
  },
  {
    n: 3,
    label: "Second logo block",
    prompt:
      "Create a cube named 'Logo_B' at 0,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
    narration: "Second block placed at center.",
    actions: [
      { kind: "write", tool: "object.create", args: { type: "cube", name: "Logo_B", x: 0, y: 1.4, z: 0 } },
      { kind: "write", tool: "object.scale", args: { target: "Logo_B", x: 0.9, y: 0.9, z: 0.9 } },
      { kind: "write", tool: "object.color", args: { target: "Logo_B", color: "#2563EB" } },
    ],
  },
  {
    n: 4,
    label: "Third logo block",
    prompt:
      "Create a cube named 'Logo_C' at 1.1,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
    narration: "Third block placed — the row is complete.",
    actions: [
      { kind: "write", tool: "object.create", args: { type: "cube", name: "Logo_C", x: 1.1, y: 1.4, z: 0 } },
      { kind: "write", tool: "object.scale", args: { target: "Logo_C", x: 0.9, y: 0.9, z: 0.9 } },
      { kind: "write", tool: "object.color", args: { target: "Logo_C", color: "#2563EB" } },
    ],
  },
  {
    n: 5,
    label: "Accent block",
    prompt:
      "Create a cube named 'Logo_Accent' at 0,2.5,0, scale it to 0.9,0.9,0.9, and color it bright cyan (#22D3EE).",
    narration: "Cyan accent block crowning the logo.",
    actions: [
      { kind: "write", tool: "object.create", args: { type: "cube", name: "Logo_Accent", x: 0, y: 2.5, z: 0 } },
      { kind: "write", tool: "object.scale", args: { target: "Logo_Accent", x: 0.9, y: 0.9, z: 0.9 } },
      { kind: "write", tool: "object.color", args: { target: "Logo_Accent", color: "#22D3EE" } },
    ],
  },
  {
    n: 6,
    label: "Group the logo",
    prompt:
      "Create an empty GameObject named 'Base44Logo' at 0,1.4,0, then parent Logo_A, Logo_B, Logo_C, and Logo_Accent under it.",
    narration: "Grouped all blocks under a single Base44Logo object.",
    actions: [
      { kind: "write", tool: "object.empty", args: { name: "Base44Logo", x: 0, y: 1.4, z: 0 } },
      { kind: "write", tool: "object.parent", args: { target: "Logo_A", parent: "Base44Logo" } },
      { kind: "write", tool: "object.parent", args: { target: "Logo_B", parent: "Base44Logo" } },
      { kind: "write", tool: "object.parent", args: { target: "Logo_C", parent: "Base44Logo" } },
      { kind: "write", tool: "object.parent", args: { target: "Logo_Accent", parent: "Base44Logo" } },
    ],
  },
  {
    n: 7,
    label: "Key spotlight",
    prompt:
      "Create a spot light named 'KeyLight' at 0,5,-4, color warm white (#FFF3E0), intensity 6, and rotate it to euler 55,0,0 so it points at the logo.",
    narration: "Warm key spotlight added, angled onto the logo.",
    actions: [
      { kind: "write", tool: "object.light", args: { mode: "spot", name: "KeyLight", color: "#FFF3E0", intensity: 6, x: 0, y: 5, z: -4 } },
      { kind: "write", tool: "object.rotate", args: { target: "KeyLight", x: 55, y: 0, z: 0 } },
    ],
  },
  {
    n: 8,
    label: "Rim glow",
    prompt:
      "Create a point light named 'RimLight' at 0,2,4, color Base44 blue (#2563EB), intensity 4.",
    narration: "Blue rim light behind the logo for that signature glow.",
    actions: [
      { kind: "write", tool: "object.light", args: { mode: "point", name: "RimLight", color: "#2563EB", intensity: 4, x: 0, y: 2, z: 4 } },
    ],
  },
  {
    n: 9,
    label: "Frame the shot",
    prompt: "Frame the Scene view camera on Base44Logo.",
    narration: "Framed the Scene view on the finished logo.",
    actions: [
      { kind: "write", tool: "camera.frame", args: { target: "Base44Logo" } },
    ],
  },
  {
    n: 10,
    label: "Animate it spinning",
    prompt:
      "Write a C# MonoBehaviour named 'LogoSpin' that rotates its transform 40 degrees per second around the Y axis in Update, then wait for Unity to finish compiling and attach LogoSpin to Base44Logo. Tell me when to press Play.",
    narration:
      "Spin script created and attached to Base44Logo. Give Unity a moment to compile, then press Play to watch it turn.",
    actions: [
      {
        kind: "write",
        tool: "script.create",
        args: {
          script: "LogoSpin",
          code:
            "using UnityEngine;\n\npublic class LogoSpin : MonoBehaviour\n{\n    public float degreesPerSecond = 40f;\n\n    void Update()\n    {\n        transform.Rotate(Vector3.up, degreesPerSecond * Time.deltaTime, Space.World);\n    }\n}\n",
        },
      },
      { kind: "write", tool: "script.attach", args: { target: "Base44Logo", script: "LogoSpin" } },
    ],
  },
];