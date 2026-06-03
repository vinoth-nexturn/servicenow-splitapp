const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const FRONTEND_DIR = ROOT;
const SDK_DIR = path.resolve(__dirname, "..");
const CLIENT_DIR = path.join(SDK_DIR, "src", "client");

function main() {
  console.log("Building frontend...");
  execSync("npm run build", { cwd: FRONTEND_DIR, stdio: "inherit" });

  const htmlPath = path.join(FRONTEND_DIR, "dist", "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  // Extract JS from <script> tag
  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    console.error("No script tag found in built HTML.");
    process.exit(1);
  }
  let js = scriptMatch[1];

  // Write JS file for sys_ui_script
  const jsPath = path.join(CLIENT_DIR, "split_app_main.jsx");
  fs.mkdirSync(path.dirname(jsPath), { recursive: true });
  fs.writeFileSync(jsPath, js);

  // Extract CSS from <style> tag
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  let css = styleMatch ? styleMatch[1] : "";

  // Strip @layer properties{...} block (Jelly treats <percentage>, <length> as XML tags)
  css = (function stripLayerProperties(input) {
    const idx = input.indexOf("@layer properties{");
    if (idx === -1) return input;
    let depth = 1;
    let i = idx + "@layer properties{".length;
    while (i < input.length && depth > 0) {
      if (input[i] === "{") depth++;
      if (input[i] === "}") depth--;
      i++;
    }
    return input.slice(0, idx) + input.slice(i);
  })(css);

  // Strip all @property rules (Jelly treats <percentage> as XML tag)
  css = css.replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, "");

  // Strip any remaining empty @layer properties declaration
  css = css.replace(/@layer\s+properties;\s*/g, "");

  // Generate HTML shell for UiPage
  const shellHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>SplitApp</title>
    <sdk:now-ux-globals></sdk:now-ux-globals>
    <style>${css}</style>
    <script src="split_app_main.jsx?uxpcb=$[UxFrameworkScriptables.getFlushTimestamp()]" type="module"></script>
  </head>
  <body>
    <split-app></split-app>
  </body>
</html>`;

  const htmlOut = path.join(CLIENT_DIR, "index.html");
  fs.writeFileSync(htmlOut, shellHtml);

  console.log(`Generated: ${jsPath}`);
  console.log(`Generated: ${htmlOut}`);
}

main();
