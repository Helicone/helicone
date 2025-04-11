import Stripe from "stripe";
import {
  getProductIdsFromInvoice,
  getProductIdsFromUpcomingInvoice,
  calculateInvoiceAmounts,
} from "./calculatorUtil";

export interface RawStripeData {
  invoices: Stripe.Invoice[];
  upcomingInvoices: Stripe.UpcomingInvoice[];
  discounts: Record<string, Stripe.Discount>;
}

export interface InvoiceData {
  id: string;
  subscriptionId?: string;
  amount: number;
  amountAfterDiscount: number;
  customerEmail: string;
  status: string;
  created: Date;
  rawJSON: Stripe.Invoice | Stripe.UpcomingInvoice;
}

interface ProductRevenueData {
  current: number;
  projected: number;
  billedInvoices: InvoiceData[];
  upcomingInvoices: InvoiceData[];
}

// New interface for revenue data grouped by month
export interface MonthlyRevenueData {
  [monthKey: string]: ProductRevenueData;
}

export class RevenueCalculator {
  // Raw data
  private invoices: Stripe.Invoice[];
  private upcomingInvoices: Stripe.UpcomingInvoice[];
  private discounts: Record<string, Stripe.Discount>;

  // Just one index
  private productToInvoices: Map<string, Stripe.Invoice[]> = new Map();
  private productToUpcomingInvoices: Map<string, Stripe.UpcomingInvoice[]> =
    new Map();

  constructor(data: RawStripeData) {
    // Store raw data
    this.invoices = data.invoices || [];
    this.upcomingInvoices = data.upcomingInvoices || [];
    this.discounts = data.discounts || {};

    // Build the product index
    this.buildProductIndex();
  }

  private buildProductIndex(): void {
    // Index current invoices by product
    this.invoices.forEach((invoice) => {
      const productIds = getProductIdsFromInvoice(invoice);

      productIds.forEach((productId: string) => {
        if (!this.productToInvoices.has(productId)) {
          this.productToInvoices.set(productId, []);
        }
        this.productToInvoices.get(productId)!.push(invoice);
      });
    });

    // Index upcoming invoices by product
    this.upcomingInvoices.forEach((invoice) => {
      const productIds = getProductIdsFromUpcomingInvoice(invoice);

      productIds.forEach((productId: string) => {
        if (!this.productToUpcomingInvoices.has(productId)) {
          this.productToUpcomingInvoices.set(productId, []);
        }
        this.productToUpcomingInvoices.get(productId)!.push(invoice);
      });
    });
  }

