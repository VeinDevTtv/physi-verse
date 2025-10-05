export type AssistantMode = "explain" | "quiz" | "simplify"

export interface AssistantRequest {
  mode: AssistantMode
  prompt: string
}

export interface AssistantResponse {
  text: string
}

const knowledgeBase: Record<string, string> = {
  "newton's laws":
    "Newton's Laws describe motion: (1) Inertia, (2) F=ma, (3) Equal and opposite reaction.",
  kinematics:
    "Kinematics studies motion without forces. Core equations relate displacement, velocity, acceleration, and time.",
  energy:
    "Energy is conserved. Kinetic E_k = 1/2 m v^2, Potential (near Earth) E_p = m g h.",
  momentum:
    "Momentum p = m v is conserved in isolated systems. Impulse J = F Δt = Δp.",
  waves:
    "Waves carry energy. v = f λ, with interference, diffraction, and resonance phenomena.",
  optics:
    "Geometric optics uses ray models: reflection (θ_i=θ_r), refraction (n1 sinθ1 = n2 sinθ2).",
  electricity:
    "Ohm's Law: V = I R. Power P = V I = I^2 R = V^2 / R. Series/parallel rules apply.",
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function explainConcept(prompt: string): string {
  const key = Object.keys(knowledgeBase).find((k) => prompt.toLowerCase().includes(k))
  const heading = key ? titleCase(key) : titleCase(prompt.trim().slice(0, 64))
  const base = key ? knowledgeBase[key] : "This concept relates to fundamental principles in physics."
  return [
    `**${heading} — Intuition**`,
    base,
    "",
    "**Core Ideas**",
    "- Definitions and units: clarify what each quantity means",
    "- Proportionalities: how outputs scale with inputs",
    "- Limits: check extreme cases to build intuition",
    "",
    "**Common Formulas**",
    "- Kinematics: Δx = v₀ t + 1/2 a t²; v² = v₀² + 2 a Δx",
    "- Dynamics: F = m a; weight W = m g",
    "- Energy: E_k = 1/2 m v²; E_p = m g h; Conservation: E_total = const",
    "- Momentum: p = m v; J = F Δt = Δp",
    "",
    "**Check Your Understanding**",
    "- What happens if mass doubles?",
    "- What if friction is negligible vs dominant?",
  ].join("\n")
}

function randomChoice<T>(arr: T[], seed: number): T {
  // Simple LCG for deterministic variety based on seed
  let x = Math.abs(seed) + 12345
  x = (1103515245 * x + 12345) % 2 ** 31
  const idx = x % arr.length
  return arr[idx]
}

function generateQuiz(prompt: string): string {
  const topic = Object.keys(knowledgeBase).find((k) => prompt.toLowerCase().includes(k)) || "kinematics"
  const seed = prompt.length
  const stemTemplates = {
    kinematics: `A ball is thrown horizontally at v₀ from a height h. Neglecting air resistance, what is the time to hit the ground?`,
    energy: `A block slides down a frictionless incline of height h starting from rest. What is its speed at the bottom?`,
    momentum: `Two carts collide elastically on a track. Cart A (m) at speed v hits identical Cart B at rest. What is A's speed after?`,
    optics: `A ray moves from air (n≈1.00) into glass (n≈1.50) at θ₁. Which relation holds?`,
    electricity: `A resistor R has current I. If we double R with constant V, what happens to I?`,
    waves: `A wave has speed v and frequency f. What is its wavelength λ?`,
  } as Record<string, string>
  const options: Record<string, string[]> = {
    kinematics: ["t = √(2h/g)", "t = h/v₀", "t = v₀/g", "t = √(h/g)"],
    energy: ["v = √(2 g h)", "v = g h", "v = h/√g", "v = √(g/h)"],
    momentum: ["v", "0", "−v", "v/2"],
    optics: ["n₁ sinθ₁ = n₂ sinθ₂", "θ₁ = θ₂ always", "n₁ = n₂", "sinθ₂ = n₁ n₂ sinθ₁"],
    electricity: ["I halves", "I doubles", "I unchanged", "I triples"],
    waves: ["λ = v/f", "λ = f/v", "λ = v f", "λ = 1/(v f)"],
  }
  const answers: Record<string, number> = {
    kinematics: 0,
    energy: 0,
    momentum: 2,
    optics: 0,
    electricity: 0,
    waves: 0,
  }
  const t = stemTemplates[topic] || stemTemplates.kinematics
  const opts = options[topic] || options.kinematics
  // Shuffle options deterministically by seed
  const order = [0, 1, 2, 3].sort((a, b) => ((a + seed) % 7) - ((b + seed) % 7))
  const correctIndexOriginal = answers[topic]
  const correctIndexShuffled = order.indexOf(correctIndexOriginal)
  const letters = ["A", "B", "C", "D"]
  const rendered = order.map((i, idx) => `${letters[idx]}. ${opts[i]}`)
  const reasoning = randomChoice(
    [
      "Use governing equations and check units to avoid algebra mistakes.",
      "Identify conserved quantities (energy or momentum) before writing equations.",
      "Draw a diagram and mark knowns/unknowns; pick axes to simplify.",
    ],
    seed
  )
  return [
    `**Topic:** ${titleCase(topic)}`,
    `**Question:** ${t}`,
    "",
    "**Choices**",
    ...rendered.map((s) => `- ${s}`),
    "",
    `**Answer:** ${letters[correctIndexShuffled]}`,
    `**Why:** ${reasoning}`,
  ].join("\n")
}

function simplifyFormula(prompt: string): string {
  const formula = prompt.replace(/\s+/g, " ").trim()
  const hints: string[] = []
  if (/\bmv\^?2?\b|1\/2\s*m\s*v\^?2?/.test(formula.replaceAll(" ", ""))) {
    hints.push("Recognize kinetic energy pattern E_k = 1/2 m v².")
  }
  if (/m\s*g\s*h|mgh/.test(formula.replaceAll(" ", ""))) {
    hints.push("Recognize gravitational potential E_p = m g h.")
  }
  if (/v\s*=\s*u\s*\+\s*a\s*t|v\^2/.test(formula)) {
    hints.push("Kinematics relations: v = v₀ + a t, v² = v₀² + 2 a Δx.")
  }
  const simplified = formula
    .replace(/\*\*/g, "^")
    .replace(/\s*\*\s*/g, " · ")
    .replace(/\s*\+\s*/g, " + ")
    .replace(/\s*-\s*/g, " − ")
    .replace(/\s*=\s*/g, " = ")
  return [
    "**Given Formula**",
    "`" + formula + "`",
    "",
    "**Simplified Presentation**",
    "`" + simplified + "`",
    "",
    "**Notes**",
    ...(hints.length ? hints : ["Identify known patterns and consider factoring, unit checks, and limits."]),
  ].join("\n")
}

export function runAssistant(req: AssistantRequest): AssistantResponse {
  const prompt = req.prompt ?? ""
  const mode = req.mode
  if (!prompt.trim()) {
    return { text: "Please enter a prompt." }
  }
  if (mode === "explain") {
    return { text: explainConcept(prompt) }
  }
  if (mode === "quiz") {
    return { text: generateQuiz(prompt) }
  }
  if (mode === "simplify") {
    return { text: simplifyFormula(prompt) }
  }
  return { text: "Unsupported mode." }
}


