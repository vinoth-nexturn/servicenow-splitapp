import { ScriptInclude } from "@servicenow/sdk/core";

ScriptInclude({
  $id: Now.ID["split-si-settlement-processor"],
  name: "SettlementProcessor",
  active: true,
  clientCallable: false,
  accessibleFrom: "public",
  apiName: "x_snc_split_app_2.SettlementProcessor",
  script: Now.include("../../server/script-includes/SettlementProcessor.server.js"),
});