  // Get monthly revenue data for a product
  public getProductRevenue(
    productId: string | string[],
    months = 6
  ): MonthlyRevenueData {
    // Get all invoices for this product/products
    let invoices: Stripe.Invoice[] = [];
    let allUpcomingInvoices: Stripe.UpcomingInvoice[] = [];

    if (Array.isArray(productId)) {
      // Handle multiple product IDs
      const uniqueInvoices = new Map<string, Stripe.Invoice>();
      const uniqueUpcomingInvoices = new Map<string, Stripe.UpcomingInvoice>();

      // Collect invoices from all product IDs, avoiding duplicates
      productId.forEach((id) => {
        const productInvoices = this.productToInvoices.get(id) || [];
        const productUpcomingInvoices =
          this.productToUpcomingInvoices.get(id) || [];

        productInvoices.forEach((invoice) => {
          uniqueInvoices.set(invoice.id, invoice);
        });

        productUpcomingInvoices.forEach((invoice) => {
          // For upcoming invoices, use subscription ID as the key since they might not have unique IDs
          const key =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : (invoice.subscription as any)?.id || crypto.randomUUID();
          uniqueUpcomingInvoices.set(key, invoice);
        });
      });

      invoices = Array.from(uniqueInvoices.values());
      allUpcomingInvoices = Array.from(uniqueUpcomingInvoices.values());
    } else {
      // Original code for single product ID
      invoices = this.productToInvoices.get(productId) || [];
      allUpcomingInvoices = this.productToUpcomingInvoices.get(productId) || [];
    }

    const filteredInvoices = this.filterByMonths(invoices, months);
    const upcomingInvoices =
      this.filterUpcomingInvoicesForCurrentMonth(allUpcomingInvoices);

    // Format all invoices
    const billedInvoices = this.formatInvoices(filteredInvoices, productId);
    const upcomingFormattedInvoices = this.formatInvoices(
      upcomingInvoices,
      productId
    );

    // Group billed invoices by month
    const invoicesByMonth = this.groupInvoicesByMonth(billedInvoices);

    // Create monthly revenue data
    const monthlyData: MonthlyRevenueData = {};

    // Process each month
    for (const [monthKey, monthInvoices] of Object.entries(invoicesByMonth)) {
      const isCurrentMonth = this.isCurrentMonth(monthKey);
      const relevantUpcomingInvoices = isCurrentMonth
        ? upcomingFormattedInvoices
        : [];

      // Calculate monthly totals
      const current = monthInvoices.reduce(
        (sum, inv) => sum + inv.amountAfterDiscount,
        0
      );
      const projected = relevantUpcomingInvoices.reduce(
        (sum, inv) => sum + inv.amountAfterDiscount,
        0
      );

      // Store data for this month
      monthlyData[monthKey] = {
        current,
        projected,
        billedInvoices: monthInvoices,
        upcomingInvoices: relevantUpcomingInvoices,
      };
    }

    return monthlyData;
  }

  // Group invoices by month in YYYY-MM format
  private groupInvoicesByMonth(
    invoices: InvoiceData[]
  ): Record<string, InvoiceData[]> {
    const byMonth: Record<string, InvoiceData[]> = {};

    invoices.forEach((invoice) => {
      const date = invoice.created;
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }

      byMonth[monthKey].push(invoice);
    });

    return byMonth;
  }

  // Check if a month key represents the current month
  private isCurrentMonth(monthKey: string): boolean {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    return monthKey === currentMonthKey;
  }

  // Filter upcoming invoices to only include those due by the end of the current month
  private filterUpcomingInvoicesForCurrentMonth(
    invoices: Stripe.UpcomingInvoice[]
  ): Stripe.UpcomingInvoice[] {
    // Get the last day of the current month
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const filteredInvoices = invoices.filter((invoice) => {
      if (!invoice.created) return false;

      const dueDate = new Date(invoice.created * 1000);

      return dueDate <= lastDayOfMonth;
    });

    return filteredInvoices;
  }

  // Helper methods
  private filterByMonths(
    invoices: Stripe.Invoice[],
    months: number
  ): Stripe.Invoice[] {
    if (months <= 0) return invoices; // No filtering

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return invoices.filter((inv) => new Date(inv.created * 1000) >= cutoffDate);
  }

  private formatInvoices(
    invoices: Stripe.Invoice[] | Stripe.UpcomingInvoice[],
    productId?: string | string[]
  ): InvoiceData[] {
    return invoices
      .map((inv) => {
        const isRegularInvoice = "id" in inv;
        const { amount, amountAfterDiscount } = calculateInvoiceAmounts(
          inv,
          this.discounts,
          typeof productId === "string" ? productId : undefined // Only pass single productId
        );

        if (amountAfterDiscount <= 0) return null;

        // Extract subscription ID from the invoice
        const subscriptionId =
          typeof inv.subscription === "string"
            ? inv.subscription
            : (inv.subscription as any)?.id;

        return {
          id: isRegularInvoice ? inv.id : crypto.randomUUID(),
          subscriptionId,
          amount,
          amountAfterDiscount,
          customerEmail: inv.customer_email || "unknown",
          status: inv.status || "unknown",
          created: new Date(inv.created * 1000),
          rawJSON: inv,
        };
      })
      .filter(Boolean) as InvoiceData[];
  }
}
