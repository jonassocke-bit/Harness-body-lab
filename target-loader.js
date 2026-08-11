export function parseMakeHumanTarget(text) {
  // MakeHuman .target: vertexIndex dx dy dz
  const rows = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const p = line.split(/\s+/);
    if (p.length < 4) continue;
    const index = Number(p[0]);
    const dx = Number(p[1]), dy = Number(p[2]), dz = Number(p[3]);
    if (Number.isInteger(index) && [dx,dy,dz].every(Number.isFinite)) {
      rows.push({ index, dx, dy, dz });
    }
  }
  return rows;
}

export async function fetchTarget(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Target nicht gefunden: ${url}`);
  return parseMakeHumanTarget(await res.text());
}

export function applySparseTarget(base, targetRows, amount, out) {
  // base/out are Float32Array xyz coordinates
  for (const {index,dx,dy,dz} of targetRows) {
    const i = index * 3;
    out[i]   += dx * amount;
    out[i+1] += dy * amount;
    out[i+2] += dz * amount;
  }
}
