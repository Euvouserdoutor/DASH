const SECRET_PATTERNS = [
  /private[_-]?key/gi,
  /secret/gi,
  /token/gi,
  /authorization/gi,
];

export function redactText(input: string): string {
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, "[REDACTED]");
  }
  return output;
}

export function maskSecret(value?: string | null, visibleChars = 4): string {
  if (!value) return "";
  const v = String(value);
  if (v.length <= visibleChars) return "*".repeat(v.length);
  return `${"*".repeat(v.length - visibleChars)}${v.slice(-visibleChars)}`;
}
