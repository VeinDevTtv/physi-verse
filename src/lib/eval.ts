// Very small, restricted math expression evaluator for numeric input.
// Accepts numbers and operators + - * / ^ and parentheses, and common Math functions without the Math. prefix
// (sin, cos, tan, asin, acos, atan, sqrt, pow, abs, log, ln, exp, min, max, floor, ceil, round).
// Returns null if the expression contains disallowed characters or throws.

const ALLOWED = /[^0-9+\-*/^().,\sA-Za-z_]/

const FN_MAP: Record<string, keyof Math> = {
  sin: "sin",
  cos: "cos",
  tan: "tan",
  asin: "asin",
  acos: "acos",
  atan: "atan",
  sqrt: "sqrt",
  pow: "pow",
  abs: "abs",
  log: "log",
  ln: "log",
  exp: "exp",
  min: "min",
  max: "max",
  floor: "floor",
  ceil: "ceil",
  round: "round",
}

export function evaluateExpression(expression: string): number | null {
  if (!expression) return null
  const expr = expression.trim()
  if (ALLOWED.test(expr)) return null
  try {
    // Replace caret with Math.pow
    const powRewritten = expr.replace(/(\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|\([^()]+\))\s*\^\s*(\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|\([^()]+\))/g, "pow($1,$2)")
    // Prefix allowed functions with Math.
    const withMath = powRewritten.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, (_m, fn) => {
      const key = fn as keyof typeof FN_MAP
      if (FN_MAP[key]) return `Math.${FN_MAP[key]}(`
      // Disallow unknown identifiers to avoid variable access
      return "_BAD_("
    })
    if (withMath.includes("_BAD_(")) return null
    // eslint-disable-next-line no-new-func
    const fn = new Function("Math", `return (${withMath});`)
    const result = fn(Math)
    if (typeof result !== "number" || !isFinite(result)) return null
    return result
  } catch {
    return null
  }
}


