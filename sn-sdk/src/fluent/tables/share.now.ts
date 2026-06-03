import { Table, ReferenceColumn, DecimalColumn, IntegerColumn, BooleanColumn } from "@servicenow/sdk/core";

export const x_snc_split_app_2_share = Table({
  $id: Now.ID["split-table-share"],
  name: "x_snc_split_app_2_share",
  label: "Expense Share",
  schema: {
    expense: ReferenceColumn({
      label: "Expense",
      referenceTable: "x_snc_split_app_2_expense" as const,
      mandatory: true,
    }),
    user: ReferenceColumn({
      label: "User",
      referenceTable: "sys_user" as const,
      mandatory: true,
    }),
    amount: DecimalColumn({ label: "Amount", mandatory: true }),
    percentage: DecimalColumn({ label: "Percentage", nullable: true }),
    shares: IntegerColumn({ label: "Shares", nullable: true }),
    settled_amount: DecimalColumn({ label: "Settled Amount", default: 0 }),
    settled: BooleanColumn({ label: "Settled" }),
  },
});
