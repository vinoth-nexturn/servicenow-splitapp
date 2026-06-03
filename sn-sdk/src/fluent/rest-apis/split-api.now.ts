import { RestApi } from "@servicenow/sdk/core";

RestApi({
  $id: Now.ID["split-api"],
  name: "split_api",
  serviceId: "x_snc_split_app_2",
  consumes: "application/json",
  produces: "application/json",
  active: true,
  shortDescription: "Split App REST API for expense tracking",

  routes: [
    {
      $id: Now.ID["split-api-get-groups"],
      name: "get_groups",
      method: "GET",
      path: "groups",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var user = gs.getUserID();
  var gr = new GlideRecord("x_snc_split_app_2_membership");
  gr.addQuery("user", user);
  gr.query();
  var groups = [];
  while (gr.next()) {
    var g = new GlideRecord("x_snc_split_app_2_group");
    if (g.get(gr.group)) {
      groups.push({
        sys_id: g.getUniqueValue(),
        name: g.name.toString(),
        description: g.description.toString(),
        base_currency: g.base_currency.toString(),
        role: gr.role.toString(),
      });
    }
  }
  return groups;
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-post-groups"],
      name: "post_groups",
      method: "POST",
      path: "groups",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var body = request.body.data;
  var name = body.name;
  var description = body.description || "";
  var currency = body.base_currency || "USD";
  if (!name) throw new sn_ws_err.ServiceError(400, "Group name is required.");
  var dup = new GlideRecord("x_snc_split_app_2_group");
  dup.addQuery("name", name);
  dup.query();
  if (dup.next()) throw new sn_ws_err.ServiceError(409, "A group with this name already exists.");
  var gr = new GlideRecord("x_snc_split_app_2_group");
  gr.initialize();
  gr.name = name;
  gr.description = description;
  gr.base_currency = currency;
  gr.created_by = gs.getUserID();
  var groupId = gr.insert();
  var mem = new GlideRecord("x_snc_split_app_2_membership");
  mem.initialize();
  mem.group = groupId;
  mem.user = gs.getUserID();
  mem.role = "admin";
  mem.insert();
  response.setStatus(201);
  return { sys_id: groupId, name: name };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-get-group"],
      name: "get_group",
      method: "GET",
      path: "groups/{groupId}",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var utils = new x_snc_split_app_2.SplitUtils();
  utils.requireMembership(groupId);
  var gr = new GlideRecord("x_snc_split_app_2_group");
  if (!gr.get(groupId)) throw new sn_ws_err.ServiceError(404, "Group not found.");
  var members = [];
  var memGr = new GlideRecord("x_snc_split_app_2_membership");
  memGr.addQuery("group", groupId);
  memGr.query();
  while (memGr.next()) {
    members.push({ sys_id: memGr.user.toString(), name: memGr.user.getDisplayValue(), role: memGr.role.toString() });
  }
  return { sys_id: gr.getUniqueValue(), name: gr.name.toString(), description: gr.description.toString(), base_currency: gr.base_currency.toString(), members: members };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-post-members"],
      name: "post_members",
      method: "POST",
      path: "groups/{groupId}/members",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var utils = new x_snc_split_app_2.SplitUtils();
  if (!utils.isAdmin(groupId)) throw new sn_ws_err.ServiceError(403, "Only group admins can add members.");
  var body = request.body.data;
  var userId = body.user_sys_id;
  if (!userId && body.user_name) {
    var userGr = new GlideRecord("sys_user");
    userGr.addQuery("name", body.user_name);
    userGr.query();
    if (userGr.next()) userId = userGr.getUniqueValue();
  }
  var role = body.role || "member";
  if (!userId) throw new sn_ws_err.ServiceError(400, "User sys_id or user_name required.");
  var existing = new GlideRecord("x_snc_split_app_2_membership");
  existing.addQuery("group", groupId);
  existing.addQuery("user", userId);
  existing.query();
  if (existing.next()) throw new sn_ws_err.ServiceError(400, "User is already a member.");
  var mem = new GlideRecord("x_snc_split_app_2_membership");
  mem.initialize();
  mem.group = groupId;
  mem.user = userId;
  mem.role = role;
  mem.insert();
  return { status: "added" };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-delete-member"],
      name: "delete_member",
      method: "DELETE",
      path: "groups/{groupId}/members/{userSysId}",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var userId = request.pathParams.userSysId;
  var utils = new x_snc_split_app_2.SplitUtils();
  if (!utils.isAdmin(groupId)) throw new sn_ws_err.ServiceError(403, "Only group admins can remove members.");
  var calc = new x_snc_split_app_2.BalanceCalculator();
  var balances = calc.getGroupBalances(groupId);
  for (var i = 0; i < balances.length; i++) {
    var b = balances[i];
    if (b.from_user === userId || b.to_user === userId) throw new sn_ws_err.ServiceError(400, "Cannot remove a member with outstanding balances.");
  }
  var mem = new GlideRecord("x_snc_split_app_2_membership");
  mem.addQuery("group", groupId);
  mem.addQuery("user", userId);
  mem.query();
  if (mem.next()) mem.deleteRecord();
  return { status: "removed" };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-post-expenses"],
      name: "post_expenses",
      method: "POST",
      path: "groups/{groupId}/expenses",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var body = request.body.data;
  body.group = groupId;
  var mgr = new x_snc_split_app_2.ExpenseManager();
  var expId = mgr.createExpense(body);
  response.setStatus(201);
  return { sys_id: expId };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-get-expenses"],
      name: "get_expenses",
      method: "GET",
      path: "groups/{groupId}/expenses",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var utils = new x_snc_split_app_2.SplitUtils();
  utils.requireMembership(groupId);
  var expenses = [];
  var expGr = new GlideRecord("x_snc_split_app_2_expense");
  expGr.addQuery("group", groupId);
  expGr.orderBy("date");
  expGr.query();
  while (expGr.next()) {
    expenses.push({
      sys_id: expGr.getUniqueValue(),
      description: expGr.description.toString(),
      amount: expGr.amount.toString(),
      date: expGr.date.toString(),
      category: expGr.category.toString(),
      payer: { sys_id: expGr.payer.toString(), name: expGr.payer.getDisplayValue() },
      split_type: expGr.split_type.toString(),
      notes: expGr.notes.toString(),
      receipt_image: expGr.receipt_image.toString(),
    });
  }
  return expenses;
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-get-expense"],
      name: "get_expense",
      method: "GET",
      path: "groups/{groupId}/expenses/{expenseId}",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var expenseId = request.pathParams.expenseId;
  var utils = new x_snc_split_app_2.SplitUtils();
  utils.requireMembership(groupId);
  var expGr = new GlideRecord("x_snc_split_app_2_expense");
  if (!expGr.get(expenseId) || expGr.group.toString() !== groupId) throw new sn_ws_err.ServiceError(404, "Expense not found.");
  var shares = [];
  var shGr = new GlideRecord("x_snc_split_app_2_share");
  shGr.addQuery("expense", expenseId);
  shGr.query();
  while (shGr.next()) {
    shares.push({
      sys_id: shGr.getUniqueValue(),
      user: { sys_id: shGr.user.toString(), name: shGr.user.getDisplayValue() },
      amount: shGr.amount.toString(),
      settled_amount: shGr.settled_amount.toString(),
      settled: shGr.settled.toString(),
    });
  }
  return {
    sys_id: expGr.getUniqueValue(),
    description: expGr.description.toString(),
    amount: expGr.amount.toString(),
    date: expGr.date.toString(),
    category: expGr.category.toString(),
    payer: { sys_id: expGr.payer.toString(), name: expGr.payer.getDisplayValue() },
    split_type: expGr.split_type.toString(),
    notes: expGr.notes.toString(),
    receipt_image: expGr.receipt_image.toString(),
    shares: shares,
  };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-put-expense"],
      name: "put_expense",
      method: "PUT",
      path: "groups/{groupId}/expenses/{expenseId}",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var expenseId = request.pathParams.expenseId;
  var body = request.body.data;
  var mgr = new x_snc_split_app_2.ExpenseManager();
  mgr.updateExpense(expenseId, body);
  return { sys_id: expenseId };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-delete-expense"],
      name: "delete_expense",
      method: "DELETE",
      path: "groups/{groupId}/expenses/{expenseId}",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var expenseId = request.pathParams.expenseId;
  var utils = new x_snc_split_app_2.SplitUtils();
  utils.requireMembership(groupId);
  var mgr = new x_snc_split_app_2.ExpenseManager();
  mgr.deleteExpense(expenseId);
  return { status: "deleted" };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-get-balances"],
      name: "get_balances",
      method: "GET",
      path: "groups/{groupId}/balances",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var utils = new x_snc_split_app_2.SplitUtils();
  utils.requireMembership(groupId);
  var calc = new x_snc_split_app_2.BalanceCalculator();
  return calc.getGroupBalances(groupId);
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-post-settlements"],
      name: "post_settlements",
      method: "POST",
      path: "groups/{groupId}/settlements",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var body = request.body.data;
  body.group = groupId;
  var processor = new x_snc_split_app_2.SettlementProcessor();
  processor.recordSettlement(body);
  return { status: "recorded" };
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-get-dashboard"],
      name: "get_user_dashboard",
      method: "GET",
      path: "user/dashboard",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var calc = new x_snc_split_app_2.BalanceCalculator();
  var dash = calc.getUserDashboard(gs.getUserID());
  dash.current_user = gs.getUserID();
  return dash;
})(request, response);`,
    },
    {
      $id: Now.ID["split-api-delete-group"],
      name: "delete_group",
      method: "DELETE",
      path: "groups/{groupId}",
      script: `
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
  var groupId = request.pathParams.groupId;
  var utils = new x_snc_split_app_2.SplitUtils();
  if (!utils.isAdmin(groupId)) throw new sn_ws_err.ServiceError(403, "Only group admins can delete groups.");
  var settGr = new GlideRecord("x_snc_split_app_2_settlement");
  settGr.addQuery("group", groupId);
  settGr.deleteMultiple();
  var expGr = new GlideRecord("x_snc_split_app_2_expense");
  expGr.addQuery("group", groupId);
  expGr.query();
  while (expGr.next()) {
    var shareGr = new GlideRecord("x_snc_split_app_2_share");
    shareGr.addQuery("expense", expGr.getUniqueValue());
    shareGr.deleteMultiple();
  }
  expGr = new GlideRecord("x_snc_split_app_2_expense");
  expGr.addQuery("group", groupId);
  expGr.deleteMultiple();
  var memGr = new GlideRecord("x_snc_split_app_2_membership");
  memGr.addQuery("group", groupId);
  memGr.deleteMultiple();
  var gr = new GlideRecord("x_snc_split_app_2_group");
  gr.get(groupId);
  gr.deleteRecord();
  return { status: "deleted" };
})(request, response);`,
    },
  ],
});
