// Übergangslader: lädt die App aus index.fixed.html.
// Schritt 1 Ziel bleibt: diese Runtime-Abhängigkeit entfernen und echte App-Logik direkt in src/app.js legen.
// Cache-Buster verhindert zumindest, dass GitHub Pages eine alte index.fixed.html-Version ohne Kniffel benutzt.

const SOURCE_HTML_URL = new URL(`../index.fixed.html?v=kniffel10&t=${Date.now()}`, import.meta.url);

function showLoaderError(error) {
  console.error("App konnte nicht geladen werden:", error);
  const message = document.createElement("div");
  message.style.cssText = [
    "max-width: 520px",
    "margin: 80px auto",
    "padding: 24px",
    "border-radius: 16px",
    "background: #fff",
    "border: 1px solid rgba(52,58,64,.16)",
    "font-family: system-ui, -apple-system, Segoe UI, sans-serif",
    "color: #343a40",
    "line-height: 1.45"
  ].join(";");
  message.innerHTML = `
    <strong>Das Spiel konnte nicht geladen werden.</strong><br>
    Bitte prüfe, ob <code>index.fixed.html</code>, <code>src/app.js</code> und <code>styles/app.css</code> alle auf GitHub hochgeladen wurden.
  `;
  document.body.innerHTML = "";
  document.body.appendChild(message);
}

function extractSource(html) {
  const styleMatch = html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = html.match(/<script\b[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) {
    throw new Error("In index.fixed.html wurde kein <script type=\"module\"> gefunden.");
  }
  return {
    css: styleMatch ? styleMatch[1] : "",
    js: scriptMatch[1]
  };
}

function installCss(css) {
  if (!css || document.getElementById("app-extracted-css")) return;
  const style = document.createElement("style");
  style.id = "app-extracted-css";
  style.textContent = css;
  document.head.appendChild(style);
}

async function importAppModule(js) {
  const blob = new Blob([js], { type: "text/javascript" });
  const moduleUrl = URL.createObjectURL(blob);
  try {
    await import(moduleUrl);
  } finally {
    setTimeout(() => URL.revokeObjectURL(moduleUrl), 1000);
  }
}

async function boot() {
  const response = await fetch(SOURCE_HTML_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Quelle konnte nicht geladen werden: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  const { css, js } = extractSource(html);
  installCss(css);
  await importAppModule(js);
}

try {
  // Top-level await hält DOMContentLoaded zurück, bis die ausgelagerte App registriert ist.
  await boot();
} catch (error) {
  showLoaderError(error);
}
