import { db } from "./db";
import {
  accounts,
  transactions,
  budgets,
  budgetCategories,
  installments,
  goals,
  investments,
  monthlyReports,
  type Account,
  type InsertAccount,
  type Transaction,
  type InsertTransaction,
  type Budget,
  type InsertBudget,
  type BudgetCategory,
  type InsertBudgetCategory,
  type Installment,
  type InsertInstallment,
  type Goal,
  type InsertGoal,
  type Investment,
  type InsertInvestment,
  type MonthlyReport,
  type InsertMonthlyReport,
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Transactions
  getTransactions(filters?: { startDate?: Date; endDate?: Date; accountId?: number; type?: string; category?: string }): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  createTransferTransaction(sourceAccountId: number, destinationAccountId: number, amount: number, description: string, date: Date): Promise<{ withdrawal: Transaction; deposit: Transaction }>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  getCurrentBudget(): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;

  // Budget Categories
  getBudgetCategories(): Promise<BudgetCategory[]>;
  getBudgetCategory(id: number): Promise<BudgetCategory | undefined>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: number, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: number): Promise<boolean>;
  getBudgetCategoryUsage(params: { month?: number; year?: number }): Promise<Array<{
    id: number;
    name: string;
    budgetedAmount: number;
    spentAmount: number;
    percentUsed: number;
    colorIndicator: 'green' | 'yellow' | 'red';
    isPredefined: string;
  }>>;

  // Installments
  getInstallments(): Promise<Installment[]>;
  getInstallment(id: number): Promise<Installment | undefined>;
  createInstallment(installment: InsertInstallment): Promise<Installment>;
  updateInstallment(id: number, installment: Partial<InsertInstallment>): Promise<Installment | undefined>;
  deleteInstallment(id: number): Promise<boolean>;

  // Goals
  getGoals(): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  makeGoalDeposit(goalId: number, amount: number, accountId: number): Promise<{ goal: Goal; transaction: Transaction }>;

  // Installment Payments
  makeInstallmentPayment(installmentId: number): Promise<{ installment: Installment; transaction: Transaction }>;
  
  // Budget Transfers
  createBudgetTransfer(sourceAccountId: number, destinationAccountId: number, amount: number, description: string): Promise<{ withdrawal: Transaction; deposit: Transaction }>;

  // Budget Month Management
  closeBudgetMonth(allocations: Array<{
    categoryId: number;
    unusedAmount: number;
    action: 'carryover' | 'investment' | 'goal' | 'account';
    destinationId?: number;
  }>): Promise<{ closedBudget: Budget; newBudget: Budget; monthlyReport: any }>;

  // Monthly Reports
  getMonthlyReports(): Promise<MonthlyReport[]>;
  getMonthlyReport(id: number): Promise<MonthlyReport | undefined>;

  // Investments
  getInvestments(): Promise<Investment[]>;
  getInvestment(id: number): Promise<Investment | undefined>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, investment: Partial<InsertInvestment>): Promise<Investment | undefined>;
  deleteInvestment(id: number): Promise<boolean>;
  makeInvestmentDeposit(investmentId: number, amount: number, accountId: number): Promise<{ investment: Investment; transaction: Transaction }>;
  liquidateInvestment(investmentId: number, action: 'transfer' | 'loss', destinationType?: 'account' | 'investment', destinationId?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Accounts
  async getAccounts(): Promise<Account[]> {
    return db.select().from(accounts).orderBy(desc(accounts.createdAt));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const result = await db.select().from(accounts).where(eq(accounts.id, id));
    return result[0];
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const result = await db.insert(accounts).values(account).returning();
    return result[0];
  }

  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const result = await db.update(accounts).set(account).where(eq(accounts.id, id)).returning();
    return result[0];
  }

  async deleteAccount(id: number): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, id)).returning();
    return result.length > 0;
  }

  // Transactions
  async getTransactions(filters?: { startDate?: Date; endDate?: Date; accountId?: number; type?: string; category?: string }): Promise<Transaction[]> {
    const conditions = [];
    if (filters?.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }
    if (filters?.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.category) {
      conditions.push(eq(transactions.category, filters.category));
    }

    if (conditions.length > 0) {
      return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.date));
    }

    return db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    
    // Update account balance if accountId is provided
    if (transaction.accountId) {
      const account = await this.getAccount(transaction.accountId);
      if (account) {
        const amount = parseFloat(transaction.amount);
        const currentBalance = parseFloat(account.balance);
        const newBalance = transaction.type === "income" 
          ? currentBalance + amount 
          : currentBalance - amount;
        await this.updateAccount(transaction.accountId, { balance: newBalance.toFixed(2) });
      }
    }
    
    return result[0];
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    // Get the old transaction first
    const oldTransaction = await this.getTransaction(id);
    if (!oldTransaction) {
      return undefined;
    }

    // Reverse the old balance change if accountId existed
    if (oldTransaction.accountId) {
      const account = await this.getAccount(oldTransaction.accountId);
      if (account) {
        const amount = parseFloat(oldTransaction.amount);
        const currentBalance = parseFloat(account.balance);
        // Reverse: subtract income, add back expense
        const reversedBalance = oldTransaction.type === "income" 
          ? currentBalance - amount 
          : currentBalance + amount;
        await this.updateAccount(oldTransaction.accountId, { balance: reversedBalance.toFixed(2) });
      }
    }

    // Update the transaction
    const result = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
    const updatedTransaction = result[0];

    // Apply the new balance change if accountId exists in the updated transaction
    const newAccountId = transaction.accountId !== undefined ? transaction.accountId : oldTransaction.accountId;
    const newAmount = transaction.amount !== undefined ? transaction.amount : oldTransaction.amount;
    const newType = transaction.type !== undefined ? transaction.type : oldTransaction.type;

    if (newAccountId) {
      const account = await this.getAccount(newAccountId);
      if (account) {
        const amount = parseFloat(newAmount);
        const currentBalance = parseFloat(account.balance);
        const newBalance = newType === "income" 
          ? currentBalance + amount 
          : currentBalance - amount;
        await this.updateAccount(newAccountId, { balance: newBalance.toFixed(2) });
      }
    }

    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const transaction = await this.getTransaction(id);
    if (transaction) {
      const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
      
      // Reverse account balance change if accountId exists
      if (transaction.accountId) {
        const account = await this.getAccount(transaction.accountId);
        if (account) {
          const amount = parseFloat(transaction.amount);
          const currentBalance = parseFloat(account.balance);
          const newBalance = transaction.type === "income" 
            ? currentBalance - amount 
            : currentBalance + amount;
          await this.updateAccount(transaction.accountId, { balance: newBalance.toFixed(2) });
        }
      }
      
      return result.length > 0;
    }
    return false;
  }

  async createTransferTransaction(
    sourceAccountId: number,
    destinationAccountId: number,
    amount: number,
    description: string,
    date: Date
  ): Promise<{ withdrawal: Transaction; deposit: Transaction }> {
    // Generate unique transfer group ID
    const transferGroupId = crypto.randomUUID();

    // Get accounts
    const sourceAccount = await this.getAccount(sourceAccountId);
    const destinationAccount = await this.getAccount(destinationAccountId);

    if (!sourceAccount || !destinationAccount) {
      throw new Error("Source or destination account not found");
    }

    // Create withdrawal transaction (from source account)
    const withdrawalData = {
      date,
      description: `${description} (Transfer to ${destinationAccount.name})`,
      amount: amount.toFixed(2),
      category: "Transfer",
      type: "expense",
      accountId: sourceAccountId,
      sourceAccountId,
      destinationAccountId,
      transferGroupId,
    };

    const withdrawalResult = await db.insert(transactions).values(withdrawalData).returning();
    const withdrawal = withdrawalResult[0];

    // Update source account balance (deduct)
    const sourceBalance = parseFloat(sourceAccount.balance);
    await this.updateAccount(sourceAccountId, {
      balance: (sourceBalance - amount).toFixed(2),
    });

    // Create deposit transaction (to destination account)
    const depositData = {
      date,
      description: `${description} (Transfer from ${sourceAccount.name})`,
      amount: amount.toFixed(2),
      category: "Transfer",
      type: "income",
      accountId: destinationAccountId,
      sourceAccountId,
      destinationAccountId,
      transferGroupId,
    };

    const depositResult = await db.insert(transactions).values(depositData).returning();
    const deposit = depositResult[0];

    // Update destination account balance (add)
    const destBalance = parseFloat(destinationAccount.balance);
    await this.updateAccount(destinationAccountId, {
      balance: (destBalance + amount).toFixed(2),
    });

    return { withdrawal, deposit };
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    return db.select().from(budgets).orderBy(desc(budgets.createdAt));
  }

  async getCurrentBudget(): Promise<Budget | undefined> {
    const result = await db.select().from(budgets).orderBy(desc(budgets.createdAt)).limit(1);
    return result[0];
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const result = await db.insert(budgets).values(budget).returning();
    return result[0];
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const result = await db.update(budgets).set({ ...budget, updatedAt: new Date() }).where(eq(budgets.id, id)).returning();
    return result[0];
  }

  // Installments
  async getInstallments(): Promise<Installment[]> {
    return db.select().from(installments).orderBy(desc(installments.createdAt));
  }

  async getInstallment(id: number): Promise<Installment | undefined> {
    const result = await db.select().from(installments).where(eq(installments.id, id));
    return result[0];
  }

  async createInstallment(installment: InsertInstallment): Promise<Installment> {
    // Auto-calculate nextPaymentDate if not provided (start date + 1 month)
    const installmentData = {
      ...installment,
      nextPaymentDate: installment.nextPaymentDate || (() => {
        const nextDate = new Date(installment.startDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        return nextDate;
      })()
    };
    const result = await db.insert(installments).values(installmentData).returning();
    return result[0];
  }

  async updateInstallment(id: number, installment: Partial<InsertInstallment>): Promise<Installment | undefined> {
    // If startDate is being updated but nextPaymentDate is not, auto-calculate it
    let updateData = { ...installment };
    if (installment.startDate && !installment.nextPaymentDate) {
      const nextDate = new Date(installment.startDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      updateData.nextPaymentDate = nextDate;
    }
    const result = await db.update(installments).set(updateData).where(eq(installments.id, id)).returning();
    return result[0];
  }

  async deleteInstallment(id: number): Promise<boolean> {
    const result = await db.delete(installments).where(eq(installments.id, id)).returning();
    return result.length > 0;
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    return db.select().from(goals).orderBy(desc(goals.createdAt));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const result = await db.select().from(goals).where(eq(goals.id, id));
    return result[0];
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values(goal).returning();
    return result[0];
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const result = await db.update(goals).set(goal).where(eq(goals.id, id)).returning();
    return result[0];
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db.delete(goals).where(eq(goals.id, id)).returning();
    return result.length > 0;
  }

  async makeGoalDeposit(goalId: number, amount: number, accountId: number): Promise<{ goal: Goal; transaction: Transaction }> {
    const goal = await this.getGoal(goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }

    // Create transaction for the deposit
    const transaction = await this.createTransaction({
      date: new Date(),
      description: `Deposit to ${goal.name}`,
      amount: amount.toFixed(2),
      category: "Goal Savings",
      type: "goal",
      accountId,
      goalId,
    });

    // Update goal current amount
    const currentAmount = parseFloat(goal.currentAmount);
    const newAmount = currentAmount + amount;
    const updatedGoal = await this.updateGoal(goalId, {
      currentAmount: newAmount.toFixed(2),
    });

    return { goal: updatedGoal!, transaction };
  }

  // Budget Categories
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    return db.select().from(budgetCategories).orderBy(budgetCategories.name);
  }

  async getBudgetCategory(id: number): Promise<BudgetCategory | undefined> {
    const result = await db.select().from(budgetCategories).where(eq(budgetCategories.id, id));
    return result[0];
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    const result = await db.insert(budgetCategories).values(category).returning();
    return result[0];
  }

  async updateBudgetCategory(id: number, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const result = await db.update(budgetCategories).set(category).where(eq(budgetCategories.id, id)).returning();
    return result[0];
  }

  async deleteBudgetCategory(id: number): Promise<boolean> {
    const result = await db.delete(budgetCategories).where(eq(budgetCategories.id, id)).returning();
    return result.length > 0;
  }

  async getBudgetCategoryUsage(params: { month?: number; year?: number }): Promise<Array<{
    id: number;
    name: string;
    budgetedAmount: number;
    spentAmount: number;
    percentUsed: number;
    colorIndicator: 'green' | 'yellow' | 'red';
  }>> {
    // Get month and year (default to current month if not provided)
    const now = new Date();
    const targetMonth = params.month !== undefined ? params.month : now.getMonth() + 1;
    const targetYear = params.year !== undefined ? params.year : now.getFullYear();

    // Calculate start and end of month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Get all budget categories
    const categories = await this.getBudgetCategories();

    // Get all transactions for the month (excluding transfers)
    const monthTransactions = await db.select()
      .from(transactions)
      .where(
        and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    // Calculate spending per category
    const categorySpending: Record<string, number> = {};
    monthTransactions.forEach(t => {
      // Only count expenses (not income, not transfers)
      if (t.type !== "income" && !t.transferGroupId) {
        const cat = t.category.toLowerCase();
        categorySpending[cat] = (categorySpending[cat] || 0) + parseFloat(t.amount);
      }
    });

    // Build usage data for each category
    return categories.map(cat => {
      const budgeted = parseFloat(cat.budgetedAmount);
      const spent = categorySpending[cat.name.toLowerCase()] || 0;
      const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;
      
      let colorIndicator: 'green' | 'yellow' | 'red' = 'green';
      if (percentUsed >= 100) {
        colorIndicator = 'red';
      } else if (percentUsed >= 80) {
        colorIndicator = 'yellow';
      }

      return {
        id: cat.id,
        name: cat.name,
        budgetedAmount: budgeted,
        spentAmount: spent,
        percentUsed: Math.round(percentUsed),
        colorIndicator,
        isPredefined: cat.isPredefined,
      };
    });
  }

  // Installment Payments
  async makeInstallmentPayment(installmentId: number): Promise<{ installment: Installment; transaction: Transaction }> {
    const installment = await this.getInstallment(installmentId);
    if (!installment) {
      throw new Error("Installment not found");
    }

    if (installment.monthsPaid >= installment.term) {
      throw new Error("Installment already fully paid");
    }

    // Create transaction for the payment
    const transaction = await this.createTransaction({
      date: new Date(),
      description: `Payment for ${installment.name} (${installment.monthsPaid + 1}/${installment.term})`,
      amount: installment.monthlyAmount,
      category: "Installment",
      type: "installment",
      accountId: installment.accountId,
      installmentId,
    });

    // Update installment progress
    const newMonthsPaid = installment.monthsPaid + 1;
    const nextPaymentDate = new Date(installment.nextPaymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const updatedInstallment = await this.updateInstallment(installmentId, {
      monthsPaid: newMonthsPaid,
      nextPaymentDate,
      status: newMonthsPaid >= installment.term ? "completed" : "active",
    });

    return { installment: updatedInstallment!, transaction };
  }

  // Investments
  async getInvestments(): Promise<Investment[]> {
    return db.select().from(investments).orderBy(desc(investments.createdAt));
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    const result = await db.select().from(investments).where(eq(investments.id, id));
    return result[0];
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const result = await db.insert(investments).values(investment).returning();
    return result[0];
  }

  async updateInvestment(id: number, investment: Partial<InsertInvestment>): Promise<Investment | undefined> {
    const result = await db.update(investments).set(investment).where(eq(investments.id, id)).returning();
    return result[0];
  }

  async deleteInvestment(id: number): Promise<boolean> {
    const result = await db.delete(investments).where(eq(investments.id, id)).returning();
    return result.length > 0;
  }

  async makeInvestmentDeposit(investmentId: number, amount: number, accountId: number): Promise<{ investment: Investment; transaction: Transaction }> {
    const investment = await this.getInvestment(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Check if account has sufficient balance
    const accountBalance = parseFloat(account.balance);
    if (accountBalance < amount) {
      throw new Error("Insufficient account balance");
    }

    // Create transaction for the deposit (this will automatically update account balance)
    const transaction = await this.createTransaction({
      date: new Date(),
      description: `Deposit to ${investment.name}`,
      amount: amount.toFixed(2),
      category: "Investment",
      type: "investment",
      accountId,
      investmentId,
    });

    // Update investment current value
    const currentValue = parseFloat(investment.currentValue);
    const newValue = currentValue + amount;
    const updatedInvestment = await this.updateInvestment(investmentId, {
      currentValue: newValue.toFixed(2),
    });

    return { investment: updatedInvestment!, transaction };
  }

  async createBudgetTransfer(
    sourceAccountId: number,
    destinationAccountId: number,
    amount: number,
    description: string
  ): Promise<{ withdrawal: Transaction; deposit: Transaction }> {
    // Validate that accounts are different
    if (sourceAccountId === destinationAccountId) {
      throw new Error("Source and destination accounts must be different");
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    // Validate that current budget exists
    const budget = await this.getCurrentBudget();
    if (!budget) {
      throw new Error("No active budget found. Please create a budget first.");
    }

    // Validate that source account exists and has sufficient balance
    const sourceAccount = await this.getAccount(sourceAccountId);
    if (!sourceAccount) {
      throw new Error("Source account not found");
    }

    const sourceBalance = parseFloat(sourceAccount.balance);
    if (sourceBalance < amount) {
      throw new Error(`Insufficient balance. Available: ₱${sourceBalance.toLocaleString("en-PH")}`);
    }

    // Create the transfer using the existing method
    return this.createTransferTransaction(
      sourceAccountId,
      destinationAccountId,
      amount,
      description,
      new Date()
    );
  }

  async closeBudgetMonth(allocations: Array<{
    categoryId: number;
    unusedAmount: number;
    action: 'carryover' | 'investment' | 'goal' | 'account';
    destinationId?: number;
  }>): Promise<{ closedBudget: Budget; newBudget: Budget; monthlyReport: MonthlyReport }> {
    // Wrap entire operation in a transaction for data integrity
    return await db.transaction(async (tx) => {
      // Get current budget
      const currentBudget = await tx.select().from(budgets).where(eq(budgets.status, "active")).orderBy(desc(budgets.createdAt)).limit(1).then(rows => rows[0]);
      if (!currentBudget) {
        throw new Error("No active budget found");
      }

      const currentMonth = currentBudget.month || new Date().getMonth() + 1;
      const currentYear = currentBudget.year || new Date().getFullYear();

      // Calculate date range for current month
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      // Get all transactions for the month
      const monthTransactions = await tx.select().from(transactions)
        .where(and(
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        ));

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      let installmentsPaid = 0;
      let goalsContributed = 0;
      let investmentsAdded = 0;

      const categorySpending: Record<string, number> = {};

      monthTransactions.forEach(t => {
        const amount = parseFloat(t.amount);
        
        if (t.type === "income") {
          totalIncome += Math.abs(amount);
        } else if (t.type === "installment") {
          installmentsPaid += Math.abs(amount);
          totalExpenses += Math.abs(amount);
        } else if (t.type === "goal") {
          goalsContributed += Math.abs(amount);
          totalExpenses += Math.abs(amount);
        } else if (t.type === "investment") {
          if (amount > 0) {
            investmentsAdded += amount;
            totalExpenses += amount;
          }
        } else if (!t.transferGroupId) {
          // Regular expenses (not transfers)
          totalExpenses += Math.abs(amount);
          const cat = t.category.toLowerCase();
          categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(amount);
        }
      });

      // Get budget categories and calculate unused amounts
      const categories = await tx.select().from(budgetCategories);
      const categoryBreakdown: Record<string, any> = {};
      let totalBudgeted = 0;

      // Build a map of allocations by category ID for easy lookup
      const allocationMap: Record<number, typeof allocations[0]> = {};
      allocations.forEach(a => {
        allocationMap[a.categoryId] = a;
      });

      categories.forEach(cat => {
        const budgeted = parseFloat(cat.budgetedAmount);
        const spent = categorySpending[cat.name.toLowerCase()] || 0;
        const unused = budgeted - spent;
        
        categoryBreakdown[cat.name] = {
          budgeted,
          spent,
          unused: Math.max(0, unused),
        };
        
        totalBudgeted += budgeted;

        // Default to carryover if no allocation specified and there's unused budget
        if (unused > 0 && !allocationMap[cat.id]) {
          allocationMap[cat.id] = {
            categoryId: cat.id,
            unusedAmount: unused,
            action: 'carryover',
          };
        }
      });

      const unusedBudget = totalBudgeted - totalExpenses;
      const budgetUtilization = totalBudgeted > 0 ? (totalExpenses / totalBudgeted) * 100 : 0;

      // Process allocations for unused budgets
      for (const allocation of Object.values(allocationMap)) {
        if (allocation.unusedAmount <= 0) continue;

        const category = categories.find(c => c.id === allocation.categoryId);
        if (!category) continue;

        if (allocation.action === 'carryover') {
          // Will be carried over to next month's budget - update the category amount
          const newAmount = parseFloat(category.budgetedAmount) + allocation.unusedAmount;
          await tx.update(budgetCategories)
            .set({ budgetedAmount: newAmount.toFixed(2) })
            .where(eq(budgetCategories.id, allocation.categoryId));
        } else if (allocation.action === 'account') {
          if (!allocation.destinationId) {
            throw new Error(`Destination account required for ${category.name} allocation`);
          }
          // Verify account exists
          const account = await tx.select().from(accounts).where(eq(accounts.id, allocation.destinationId)).then(rows => rows[0]);
          if (!account) {
            throw new Error(`Account not found: ${allocation.destinationId}`);
          }
          // Transfer to account - create income transaction
          await tx.insert(transactions).values({
            date: new Date(),
            description: `Unused ${category.name} budget carried to savings`,
            amount: (-allocation.unusedAmount).toFixed(2), // Negative = income
            category: "Savings",
            type: "income",
            accountId: allocation.destinationId,
          });
          // Update account balance
          const newBalance = parseFloat(account.balance) + allocation.unusedAmount;
          await tx.update(accounts)
            .set({ balance: newBalance.toFixed(2) })
            .where(eq(accounts.id, allocation.destinationId));
        } else if (allocation.action === 'goal') {
          if (!allocation.destinationId) {
            throw new Error(`Destination goal required for ${category.name} allocation`);
          }
          // Verify goal exists and has account
          const goal = await tx.select().from(goals).where(eq(goals.id, allocation.destinationId)).then(rows => rows[0]);
          if (!goal || !goal.accountId) {
            throw new Error(`Goal not found or has no account: ${allocation.destinationId}`);
          }
          // Create transaction and update goal
          await tx.insert(transactions).values({
            date: new Date(),
            description: `Deposit from unused ${category.name} budget to ${goal.name}`,
            amount: allocation.unusedAmount.toFixed(2),
            category: "Goal",
            type: "goal",
            accountId: goal.accountId,
            goalId: goal.id,
          });
          const newCurrent = parseFloat(goal.currentAmount) + allocation.unusedAmount;
          await tx.update(goals)
            .set({ currentAmount: newCurrent.toFixed(2), updatedAt: new Date() })
            .where(eq(goals.id, goal.id));
        } else if (allocation.action === 'investment') {
          if (!allocation.destinationId) {
            throw new Error(`Destination investment required for ${category.name} allocation`);
          }
          // Verify investment exists and has account
          const investment = await tx.select().from(investments).where(eq(investments.id, allocation.destinationId)).then(rows => rows[0]);
          if (!investment || !investment.accountId) {
            throw new Error(`Investment not found or has no account: ${allocation.destinationId}`);
          }
          // Create transaction and update investment
          await tx.insert(transactions).values({
            date: new Date(),
            description: `Deposit from unused ${category.name} budget to ${investment.name}`,
            amount: allocation.unusedAmount.toFixed(2),
            category: "Investment",
            type: "investment",
            accountId: investment.accountId,
            investmentId: investment.id,
          });
          const newValue = parseFloat(investment.currentValue) + allocation.unusedAmount;
          await tx.update(investments)
            .set({ currentValue: newValue.toFixed(2), updatedAt: new Date() })
            .where(eq(investments.id, investment.id));
        }
      }

      // Create monthly report
      const monthlyReport = await tx.insert(monthlyReports).values({
        month: currentMonth,
        year: currentYear,
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        budgetedAmount: totalBudgeted.toFixed(2),
        unusedBudget: Math.max(0, unusedBudget).toFixed(2),
        savingsAmount: parseFloat(currentBudget.savingsRate || "0").toFixed(2),
        budgetUtilization: budgetUtilization.toFixed(2),
        categoryBreakdown: JSON.stringify(categoryBreakdown),
        goalsContributed: goalsContributed.toFixed(2),
        investmentsAdded: investmentsAdded.toFixed(2),
        installmentsPaid: installmentsPaid.toFixed(2),
      }).returning();

      // Close current budget
      const closedBudget = await tx.update(budgets)
        .set({ status: "closed", updatedAt: new Date() })
        .where(eq(budgets.id, currentBudget.id))
        .returning()
        .then(rows => rows[0]);

      // Create new budget for next month
      const nextDate = new Date(currentYear, currentMonth, 1); // First day of next month
      const nextMonth = nextDate.getMonth() + 1;
      const nextYear = nextDate.getFullYear();

      const newBudget = await tx.insert(budgets).values({
        monthlySalary: currentBudget.monthlySalary,
        savingsRate: currentBudget.savingsRate,
        status: "active",
        month: nextMonth,
        year: nextYear,
      }).returning().then(rows => rows[0]);

      return { closedBudget, newBudget, monthlyReport: monthlyReport[0] };
    });
  }

  // Monthly Reports
  async getMonthlyReports(): Promise<MonthlyReport[]> {
    return db.select().from(monthlyReports).orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
  }

  async getMonthlyReport(id: number): Promise<MonthlyReport | undefined> {
    const result = await db.select().from(monthlyReports).where(eq(monthlyReports.id, id));
    return result[0];
  }

  async liquidateInvestment(investmentId: number, action: 'transfer' | 'loss', destinationType?: 'account' | 'investment', destinationId?: number): Promise<void> {
    const investment = await this.getInvestment(investmentId);
    if (!investment) {
      throw new Error("Investment not found");
    }

    const currentValue = parseFloat(investment.currentValue);

    if (action === 'transfer') {
      if (!destinationType || !destinationId) {
        throw new Error("Destination type and ID required for transfer");
      }

      if (destinationType === 'account') {
        // Transfer to account
        const account = await this.getAccount(destinationId);
        if (!account) {
          throw new Error("Account not found");
        }

        // Create positive transaction to return money to account
        await this.createTransaction({
          date: new Date(),
          description: `Liquidation of ${investment.name}`,
          amount: (-currentValue).toFixed(2), // Negative amount = money coming in
          category: "Investment",
          type: "investment",
          accountId: destinationId,
          investmentId,
        });

      } else if (destinationType === 'investment') {
        // Transfer to another investment
        const targetInvestment = await this.getInvestment(destinationId);
        if (!targetInvestment) {
          throw new Error("Target investment not found");
        }

        // Update target investment value
        const targetValue = parseFloat(targetInvestment.currentValue);
        const newValue = targetValue + currentValue;
        await this.updateInvestment(destinationId, {
          currentValue: newValue.toFixed(2),
        });

        // Create transaction record for the transfer
        await this.createTransaction({
          date: new Date(),
          description: `Transfer from ${investment.name} to ${targetInvestment.name}`,
          amount: "0.00", // Transfer between investments doesn't affect account balance
          category: "Investment",
          type: "investment",
          investmentId: destinationId,
        });
      }

    } else if (action === 'loss') {
      // Mark as loss - create a loss transaction record
      await this.createTransaction({
        date: new Date(),
        description: `Loss from ${investment.name}`,
        amount: currentValue.toFixed(2),
        category: "Investment Loss",
        type: "expense",
        investmentId,
      });
    }

    // Delete the investment
    await this.deleteInvestment(investmentId);
  }
}


export const storage = new DatabaseStorage();
