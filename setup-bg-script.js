/**
 * Split App — Bootstrap Background Script
 *
 * Run this ONCE before the deploy script:
 *   1. Log into your instance
 *   2. Navigate to: https://<instance>.service-now.com/sys.scripts_background.do
 *   3. Paste this entire script
 *   4. Click "Run script"
 *
 * This creates all tables, fields, choices, and REST API operations
 * via server-side GlideRecord, bypassing PDI business rules.
 */

(function setup() {
  var results = {};

  // Resolve app sys_id
  var appGr = new GlideRecord("sys_app");
  if (!appGr.get("scope", "x_snc_split_app_2")) {
    appGr.initialize();
    appGr.name = "Split App";
    appGr.scope = "x_snc_split_app_2";
    appGr.description = "Splitwise-like expense splitting app";
    results.app = { status: "created", sys_id: appGr.insert() };
  } else {
    results.app = { status: "exists", sys_id: appGr.getUniqueValue() };
  }
  var APP_SYS_ID = results.app.sys_id;

  // Resolve scope sys_id for reference fields
  var scopeGr = new GlideRecord("sys_scope");
  scopeGr.get("name", "x_snc_split_app_2");
  var SCOPE_SYS_ID = scopeGr.getUniqueValue();

  // Tables
  var tableDefs = [
    { name: "x_snc_split_app_2_group", label: "Group" },
    { name: "x_snc_split_app_2_membership", label: "Membership" },
    { name: "x_snc_split_app_2_expense", label: "Expense" },
    { name: "x_snc_split_app_2_share", label: "Expense Share" },
    { name: "x_snc_split_app_2_settlement", label: "Settlement" },
  ];
  var tableIds = {};
  results.tables = [];
  for (var ti = 0; ti < tableDefs.length; ti++) {
    var td = tableDefs[ti];
    var gr = new GlideRecord("sys_db_object");
    if (gr.get("name", td.name)) {
      tableIds[td.name] = gr.getUniqueValue();
      results.tables.push({ name: td.name, status: "exists" });
    } else {
      gr.initialize();
      gr.name = td.name;
      gr.label = td.label;
      gr.sys_scope = SCOPE_SYS_ID;
      tableIds[td.name] = gr.insert();
      results.tables.push({ name: td.name, status: "created" });
    }
  }

  function rt(name) {
    return tableIds[name] || name;
  }

  // Fields
  // Note: sys_dictionary.name = table name, sys_dictionary.element = field name
  // On newer ServiceNow versions, sys_db_object field doesn't exist on sys_dictionary
  var fieldDefs = {
    x_snc_split_app_2_group: [
      { n: "name", t: "string", ml: 255, man: true },
      { n: "description", t: "string", ml: 4000 },
      { n: "base_currency", t: "string", ml: 10, man: true, dv: "USD" },
      { n: "created_by", t: "glide_object", ro: true, ref: "sys_user" },
    ],
    x_snc_split_app_2_membership: [
      { n: "group", t: "glide_object", man: true, ref: "x_snc_split_app_2_group" },
      { n: "user", t: "glide_object", man: true, ref: "sys_user" },
      { n: "role", t: "string", ml: 20, man: true, dv: "member" },
    ],
    x_snc_split_app_2_expense: [
      { n: "group", t: "glide_object", man: true, ref: "x_snc_split_app_2_group" },
      { n: "description", t: "string", ml: 255, man: true },
      { n: "amount", t: "decimal", man: true },
      { n: "date", t: "glide_date", man: true },
      { n: "category", t: "string", ml: 40, man: true, dv: "Other" },
      { n: "payer", t: "glide_object", man: true, ref: "sys_user" },
      { n: "split_type", t: "string", ml: 20, man: true },
      { n: "notes", t: "string", ml: 100 },
      { n: "receipt_image", t: "string" },
    ],
    x_snc_split_app_2_share: [
      { n: "expense", t: "glide_object", man: true, ref: "x_snc_split_app_2_expense" },
      { n: "user", t: "glide_object", man: true, ref: "sys_user" },
      { n: "amount", t: "decimal", man: true },
      { n: "percentage", t: "decimal" },
      { n: "shares", t: "integer" },
      { n: "settled_amount", t: "decimal", dv: "0" },
    ],
    x_snc_split_app_2_settlement: [
      { n: "group", t: "glide_object", man: true, ref: "x_snc_split_app_2_group" },
      { n: "from_user", t: "glide_object", man: true, ref: "sys_user" },
      { n: "to_user", t: "glide_object", man: true, ref: "sys_user" },
      { n: "amount", t: "decimal", man: true },
      { n: "date", t: "glide_date", man: true },
      { n: "payment_method", t: "string", ml: 100 },
      { n: "notes", t: "string", ml: 100 },
    ],
  };
  results.fields = [];
  for (var tn in fieldDefs) {
    var tableId = rt(tn);
    for (var fi = 0; fi < fieldDefs[tn].length; fi++) {
      var fd = fieldDefs[tn][fi];
      var ex = new GlideRecord("sys_dictionary");
      ex.addQuery("name", tn);
      ex.addQuery("element", fd.n);
      ex.query();
      if (ex.next()) {
        results.fields.push({ name: tn + "." + fd.n, status: "exists" });
        continue;
      }
      var fgr = new GlideRecord("sys_dictionary");
      fgr.initialize();
      fgr.name = tn;
      fgr.element = fd.n;
      fgr.sys_scope = SCOPE_SYS_ID;
      fgr.active = true;
      fgr.internal_type = fd.t;
      if (fd.man) fgr.mandatory = true;
      if (fd.ro) fgr.read_only = true;
      if (fd.ml) fgr.max_length = String(fd.ml);
      if (fd.ref) fgr.reference = rt(fd.ref);
      if (fd.dv !== undefined) fgr.default_value = String(fd.dv);
      fgr.insert();
      results.fields.push({ name: tn + "." + fd.n, status: "created" });
    }
  }

  // Choices
  // Note: sys_choice.name = table name, sys_choice.element = field name (same pattern as sys_dictionary)
  var choiceDefs = [
    { t: "x_snc_split_app_2_group", e: "base_currency", v: ["USD", "EUR", "INR", "GBP"] },
    { t: "x_snc_split_app_2_expense", e: "category", v: ["Food & Drink", "Travel", "Utilities", "Entertainment", "Other"] },
    { t: "x_snc_split_app_2_expense", e: "split_type", v: ["equal", "exact", "percentage", "shares"] },
    { t: "x_snc_split_app_2_membership", e: "role", v: ["admin", "member"] },
  ];
  results.choices = [];
  for (var ci = 0; ci < choiceDefs.length; ci++) {
    var cd = choiceDefs[ci];
    for (var vi = 0; vi < cd.v.length; vi++) {
      var cex = new GlideRecord("sys_choice");
      cex.addQuery("name", cd.t);
      cex.addQuery("element", cd.e);
      cex.addQuery("value", cd.v[vi]);
      cex.query();
      if (cex.next()) {
        results.choices.push({ key: cd.t + "." + cd.e + "=" + cd.v[vi], status: "exists" });
        continue;
      }
      var cgr = new GlideRecord("sys_choice");
      cgr.initialize();
      cgr.sys_scope = SCOPE_SYS_ID;
      cgr.name = cd.t;
      cgr.element = cd.e;
      cgr.value = cd.v[vi];
      cgr.label = cd.v[vi];
      cgr.sequence = String(vi + 1);
      cgr.insert();
      results.choices.push({ key: cd.t + "." + cd.e + "=" + cd.v[vi], status: "created" });
    }
  }

  // Web Service Definition
  var wsdGr = new GlideRecord("sys_ws_definition");
  if (!wsdGr.get("name", "split_api")) {
    wsdGr.initialize();
    wsdGr.name = "split_api";
    wsdGr.service_id = "x_snc_split_app_2";
    wsdGr.api_path = "x_snc_split_app_2";
    wsdGr.active = true;
    wsdGr.sys_scope = SCOPE_SYS_ID;
    results.ws_def = { status: "created", sys_id: wsdGr.insert() };
  } else {
    wsdGr.service_id = "x_snc_split_app_2";
    wsdGr.update();
    results.ws_def = { status: "exists", sys_id: wsdGr.getUniqueValue() };
  }
  var WSDEF_SYS_ID = results.ws_def.sys_id;

  // Operation scripts (read via GlideSysAttachment or hardcoded)
  function getOpScript(name) {
    var path = name + ".js";
    // Try attachment first
    var attGr = new GlideRecord("sys_attachment");
    attGr.addQuery("table_name", "x_snc_split_app_2_setup");
    attGr.addQuery("file_name", path);
    attGr.query();
    if (attGr.next()) {
      var sa = new GlideSysAttachment();
      return sa.getContent(attGr.getUniqueValue());
    }
    return "";
  }

  // Operations
  var opDefs = [
    {
      name: "get_groups",
      method: "GET",
      path: "groups",
      script: '(function process(request, response) { var gr = new GlideRecord("x_snc_split_app_2_membership"); gr.addQuery("user", gs.getUserID()); gr.query(); var groups = []; while (gr.next()) { var ggr = new GlideRecord("x_snc_split_app_2_group"); ggr.get(gr.group.toString()); groups.push({sys_id: ggr.getUniqueValue(), name: ggr.name.toString(), description: ggr.description.toString(), base_currency: ggr.base_currency.toString(), role: gr.role.toString()}); } return groups; })(request, response)',
    },
    {
      name: "post_groups",
      method: "POST",
      path: "groups",
      script: '(function process(request, response) { var body = request.body.data; var name = body.name; var description = body.description || ""; var currency = body.base_currency || "USD"; if (!name) { throw new sn_ws_err.ServiceError(400, "Group name is required."); } var dup = new GlideRecord("x_snc_split_app_2_group"); dup.addQuery("name", name); dup.query(); if (dup.next()) { throw new sn_ws_err.ServiceError(409, "A group with this name already exists."); } var gr = new GlideRecord("x_snc_split_app_2_group"); gr.initialize(); gr.name = name; gr.description = description; gr.base_currency = currency; gr.created_by = gs.getUserID(); var groupId = gr.insert(); var mem = new GlideRecord("x_snc_split_app_2_membership"); mem.initialize(); mem.group = groupId; mem.user = gs.getUserID(); mem.role = "admin"; mem.insert(); response.setStatus(201); return { sys_id: groupId, name: name }; })(request, response)',
    },
    {
      name: "get_group",
      method: "GET",
      path: "groups/{groupId}",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var utils = new x_snc_split_app_2.SplitUtils(); utils.requireMembership(groupId); var gr = new GlideRecord("x_snc_split_app_2_group"); if (!gr.get(groupId)) throw new sn_ws_err.ServiceError(404, "Group not found."); var members = []; var memGr = new GlideRecord("x_snc_split_app_2_membership"); memGr.addQuery("group", groupId); memGr.query(); while (memGr.next()) { members.push({ sys_id: memGr.user.toString(), name: memGr.user.getDisplayValue(), role: memGr.role.toString() }); } return { sys_id: gr.getUniqueValue(), name: gr.name.toString(), description: gr.description.toString(), base_currency: gr.base_currency.toString(), members: members }; })(request, response)',
    },
    {
      name: "delete_group",
      method: "DELETE",
      path: "groups/{groupId}",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var utils = new x_snc_split_app_2.SplitUtils(); if (!utils.isAdmin(groupId)) throw new sn_ws_err.ServiceError(403, "Only group admins can delete groups."); var settGr = new GlideRecord("x_snc_split_app_2_settlement"); settGr.addQuery("group", groupId); settGr.deleteMultiple(); var expGr = new GlideRecord("x_snc_split_app_2_expense"); expGr.addQuery("group", groupId); expGr.query(); while (expGr.next()) { var shareGr = new GlideRecord("x_snc_split_app_2_share"); shareGr.addQuery("expense", expGr.getUniqueValue()); shareGr.deleteMultiple(); } expGr = new GlideRecord("x_snc_split_app_2_expense"); expGr.addQuery("group", groupId); expGr.deleteMultiple(); var memGr = new GlideRecord("x_snc_split_app_2_membership"); memGr.addQuery("group", groupId); memGr.deleteMultiple(); var gr = new GlideRecord("x_snc_split_app_2_group"); gr.get(groupId); gr.deleteRecord(); return { status: "deleted" }; })(request, response)',
    },
    {
      name: "post_members",
      method: "POST",
      path: "groups/{groupId}/members",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var utils = new x_snc_split_app_2.SplitUtils(); if (!utils.isAdmin(groupId)) throw new sn_ws_err.ServiceError(403, "Only group admins can add members."); var body = request.body.data; var userId = body.user_sys_id; if (!userId && body.user_name) { var userGr = new GlideRecord("sys_user"); userGr.addQuery("name", body.user_name); userGr.query(); if (userGr.next()) userId = userGr.getUniqueValue(); } var role = body.role || "member"; if (!userId) throw new sn_ws_err.ServiceError(400, "User sys_id or user_name required."); var existing = new GlideRecord("x_snc_split_app_2_membership"); existing.addQuery("group", groupId); existing.addQuery("user", userId); existing.query(); if (existing.next()) throw new sn_ws_err.ServiceError(400, "User is already a member."); var mem = new GlideRecord("x_snc_split_app_2_membership"); mem.initialize(); mem.group = groupId; mem.user = userId; mem.role = role; mem.insert(); return { status: "added" }; })(request, response)',
    },
    {
      name: "delete_member",
      method: "DELETE",
      path: "groups/{groupId}/members/{userSysId}",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var userId = request.pathParams.userSysId; var utils = new x_snc_split_app_2.SplitUtils(); if (!utils.isAdmin(groupId)) throw new sn_ws_err.ServiceError(403, "Only group admins can remove members."); var calc = new x_snc_split_app_2.BalanceCalculator(); var balances = calc.getGroupBalances(groupId); for (var i = 0; i < balances.length; i++) { var b = balances[i]; if (b.from_user === userId || b.to_user === userId) throw new sn_ws_err.ServiceError(400, "Cannot remove a member with outstanding balances."); } var gr = new GlideRecord("x_snc_split_app_2_membership"); gr.addQuery("group", groupId); gr.addQuery("user", userId); gr.query(); if (gr.next()) { gr.deleteRecord(); return { status: "removed" }; } throw new sn_ws_err.ServiceError(404, "Membership not found."); })(request, response)',
    },
    {
      name: "post_expenses",
      method: "POST",
      path: "groups/{groupId}/expenses",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var body = request.body.data; body.group = groupId; var mgr = new x_snc_split_app_2.ExpenseManager(); var expId = mgr.createExpense(body); response.setStatus(201); return { sys_id: expId }; })(request, response)',
    },
    {
      name: "get_expenses",
      method: "GET",
      path: "groups/{groupId}/expenses",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var utils = new x_snc_split_app_2.SplitUtils(); utils.requireMembership(groupId); var expenses = []; var expGr = new GlideRecord("x_snc_split_app_2_expense"); expGr.addQuery("group", groupId); expGr.orderBy("date"); expGr.query(); while (expGr.next()) { expenses.push({sys_id: expGr.getUniqueValue(), description: expGr.description.toString(), amount: expGr.amount.toString(), date: expGr.date.toString(), category: expGr.category.toString(), payer: {sys_id: expGr.payer.toString(), name: expGr.payer.getDisplayValue()}, split_type: expGr.split_type.toString(), notes: expGr.notes.toString(), receipt_image: expGr.receipt_image.toString()}); } return expenses; })(request, response)',
    },
    {
      name: "put_expense",
      method: "PUT",
      path: "groups/{groupId}/expenses/{expenseId}",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var expenseId = request.pathParams.expenseId; var body = request.body.data; var mgr = new x_snc_split_app_2.ExpenseManager(); mgr.updateExpense(expenseId, body); return { sys_id: expenseId }; })(request, response)',
    },
    {
      name: "delete_expense",
      method: "DELETE",
      path: "groups/{groupId}/expenses/{expenseId}",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var expenseId = request.pathParams.expenseId; var utils = new x_snc_split_app_2.SplitUtils(); utils.requireMembership(groupId); var mgr = new x_snc_split_app_2.ExpenseManager(); mgr.deleteExpense(expenseId); return { status: "deleted" }; })(request, response)',
    },
    {
      name: "get_expense",
      method: "GET",
      path: "groups/{groupId}/expenses/{expenseId}",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var expenseId = request.pathParams.expenseId; var utils = new x_snc_split_app_2.SplitUtils(); utils.requireMembership(groupId); var expGr = new GlideRecord("x_snc_split_app_2_expense"); if (!expGr.get(expenseId) || expGr.group.toString() !== groupId) { throw new sn_ws_err.ServiceError(404, "Expense not found."); } var shares = []; var shGr = new GlideRecord("x_snc_split_app_2_share"); shGr.addQuery("expense", expenseId); shGr.query(); while (shGr.next()) { shares.push({sys_id: shGr.getUniqueValue(), user: {sys_id: shGr.user.toString(), name: shGr.user.getDisplayValue()}, amount: shGr.amount.toString(), settled_amount: shGr.settled_amount.toString(), settled: shGr.settled.toString()}); } return {sys_id: expGr.getUniqueValue(), description: expGr.description.toString(), amount: expGr.amount.toString(), date: expGr.date.toString(), category: expGr.category.toString(), payer: {sys_id: expGr.payer.toString(), name: expGr.payer.getDisplayValue()}, split_type: expGr.split_type.toString(), notes: expGr.notes.toString(), receipt_image: expGr.receipt_image.toString(), shares: shares}; })(request, response)',
    },
    {
      name: "get_balances",
      method: "GET",
      path: "groups/{groupId}/balances",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var utils = new x_snc_split_app_2.SplitUtils(); utils.requireMembership(groupId); var calc = new x_snc_split_app_2.BalanceCalculator(); var balances = calc.getGroupBalances(groupId); return balances; })(request, response)',
    },
    {
      name: "post_settlements",
      method: "POST",
      path: "groups/{groupId}/settlements",
      script: '(function process(request, response) { var groupId = request.pathParams.groupId; var body = request.body.data; body.group = groupId; var proc = new x_snc_split_app_2.SettlementProcessor(); proc.recordSettlement(body); return { status: "recorded" }; })(request, response)',
    },
    {
      name: "get_user_dashboard",
      method: "GET",
      path: "user/dashboard",
      script: '(function process(request, response) { var calc = new x_snc_split_app_2.BalanceCalculator(); var dash = calc.getUserDashboard(gs.getUserID()); dash.current_user = gs.getUserID(); return dash; })(request, response)',
    },
  ];

  results.operations = [];
  for (var oi = 0; oi < opDefs.length; oi++) {
    var od = opDefs[oi];
    var oex = new GlideRecord("sys_ws_operation");
    oex.addQuery("name", od.name);
    oex.addQuery("web_service_definition", WSDEF_SYS_ID);
    oex.query();
    var resourcePath = "/api/x_snc_split_app_2/" + od.path;
    if (oex.next()) {
      oex.script = od.script;
      oex.method = od.method;
      oex.relative_path = od.path;
      oex.resource_path = resourcePath;
      oex.active = true;
      oex.consumes = "application/json";
      oex.produces = "application/json";
      oex.update();
      results.operations.push({ name: od.name, status: "updated" });
    } else {
      var oGr = new GlideRecord("sys_ws_operation");
      oGr.initialize();
      oGr.name = od.name;
      oGr.method = od.method;
      oGr.relative_path = od.path;
      oGr.resource_path = resourcePath;
      oGr.script = od.script;
      oGr.web_service_definition = WSDEF_SYS_ID;
      oGr.sys_scope = SCOPE_SYS_ID;
      oGr.active = true;
      oGr.consumes = "application/json";
      oGr.produces = "application/json";
      oGr.insert();
      results.operations.push({ name: od.name, status: "created" });
    }
  }

  // Output results
  gs.info("=== Split App Bootstrap Complete ===");
  gs.info("App: " + results.app.sys_id + " (" + results.app.status + ")");
  for (var ri = 0; ri < results.tables.length; ri++) {
    gs.info("Table " + results.tables[ri].name + ": " + results.tables[ri].status);
  }
  gs.info("Fields created: " + results.fields.length);
  gs.info("Choices created: " + results.choices.length);
  gs.info("WS Def: " + results.ws_def.sys_id + " (" + results.ws_def.status + ")");
  for (var oi2 = 0; oi2 < results.operations.length; oi2++) {
    gs.info("Op " + results.operations[oi2].name + ": " + results.operations[oi2].status);
  }
  gs.info("=== Done ===");

  return "Bootstrap complete. " + results.tables.length + " tables, " + results.fields.length + " fields, " + results.choices.length + " choices, " + results.operations.length + " operations.";
})();
