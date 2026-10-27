const ALLOWED_ELEMENTS = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon"])
const ALLOWED_ATTRIBUTES = new Set(["viewBox", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "points", "transform", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule", "opacity", "fill-opacity", "stroke-opacity"])
const SAFE_VALUE = /^[#\w\s.,:\-+%()]*$/
const MAX_LENGTH = 12000
const MAX_ELEMENTS = 80
const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")

export function sanitizeSvg(input: unknown): string | null {
  if (typeof input !== "string") return null
  const source = input.trim()
  if (!source || source.length > MAX_LENGTH) return null
  if (/<!|<\?|<script|<style|<foreignObject|<image|<use|<a[\s>]|javascript:|data:|url\s*\(|\bon\w+\s*=|xlink:|href/i.test(source)) return null
  const tagPattern = /<(\/?)([a-zA-Z][\w:-]*)([^<>]*?)(\/?)>/g
  const stack: string[] = []
  let output = "", elements = 0, cursor = 0, sawRoot = false
  let match: RegExpExecArray | null
  while ((match = tagPattern.exec(source)) !== null) {
    if (source.slice(cursor, match.index).trim() !== "") return null
    cursor = tagPattern.lastIndex
    const [, closing, rawName, rawAttributes, selfClosing] = match
    const name = rawName === "svg" ? "svg" : rawName.toLowerCase()
    if (!ALLOWED_ELEMENTS.has(name)) return null
    if (closing) {
      if (stack.pop() !== name) return null
      output += \`</\${name}>\`
      continue
    }
    if (++elements > MAX_ELEMENTS) return null
    if (name === "svg") { if (sawRoot) return null; sawRoot = true }
    else if (!sawRoot) return null
    let attributes = ""
    const attributePattern = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
    let attributeMatch: RegExpExecArray | null, consumed = ""
    while ((attributeMatch = attributePattern.exec(rawAttributes)) !== null) {
      consumed += attributeMatch[0]
      const attributeName = attributeMatch[1], value = attributeMatch[2] ?? attributeMatch[3] ?? ""
      if (name === "svg" && ["xmlns", "width", "height"].includes(attributeName)) continue
      if (!ALLOWED_ATTRIBUTES.has(attributeName) || !SAFE_VALUE.test(value)) return null
      attributes += \` \${attributeName}="\${escapeAttribute(value)}"\`
    }
    if (rawAttributes.replace(/\s+/g, "") !== consumed.replace(/\s+/g, "")) return null
    if (name === "svg") {
      if (!/\sviewBox="/.test(attributes)) attributes += ' viewBox="0 0 400 400"'
      output += \`<svg xmlns="http://www.w3.org/2000/svg"\${attributes}>\`
    } else output += \`<\${name}\${attributes}\${selfClosing ? "/" : ""}>\`
    if (!selfClosing) stack.push(name)
  }
  if (source.slice(cursor).trim() !== "" || stack.length !== 0 || !sawRoot || !output.endsWith("</svg>")) return null
  return output
}
