
export function maskName(name) {
  if (!name) return "*****";
  if (name.length <= 2) return name + "***";
  if (name.length > 4) {
      return "*****" + name.slice(-4);
  }
  return "*****" + name.slice(-1);
}
