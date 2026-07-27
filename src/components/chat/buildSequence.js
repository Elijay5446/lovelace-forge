// The curated 1→10 build sequence that renders and animates a Base44 logo in the
// user's live Unity scene, using only what the bridge can actually do
// (create/scale/position/color primitives, lights, camera framing, and
// create+attach a spin script). Each step is one chat message the user fires in
// order. Shared between the empty-state teaser and the in-chat build panel so the
// outline is authored once and flows through the whole session.
export const BUILD_STEPS = [
  {
    n: 1,
    label: "Set the stage",
    prompt:
      "Create a plane named 'Floor' at 0,0,0, scale it to 4,1,4, and color it very dark gray (#111114).",
  },
  {
    n: 2,
    label: "First logo block",
    prompt:
      "Create a cube named 'Logo_A' at -1.1,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
  },
  {
    n: 3,
    label: "Second logo block",
    prompt:
      "Create a cube named 'Logo_B' at 0,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
  },
  {
    n: 4,
    label: "Third logo block",
    prompt:
      "Create a cube named 'Logo_C' at 1.1,1.4,0, scale it to 0.9,0.9,0.9, and color it Base44 blue (#2563EB).",
  },
  {
    n: 5,
    label: "Accent block",
    prompt:
      "Create a cube named 'Logo_Accent' at 0,2.5,0, scale it to 0.9,0.9,0.9, and color it bright cyan (#22D3EE).",
  },
  {
    n: 6,
    label: "Group the logo",
    prompt:
      "Create an empty GameObject named 'Base44Logo' at 0,1.4,0, then parent Logo_A, Logo_B, Logo_C, and Logo_Accent under it.",
  },
  {
    n: 7,
    label: "Key spotlight",
    prompt:
      "Create a spot light named 'KeyLight' at 0,5,-4, color warm white (#FFF3E0), intensity 6, and rotate it to euler 55,0,0 so it points at the logo.",
  },
  {
    n: 8,
    label: "Rim glow",
    prompt:
      "Create a point light named 'RimLight' at 0,2,4, color Base44 blue (#2563EB), intensity 4.",
  },
  {
    n: 9,
    label: "Frame the shot",
    prompt: "Frame the Scene view camera on Base44Logo.",
  },
  {
    n: 10,
    label: "Animate it spinning",
    prompt:
      "Write a C# MonoBehaviour named 'LogoSpin' that rotates its transform 40 degrees per second around the Y axis in Update, then wait for Unity to finish compiling and attach LogoSpin to Base44Logo. Tell me when to press Play.",
  },
];