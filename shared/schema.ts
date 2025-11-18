import { pgTable, text, integer, decimal, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "set null" }),
  installmentId: integer("installment_id").references(() => installments.id, { onDelete: "set null" }),
  investmentId: integer("investment_id").references(() => investments.id, { onDelete: "set null" }),
  // Transfer-specific fields
  sourceAccountId: integer("source_account_id").references(() => accounts.id, { onDelete: "cascade" }),
  destinationAccountId: integer("destination_account_id").references(() => accounts.id, { onDelete: "cascade" }),
  transferGroupId: text("transfer_group_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  budgetedAmount: decimal("budgeted_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  isPredefined: text("is_predefined").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }).notNull(),
  savingsRate: decimal("savings_rate", { precision: 5, scale: 2 }).notNull().default("20"),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalIncome: decimal("total_income", { precision: 12, scale: 2 }).notNull().default("0"),
  totalExpenses: decimal("total_expenses", { precision: 12, scale: 2 }).notNull().default("0"),
  budgetedAmount: decimal("budgeted_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  unusedBudget: decimal("unused_budget", { precision: 12, scale: 2 }).notNull().default("0"),
  savingsAmount: decimal("savings_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  budgetUtilization: decimal("budget_utilization", { precision: 5, scale: 2 }).notNull().default("0"),
  categoryBreakdown: text("category_breakdown").notNull().default("{}"),
  goalsContributed: decimal("goals_contributed", { precision: 12, scale: 2 }).notNull().default("0"),
  investmentsAdded: decimal("investments_added", { precision: 12, scale: 2 }).notNull().default("0"),
  installmentsPaid: decimal("installments_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  term: integer("term").notNull(),
  monthsPaid: integer("months_paid").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  nextPaymentDate: timestamp("next_payment_date").notNull(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  deadline: timestamp("deadline").notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  initialAmount: decimal("initial_amount", { precision: 12, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }).notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  startDate: timestamp("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas with coercion for decimal fields
export const insertAccountSchema = createInsertSchema(accounts, {
  balance: z.coerce.string(),
  creditLimit: z.coerce.string().optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.coerce.string(),
  date: z.union([z.date(), z.string()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  sourceAccountId: z.number().optional(),
  destinationAccountId: z.number().optional(),
  transferGroupId: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories, {
  budgetedAmount: z.coerce.string(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets, {
  monthlySalary: z.coerce.string(),
  savingsRate: z.coerce.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  accountId: z.number().optional().nullable(), // Add this line
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyReportSchema = createInsertSchema(monthlyReports, {
  totalIncome: z.coerce.string(),
  totalExpenses: z.coerce.string(),
  budgetedAmount: z.coerce.string(),
  unusedBudget: z.coerce.string(),
  savingsAmount: z.coerce.string(),
  budgetUtilization: z.coerce.string(),
  goalsContributed: z.coerce.string(),
  investmentsAdded: z.coerce.string(),
  installmentsPaid: z.coerce.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
}).omit({
  id: true,
  createdAt: true,
});

export const insertInstallmentSchema = createInsertSchema(installments, {
  monthlyAmount: z.coerce.string(),
  startDate: z.coerce.date(),
  nextPaymentDate: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals, {
  targetAmount: z.coerce.string(),
  currentAmount: z.coerce.string(),
  deadline: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments, {
  initialAmount: z.coerce.string(),
  currentValue: z.coerce.string(),
  startDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
});

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
