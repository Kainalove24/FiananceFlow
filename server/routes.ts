import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertAccountSchema,
  insertTransactionSchema,
  insertBudgetSchema,
  insertBudgetCategorySchema,
  insertInstallmentSchema,
  insertGoalSchema,
  insertInvestmentSchema,
} from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Accounts routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const data = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(data);
      res.status(201).json(account);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, data);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      if (!success) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transactions routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.accountId) filters.accountId = parseInt(req.query.accountId as string);
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.category) filters.category = req.query.category as string;

      const transactions = await storage.getTransactions(filters);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(data);
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, data);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transfer transaction route
  app.post("/api/transfers", async (req, res) => {
    try {
      const schema = z.object({
        sourceAccountId: z.number(),
        destinationAccountId: z.number(),
        amount: z.number(),
        description: z.string(),
        date: z.string().transform(str => new Date(str)),
      });
      
      const data = schema.parse(req.body);
      const result = await storage.createTransferTransaction(
        data.sourceAccountId,
        data.destinationAccountId,
        data.amount,
        data.description,
        data.date
      );
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Budget transfer route with validation
  app.post("/api/budget-transfers", async (req, res) => {
    try {
      const schema = z.object({
        sourceAccountId: z.number().positive(),
        destinationAccountId: z.number().positive(),
        amount: z.number().positive(),
        description: z.string().min(1),
      });
      
      const data = schema.parse(req.body);
      const result = await storage.createBudgetTransfer(
        data.sourceAccountId,
        data.destinationAccountId,
        data.amount,
        data.description
      );
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Budgets routes
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgets();
      res.json(budgets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/budgets/current", async (req, res) => {
    try {
      const budget = await storage.getCurrentBudget();
      res.json(budget || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const data = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(data);
      res.status(201).json(budget);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertBudgetSchema.partial().parse(req.body);
      const budget = await storage.updateBudget(id, data);
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      res.json(budget);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/budgets/close-month", async (req, res) => {
    try {
      const allocations = req.body.allocations || [];
      const result = await storage.closeBudgetMonth(allocations);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Monthly Reports routes
  app.get("/api/monthly-reports", async (req, res) => {
    try {
      const reports = await storage.getMonthlyReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/monthly-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getMonthlyReport(id);
      if (!report) {
        return res.status(404).json({ error: "Monthly report not found" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Installments routes
  app.get("/api/installments", async (req, res) => {
    try {
      const installments = await storage.getInstallments();
      res.json(installments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/installments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const installment = await storage.getInstallment(id);
      if (!installment) {
        return res.status(404).json({ error: "Installment not found" });
      }
      res.json(installment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/installments", async (req, res) => {
    try {
      const data = insertInstallmentSchema.parse(req.body);
      const installment = await storage.createInstallment(data);
      res.status(201).json(installment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/installments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInstallmentSchema.partial().parse(req.body);
      const installment = await storage.updateInstallment(id, data);
      if (!installment) {
        return res.status(404).json({ error: "Installment not found" });
      }
      res.json(installment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/installments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInstallment(id);
      if (!success) {
        return res.status(404).json({ error: "Installment not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Goals routes
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const goal = await storage.getGoal(id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const data = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(data);
      res.status(201).json(goal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertGoalSchema.partial().parse(req.body);
      const goal = await storage.updateGoal(id, data);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGoal(id);
      if (!success) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Budget Categories routes
  app.get("/api/budget-categories", async (req, res) => {
    try {
      const categories = await storage.getBudgetCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/budget-categories/usage", async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const usage = await storage.getBudgetCategoryUsage({ month, year });
      res.json(usage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/budget-categories", async (req, res) => {
    try {
      const data = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(data);
      res.status(201).json(category);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/budget-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertBudgetCategorySchema.partial().parse(req.body);
      const category = await storage.updateBudgetCategory(id, data);
      if (!category) {
        return res.status(404).json({ error: "Budget category not found" });
      }
      res.json(category);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/budget-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBudgetCategory(id);
      if (!success) {
        return res.status(404).json({ error: "Budget category not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Goal deposit endpoint
  app.post("/api/goals/:id/deposit", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const { amount, accountId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
      }
      if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
      }

      const result = await storage.makeGoalDeposit(goalId, parseFloat(amount), accountId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Installment payment endpoint
  app.post("/api/installments/:id/payment", async (req, res) => {
    try {
      const installmentId = parseInt(req.params.id);
      const result = await storage.makeInstallmentPayment(installmentId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Investments
  app.get("/api/investments", async (req, res) => {
    try {
      const investments = await storage.getInvestments();
      res.json(investments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/investments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const investment = await storage.getInvestment(id);
      if (!investment) {
        return res.status(404).json({ error: "Investment not found" });
      }
      res.json(investment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/investments", async (req, res) => {
    try {
      const data = insertInvestmentSchema.parse(req.body);
      const investment = await storage.createInvestment(data);
      res.status(201).json(investment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/investments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInvestmentSchema.partial().parse(req.body);
      const investment = await storage.updateInvestment(id, data);
      if (!investment) {
        return res.status(404).json({ error: "Investment not found" });
      }
      res.json(investment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/investments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInvestment(id);
      if (!success) {
        return res.status(404).json({ error: "Investment not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Investment deposit endpoint
  app.post("/api/investments/:id/deposit", async (req, res) => {
    try {
      const investmentId = parseInt(req.params.id);
      const { amount, accountId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid deposit amount" });
      }
      if (!accountId) {
        return res.status(400).json({ error: "Account ID is required" });
      }

      const result = await storage.makeInvestmentDeposit(investmentId, parseFloat(amount), accountId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Investment liquidation endpoint
  app.post("/api/investments/:id/liquidate", async (req, res) => {
    try {
      const investmentId = parseInt(req.params.id);
      const { action, destinationType, destinationId } = req.body;
      
      if (!action || !['transfer', 'loss'].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'transfer' or 'loss'" });
      }

      if (action === 'transfer' && (!destinationType || !destinationId)) {
        return res.status(400).json({ error: "Destination type and ID required for transfer" });
      }

      if (action === 'transfer' && !['account', 'investment'].includes(destinationType)) {
        return res.status(400).json({ error: "Destination type must be 'account' or 'investment'" });
      }

      await storage.liquidateInvestment(investmentId, action, destinationType, destinationId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      const transactions = await storage.getTransactions();
      const installments = await storage.getInstallments();

      const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const monthlyTransactions = transactions.filter(t => new Date(t.date) >= currentMonth);
      
      const totalIncome = monthlyTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalExpenses = monthlyTransactions
        .filter(t => t.type !== "income" && !t.transferGroupId)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Calculate previous month's income and expenses for trend comparison
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      previousMonth.setDate(1);
      previousMonth.setHours(0, 0, 0, 0);
      
      const previousMonthEnd = new Date(currentMonth);
      
      const previousMonthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= previousMonth && tDate < previousMonthEnd;
      });
      
      const previousIncome = previousMonthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const previousExpenses = previousMonthTransactions
        .filter(t => t.type !== "income" && !t.transferGroupId)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Calculate percentage changes
      const incomeTrend = previousIncome > 0 
        ? ((totalIncome - previousIncome) / previousIncome) * 100 
        : totalIncome > 0 ? 100 : 0;
      
      const expensesTrend = previousExpenses > 0 
        ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
        : totalExpenses > 0 ? 100 : 0;

      const budget = await storage.getCurrentBudget();
      const budgetAmount = budget ? parseFloat(budget.monthlySalary) : 0;
      const remainingBudget = budgetAmount - totalExpenses;

      // Category spending (current month, excluding transfers)
      const categorySpending: Record<string, number> = {};
      monthlyTransactions
        .filter(t => t.type !== "income" && !t.transferGroupId)
        .forEach(t => {
          const cat = t.category || "Others";
          categorySpending[cat] = (categorySpending[cat] || 0) + parseFloat(t.amount);
        });
      
      const categoryData = Object.entries(categorySpending).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: parseFloat(value.toFixed(2))
      }));

      // Monthly income/expenses for last 6 months
      const monthlyData = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        monthDate.setDate(1);
        monthDate.setHours(0, 0, 0, 0);
        
        const nextMonth = new Date(monthDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= monthDate && tDate < nextMonth;
        });
        
        const income = monthTransactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const expenses = monthTransactions
          .filter(t => t.type !== "income" && !t.transferGroupId)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        monthlyData.push({
          month: monthNames[monthDate.getMonth()],
          income: parseFloat(income.toFixed(2)),
          expenses: parseFloat(expenses.toFixed(2))
        });
      }

      res.json({
        totalBalance,
        totalIncome,
        totalExpenses,
        remainingBudget,
        incomeTrend,
        expensesTrend,
        categoryData,
        monthlyData,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import data endpoint
  app.post("/api/import", async (req, res) => {
    try {
      const data = req.body;
      const importedCounts = {
        accounts: 0,
        transactions: 0,
        budgets: 0,
        installments: 0,
        goals: 0,
        investments: 0,
      };
      const errors: string[] = [];

      // ID mapping to track old IDs -> new IDs for foreign key updates
      const accountIdMap = new Map<number, number>();
      const goalIdMap = new Map<number, number>();
      const installmentIdMap = new Map<number, number>();
      const investmentIdMap = new Map<number, number>();

      // Import accounts (strip IDs and map old -> new)
      if (data.accounts && Array.isArray(data.accounts)) {
        for (const account of data.accounts) {
          try {
            const oldId = account.id;
            const { id, createdAt, ...accountData } = account; // Strip generated fields
            const validated = insertAccountSchema.parse(accountData);
            const newAccount = await storage.createAccount(validated);
            accountIdMap.set(oldId, newAccount.id);
            importedCounts.accounts++;
          } catch (error: any) {
            errors.push(`Account: ${error.message}`);
          }
        }
      }

      // Import budgets (strip IDs and remap accountId)
      if (data.budgets && Array.isArray(data.budgets)) {
        for (const budget of data.budgets) {
          try {
            const { id, createdAt, updatedAt, accountId, ...budgetData } = budget;
            const remappedAccountId = accountId && accountIdMap.has(accountId) 
              ? accountIdMap.get(accountId) 
              : accountId;
            const validated = insertBudgetSchema.parse({ ...budgetData, accountId: remappedAccountId });
            await storage.createBudget(validated);
            importedCounts.budgets++;
          } catch (error: any) {
            errors.push(`Budget: ${error.message}`);
          }
        }
      }

      // Import goals (strip IDs and remap accountId)
      if (data.goals && Array.isArray(data.goals)) {
        for (const goal of data.goals) {
          try {
            const oldId = goal.id;
            const { id, createdAt, accountId, ...goalData } = goal;
            const remappedAccountId = accountId && accountIdMap.has(accountId) 
              ? accountIdMap.get(accountId) 
              : accountId;
            const validated = insertGoalSchema.parse({ ...goalData, accountId: remappedAccountId });
            const newGoal = await storage.createGoal(validated);
            goalIdMap.set(oldId, newGoal.id);
            importedCounts.goals++;
          } catch (error: any) {
            errors.push(`Goal: ${error.message}`);
          }
        }
      }

      // Import installments (strip IDs and remap accountId)
      if (data.installments && Array.isArray(data.installments)) {
        for (const installment of data.installments) {
          try {
            const oldId = installment.id;
            const { id, createdAt, accountId, ...installmentData } = installment;
            const remappedAccountId = accountId && accountIdMap.has(accountId) 
              ? accountIdMap.get(accountId) 
              : accountId;
            const validated = insertInstallmentSchema.parse({ ...installmentData, accountId: remappedAccountId });
            const newInstallment = await storage.createInstallment(validated);
            installmentIdMap.set(oldId, newInstallment.id);
            importedCounts.installments++;
          } catch (error: any) {
            errors.push(`Installment: ${error.message}`);
          }
        }
      }

      // Import investments (strip IDs and remap accountId)
      if (data.investments && Array.isArray(data.investments)) {
        for (const investment of data.investments) {
          try {
            const oldId = investment.id;
            const { id, createdAt, accountId, ...investmentData } = investment;
            const remappedAccountId = accountId && accountIdMap.has(accountId) 
              ? accountIdMap.get(accountId) 
              : accountId;
            const validated = insertInvestmentSchema.parse({ ...investmentData, accountId: remappedAccountId });
            const newInvestment = await storage.createInvestment(validated);
            investmentIdMap.set(oldId, newInvestment.id);
            importedCounts.investments++;
          } catch (error: any) {
            errors.push(`Investment: ${error.message}`);
          }
        }
      }

      // Import transactions (last, remap all foreign keys)
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const transaction of data.transactions) {
          try {
            const { id, createdAt, accountId, goalId, installmentId, investmentId, sourceAccountId, destinationAccountId, ...txnData } = transaction;
            
            // Remap foreign keys
            const remappedAccountId = accountId && accountIdMap.has(accountId) ? accountIdMap.get(accountId) : accountId;
            const remappedGoalId = goalId && goalIdMap.has(goalId) ? goalIdMap.get(goalId) : goalId;
            const remappedInstallmentId = installmentId && installmentIdMap.has(installmentId) ? installmentIdMap.get(installmentId) : installmentId;
            const remappedInvestmentId = investmentId && investmentIdMap.has(investmentId) ? investmentIdMap.get(investmentId) : investmentId;
            const remappedSourceAccountId = sourceAccountId && accountIdMap.has(sourceAccountId) ? accountIdMap.get(sourceAccountId) : sourceAccountId;
            const remappedDestinationAccountId = destinationAccountId && accountIdMap.has(destinationAccountId) ? accountIdMap.get(destinationAccountId) : destinationAccountId;
            
            const validated = insertTransactionSchema.parse({ 
              ...txnData, 
              accountId: remappedAccountId,
              goalId: remappedGoalId,
              installmentId: remappedInstallmentId,
              investmentId: remappedInvestmentId,
              sourceAccountId: remappedSourceAccountId,
              destinationAccountId: remappedDestinationAccountId,
            });
            await storage.createTransaction(validated);
            importedCounts.transactions++;
          } catch (error: any) {
            errors.push(`Transaction: ${error.message}`);
          }
        }
      }

      // Check if import was successful
      const totalImported = Object.values(importedCounts).reduce((sum, count) => sum + count, 0);
      if (totalImported === 0 && errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Import failed - no records were imported",
          imported: importedCounts,
          errors: errors.slice(0, 10),
        });
      }

      res.json({
        success: true,
        message: "Import completed",
        imported: importedCounts,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
