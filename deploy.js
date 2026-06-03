#!/usr/bin/env node
const https = require("https");
const fs = require("fs");
const path = require("path");

const SN_DIR = path.join(__dirname, "sn");
const [instanceUrl, username, password] = process.argv.slice(2);

if (!instanceUrl || !username || !password) {
  console.error("Usage: node deploy.js <instance-url> <username> <password>");
  process.exit(1);
}

const BASE = `${instanceUrl.replace(/\/$/, "")}/api/now`;
const AUTH = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

function rest(method, tableOrPath, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}/${tableOrPath}`);
    const h = { "Content-Type": "application/json", Accept: "application/json", Authorization: AUTH };
    const payload = ["POST", "PATCH", "PUT"].includes(method) ? JSON.stringify(data) : undefined;
    if (payload) h["Content-Length"] = Buffer.byteLength(payload);
    const opts = { hostname: url.hostname, port: url.port || 443, path: url.pathname + url.search, method, headers: h };
    const r = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        let p;
        try { p = JSON.parse(body); } catch { p = body; }
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(p);
        reject(new Error(`HTTP ${res.statusCode}: ${typeof p === "object" ? JSON.stringify(p).slice(0, 300) : String(p).slice(0, 300)}`));
      });
    });
    r.on("error", reject);
    if (payload) r.write(payload);
    r.end();
  });
}

function find(table, query) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}/table/${table}`);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    url.searchParams.set("sysparm_limit", "1");
    const opts = { hostname: url.hostname, port: url.port || 443, path: url.pathname + url.search, method: "GET", headers: { Accept: "application/json", Authorization: AUTH } };
    const r = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { const p = JSON.parse(body); if (p.result && p.result.length > 0) return resolve(p.result[0]); } catch {}
        resolve(null);
      });
    });
    r.on("error", reject);
    r.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function deploy() {
  console.log("\n=== Deploying to " + instanceUrl + " ===\n");

  // --- 1. Application (create if not exists) ---
  console.log("[1] Application...");
  const appMeta = JSON.parse(fs.readFileSync(path.join(SN_DIR, "app.json"), "utf8"));
  let app = await find("sys_app", { name: appMeta.name });
  if (!app) {
    app = (await rest("POST", "table/sys_app", { name: appMeta.name, scope: "x_snc_split_app_2", description: appMeta.description || "" })).result;
    console.log("  Created: " + app.sys_id);
  } else {
    console.log("  Found: " + app.sys_id);
  }
  await sleep(300);

  // --- 2. Script includes ---
  console.log("[2] Script includes...");
  const scriptFiles = fs.readdirSync(path.join(SN_DIR, "sys_script_include")).filter(function(f) { return f.endsWith(".js"); });
  for (const file of scriptFiles) {
    const name = path.basename(file, ".js");
    const script = fs.readFileSync(path.join(SN_DIR, "sys_script_include", file), "utf8");
    try {
      const existing = await find("sys_script_include", { name: name });
      if (existing) {
        await rest("PATCH", "table/sys_script_include/" + existing.sys_id, { script: script });
        console.log("  " + name + ": updated");
      } else {
        await rest("POST", "table/sys_script_include", { name: name, api_name: "x_snc_split_app_2." + name, script: script, access: "package_private" });
        console.log("  " + name + ": created");
      }
    } catch (e) { console.error("  " + name + ": " + e.message.slice(0, 100)); }
    await sleep(300);
  }

  // --- 3. Web service definition ---
  console.log("[3] Web service definition...");
  const wsDef = JSON.parse(fs.readFileSync(path.join(SN_DIR, "sys_ws_definition", "split_api.json"), "utf8"));
  let wsDefRec = await find("sys_ws_definition", { name: wsDef.name });
  let wsDefId, apiBasePath;
  if (wsDefRec) {
    wsDefId = wsDefRec.sys_id;
    // Update service_id to match api_path so the API is at /api/x_snc_split_app_2/... (minus instance ID prefix)
    await rest("PATCH", "table/sys_ws_definition/" + wsDefId, {
      service_id: "x_snc_split_app_2",
      active: true,
    }).catch(function() {});
    // Read back the base_uri to discover the actual API path
    const updated = await rest("GET", "table/sys_ws_definition/" + wsDefId + "?sysparm_fields=base_uri,service_id");
    apiBasePath = updated.result && updated.result.base_uri ? updated.result.base_uri : "/api/x_snc_split_app_2";
    console.log("  Found: " + wsDefId + " (API at " + apiBasePath + ")");
  } else {
    const created = await rest("POST", "table/sys_ws_definition", { name: wsDef.name, service_id: "x_snc_split_app_2", active: true });
    wsDefId = created.result.sys_id;
    apiBasePath = "/api/x_snc_split_app_2";
    console.log("  Created: " + wsDefId);
  }
  await sleep(500);

  // --- 4. Web service operations ---
  console.log("[4] Web service operations (" + apiBasePath + ")...");
  for (let oi = 0; oi < wsDef.operations.length; oi++) {
    const op = wsDef.operations[oi];
    const opName = op.name;
    const opFile = path.join(SN_DIR, "sys_ws_operation", opName + ".js");
    let opScript = "";
    if (fs.existsSync(opFile)) opScript = fs.readFileSync(opFile, "utf8");

    // REST API field name is operation_script, not script
    const patchBody = {
      operation_script: opScript,
      http_method: op.method,
      relative_path: op.relative_path,
      active: true,
      consumes: "application/json",
      produces: "application/json",
    };

    try {
      const existing = await find("sys_ws_operation", { name: opName, web_service_definition: wsDefId });
      if (existing) {
        // Also update resource_path based on apiBasePath
        patchBody.resource_path = apiBasePath + "/" + op.relative_path;
        await rest("PATCH", "table/sys_ws_operation/" + existing.sys_id, patchBody);
        console.log("  " + opName + ": updated");
      } else {
        patchBody.name = opName;
        patchBody.web_service_definition = wsDefId;
        patchBody.resource_path = apiBasePath + "/" + op.relative_path;
        await rest("POST", "table/sys_ws_operation", patchBody);
        console.log("  " + opName + ": created");
      }
    } catch (e) {
      console.log("  " + opName + ": " + e.message.slice(0, 120));
    }
    await sleep(400);
  }

  console.log("\n=== Done ===");
  console.log("API base: " + apiBasePath);
  console.log("Test: " + instanceUrl.replace(/\/$/, "") + apiBasePath + "/user/dashboard");
}

deploy().catch(function(e) { console.error("FAILED:", e.message); process.exit(1); });
