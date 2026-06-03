import { Table, StringColumn, ChoiceColumn, ReferenceColumn } from "@servicenow/sdk/core";

export const x_snc_split_app_2_group = Table({
  $id: Now.ID["split-table-group"],
  name: "x_snc_split_app_2_group",
  label: "Group",
  schema: {
    name: StringColumn({ label: "Name", maxLength: 255, mandatory: true }),
    description: StringColumn({ label: "Description", maxLength: 4000 }),
    base_currency: ChoiceColumn({
      label: "Base Currency",
      choices: { USD: "USD", EUR: "EUR", INR: "INR", GBP: "GBP" },
      default: "USD",
      mandatory: true,
    }),
    created_by: ReferenceColumn({
      label: "Created By",
      referenceTable: "sys_user" as const,
    }),
  },
});
