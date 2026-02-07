export const escapeHtml = (str = "") =>
  str.replace(/[&<>'"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[
      c
    ]!)
  );

export const youtubeEmbedUrl = (url: string) => {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    const id = parsed.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    return url;
  }
  return url;
};

export function applyVars(template: string, vars: Record<string, string>) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
  }
  return result;
}

export function badge(text: string) {
  return `<span class="inline-flex items-center rounded-full bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-1">${escapeHtml(
    text
  )}</span>`;
}
