var SetupApp = Class.create();
SetupApp.prototype = {
  initialize: function (appSysId) {
    this.appSysId = appSysId;
    this._tableCache = {};
  },

  createTables: function () {
    var names = ["x_snc_split_app_2_group", "x_snc_split_app_2_membership", "x_snc_split_app_2_expense", "x_snc_split_app_2_share", "x_snc_split_app_2_settlement"];
    var labels = ["Group", "Membership", "Expense", "Expense Share", "Settlement"];
    var results = {};
    for (var i = 0; i < names.length; i++) {
      results[names[i]] = this._createTable(names[i], labels[i]);
    }
    return results;
  },

  _createTable: function (name, label) {
    var gr = new GlideRecord("sys_db_object");
    if (gr.get("name", name)) {
      this._tableCache[name] = gr.getUniqueValue();
      return { sys_id: gr.getUniqueValue(), status: "exists" };
    }
    gr.initialize();
    gr.name = name;
    gr.label = label;
    gr.sys_scope = this.appSysId;
    var id = gr.insert();
    this._tableCache[name] = id;
    return { sys_id: id, status: "created" };
  },

  _resolveTable: function (tableName) {
    if (this._tableCache[tableName]) return this._tableCache[tableName];
    var gr = new GlideRecord("sys_db_object");
    if (gr.get("name", tableName)) {
      this._tableCache[tableName] = gr.getUniqueValue();
      return gr.getUniqueValue();
    }
    return tableName;
  },

  createFields: function () {
    var results = {};
    results.x_snc_split_app_2_group = this._groupFields();
    results.x_snc_split_app_2_membership = this._membershipFields();
    results.x_snc_split_app_2_expense = this._expenseFields();
    results.x_snc_split_app_2_share = this._shareFields();
    results.x_snc_split_app_2_settlement = this._settlementFields();
    return results;
  },

  _field: function (tableName, name, type, opts) {
    opts = opts || {};
    var tableId = this._resolveTable(tableName);
    var existing = new GlideRecord("sys_dictionary");
    existing.addQuery("name", name);
    existing.addQuery("sys_db_object", tableId);
    existing.query();
    if (existing.next()) return { name: name, sys_id: existing.getUniqueValue(), status: "exists" };

    var gr = new GlideRecord("sys_dictionary");
    gr.initialize();
    gr.name = name;
    gr.sys_scope = this.appSysId;
    gr.sys_db_object = tableId;
    gr.active = true;
    gr.internal_type = type;
    if (opts.mandatory) gr.mandatory = true;
    if (opts.read_only) gr.read_only = true;
    if (opts.max_length) gr.max_length = String(opts.max_length);
    if (opts.reference) gr.reference = this._resolveTable(opts.reference);
    if (opts.default_value !== undefined) gr.default_value = String(opts.default_value);
    return { name: name, sys_id: gr.insert(), status: "created" };
  },

  _groupFields: function () {
    var t = "x_snc_split_app_2_group";
    return [
      this._field(t, "name", "string", { max_length: 255, mandatory: true }),
      this._field(t, "description", "string", { max_length: 4000 }),
      this._field(t, "base_currency", "string", { max_length: 10, mandatory: true, default_value: "USD" }),
      this._field(t, "created_by", "glide_object", { read_only: true, reference: "sys_user" }),
    ];
  },

  _membershipFields: function () {
    var t = "x_snc_split_app_2_membership";
    return [
      this._field(t, "group", "glide_object", { mandatory: true, reference: "x_snc_split_app_2_group" }),
      this._field(t, "user", "glide_object", { mandatory: true, reference: "sys_user" }),
      this._field(t, "role", "string", { max_length: 20, mandatory: true, default_value: "member" }),
    ];
  },

  _expenseFields: function () {
    var t = "x_snc_split_app_2_expense";
    return [
      this._field(t, "group", "glide_object", { mandatory: true, reference: "x_snc_split_app_2_group" }),
      this._field(t, "description", "string", { max_length: 255, mandatory: true }),
      this._field(t, "amount", "decimal", { mandatory: true }),
      this._field(t, "date", "glide_date", { mandatory: true }),
      this._field(t, "category", "string", { max_length: 40, mandatory: true, default_value: "Other" }),
      this._field(t, "payer", "glide_object", { mandatory: true, reference: "sys_user" }),
      this._field(t, "split_type", "string", { max_length: 20, mandatory: true }),
      this._field(t, "notes", "string", { max_length: 500 }),
      this._field(t, "receipt_image", "string", { max_length: 500 }),
    ];
  },

  _shareFields: function () {
    var t = "x_snc_split_app_2_share";
    return [
      this._field(t, "expense", "glide_object", { mandatory: true, reference: "x_snc_split_app_2_expense" }),
      this._field(t, "user", "glide_object", { mandatory: true, reference: "sys_user" }),
      this._field(t, "amount", "decimal", { mandatory: true }),
      this._field(t, "percentage", "decimal"),
      this._field(t, "shares", "integer"),
      this._field(t, "settled_amount", "decimal", { default_value: 0 }),
    ];
  },

  _settlementFields: function () {
    var t = "x_snc_split_app_2_settlement";
    return [
      this._field(t, "group", "glide_object", { mandatory: true, reference: "x_snc_split_app_2_group" }),
      this._field(t, "from_user", "glide_object", { mandatory: true, reference: "sys_user" }),
      this._field(t, "to_user", "glide_object", { mandatory: true, reference: "sys_user" }),
      this._field(t, "amount", "decimal", { mandatory: true }),
      this._field(t, "date", "glide_date", { mandatory: true }),
      this._field(t, "payment_method", "string", { max_length: 100 }),
      this._field(t, "notes", "string", { max_length: 500 }),
    ];
  },

  createChoices: function () {
    var defs = [
      { table: "x_snc_split_app_2_group", element: "base_currency", values: ["USD", "EUR", "INR", "GBP"] },
      { table: "x_snc_split_app_2_expense", element: "category", values: ["Food & Drink", "Travel", "Utilities", "Entertainment", "Other"] },
      { table: "x_snc_split_app_2_expense", element: "split_type", values: ["equal", "exact", "percentage", "shares"] },
      { table: "x_snc_split_app_2_membership", element: "role", values: ["admin", "member"] },
    ];
    var results = {};
    for (var d = 0; d < defs.length; d++) {
      var key = defs[d].table + "." + defs[d].element;
      results[key] = [];
      for (var v = 0; v < defs[d].values.length; v++) {
        results[key].push(this._addChoice(defs[d].table, defs[d].element, defs[d].values[v], v + 1));
      }
    }
    return results;
  },

  _addChoice: function (table, element, value, seq) {
    var gr = new GlideRecord("sys_choice");
    gr.addQuery("table", table);
    gr.addQuery("element", element);
    gr.addQuery("value", value);
    gr.query();
    if (gr.next()) return { value: value, status: "exists" };
    gr.initialize();
    gr.sys_scope = this.appSysId;
    gr.name = element;
    gr.table = table;
    gr.element = element;
    gr.value = value;
    gr.label = value;
    gr.sequence = String(seq);
    return { value: value, sys_id: gr.insert(), status: "created" };
  },

  createOperation: function (name, method, path, script, wsDefSysId) {
    var gr = new GlideRecord("sys_ws_operation");
    gr.addQuery("name", name);
    gr.addQuery("web_service_definition", wsDefSysId);
    gr.query();
    if (gr.next()) {
      gr.script = script;
      gr.method = method;
      gr.relative_path = this._stripApiPrefix(path);
      gr.resource_path = path;
      gr.active = true;
      gr.consumes = "application/json";
      gr.produces = "application/json";
      gr.update();
      return { name: name, sys_id: gr.getUniqueValue(), status: "updated" };
    }
    gr.initialize();
    gr.name = name;
    gr.method = method;
    gr.relative_path = this._stripApiPrefix(path);
    gr.resource_path = path;
    gr.script = script;
    gr.web_service_definition = wsDefSysId;
    gr.sys_scope = this.appSysId;
    gr.active = true;
    gr.consumes = "application/json";
    gr.produces = "application/json";
    return { name: name, sys_id: gr.insert(), status: "created" };
  },

  _stripApiPrefix: function (fullPath) {
    var m = fullPath.match(/\/api\/[^\/]+\/(.+)/);
    return m ? m[1] : fullPath;
  },

  type: "SetupApp",
};
