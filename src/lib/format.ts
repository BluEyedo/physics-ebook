const SUP: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

/** Scientific notation, e.g. sci(90000) → "9.00 × 10⁴". */
export function sci(x: number, digits = 2) {
  if (x === 0) return '0'
  let e = Math.floor(Math.log10(Math.abs(x)))
  let m = Number((x / 10 ** e).toFixed(digits))
  if (Math.abs(m) >= 10) {
    m /= 10
    e += 1
  }
  const exp = String(e)
    .split('')
    .map((c) => SUP[c])
    .join('')
  return `${m.toFixed(digits)} × 10${exp}`
}

/** Number with thousands separators, e.g. num(211750) → "211,750". */
export function num(x: number, digits = 0) {
  return x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
