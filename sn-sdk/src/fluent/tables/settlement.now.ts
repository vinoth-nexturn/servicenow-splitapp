import { Table, ReferenceColumn, DecimalColumn, DateColumn, StringColumn } from "@servicenow/sdk/core";

export const x_snc_split_app_2_settlement = Table({
  $id: Now.ID["split-table-settlement"],
  name: "x_snc_split_app_2_settlement",
  label: "Settlement",
  schema: {
    group: ReferenceColumn({
      label: "Group",
      referenceTable: "x_snc_split_app_2_group" as const,
      mandatory: true,
    }),
    from_user: ReferenceColumn({
      label: "From User",
      referenceTable: "sys_user" as const,
      mandatory: true,
    }),
    to_user: ReferenceColumn({
      label: "To User",
      referenceTable: "sys_user" as const,
      mandatory: true,
    }),
    amount: DecimalColumn({ label: "Amount", mandatory: true }),
    date: DateColumn({ label: "Date", mandatory: true }),
    payment_method: StringColumn({ label: "Payment Method", maxLength: 100 }),
    notes: StringColumn({ label: "Notes", maxLength: 500 }),
  },
});
