

export function maskName(name) {
  if (!name || name.length <= 2) return name;
  
  let masked = '';
  for (let i = 0; i < name.length; i++) {
    if (i % 2 === 0) {
      masked += name[i];
    } else {
      masked += '*';
    }
  }
  return masked;
}
