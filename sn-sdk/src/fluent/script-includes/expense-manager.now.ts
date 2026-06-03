import { ScriptInclude } from "@servicenow/sdk/core";

ScriptInclude({
  $id: Now.ID["split-si-expense-manager"],
  name: "ExpenseManager",
  active: true,
  clientCallable: false,
  accessibleFrom: "public",
  apiName: "x_snc_split_app_2.ExpenseManager",
  script: Now.include("../../server/script-includes/ExpenseManager.server.js"),
});
