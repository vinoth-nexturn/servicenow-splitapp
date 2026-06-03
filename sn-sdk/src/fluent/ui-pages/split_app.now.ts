import { UiPage } from "@servicenow/sdk/core";
import page from "../../client/index.html";

UiPage({
  $id: Now.ID["split-ui-page"],
  category: "general",
  endpoint: "x_snc_split_app_2_split_app.do",
  description: "Split App — track shared expenses and settle up with friends",
  direct: true,
  html: page,
});
