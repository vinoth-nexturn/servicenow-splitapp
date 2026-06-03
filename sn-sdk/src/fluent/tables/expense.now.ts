import { Table, StringColumn, DecimalColumn, DateColumn, ChoiceColumn, ReferenceColumn } from "@servicenow/sdk/core";

export const x_snc_split_app_2_expense = Table({
  $id: Now.ID["split-table-expense"],
  name: "x_snc_split_app_2_expense",
  label: "Expense",
  schema: {
    group: ReferenceColumn({
      label: "Group",
      referenceTable: "x_snc_split_app_2_group" as const,
      mandatory: true,
    }),
    description: StringColumn({
      label: "Description",
      maxLength: 255,
      mandatory: true,
    }),
    amount: DecimalColumn({ label: "Amount", mandatory: true }),
    date: DateColumn({ label: "Date", mandatory: true }),
    category: ChoiceColumn({
      label: "Category",
      choices: {
        "food_drink": "Food & Drink",
        "travel": "Travel",
        "utilities": "Utilities",
        "entertainment": "Entertainment",
        "other": "Other",
      },
      default: "other",
      mandatory: true,
    }),
    payer: ReferenceColumn({
      label: "Payer",
      referenceTable: "sys_user" as const,
      mandatory: true,
    }),
    split_type: ChoiceColumn({
      label: "Split Type",
      choices: {
        equal: "Equal",
        exact: "Exact",
        percentage: "Percentage",
        shares: "Shares",
      },
      mandatory: true,
    }),
    notes: StringColumn({ label: "Notes", maxLength: 500 }),
    receipt_image: StringColumn({
      label: "Receipt Image",
      maxLength: 500,
      nullable: true,
    }),
  },
});
