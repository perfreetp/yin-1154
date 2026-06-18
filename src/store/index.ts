import { create } from "zustand";
import type {
  Invoice,
  InvoiceBatch,
  InvoiceStatus,
  RejectTemplate,
  ValidationRules,
  ExceptionRecord,
} from "@/types";
import {
  mockInvoices,
  mockBatches,
  mockRejectTemplates,
  defaultValidationRules,
} from "@/data/mockData";

interface InvoiceState {
  invoices: Invoice[];
  batches: InvoiceBatch[];
  selectedInvoiceId: string | null;
  selectedBatchId: string | null;
  filters: {
    status?: InvoiceStatus;
    type?: string;
    keyword?: string;
  };

  getInvoicesByBatch: (batchId: string) => Invoice[];
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getExceptionInvoices: () => Invoice[];
  getSelectedInvoice: () => Invoice | undefined;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  updateInvoiceFields: (invoiceId: string, fields: Partial<Invoice["fields"]>) => void;
  updateInvoiceType: (invoiceId: string, type: Invoice["invoiceType"]) => void;
  setSelectedInvoice: (invoiceId: string | null) => void;
  setSelectedBatch: (batchId: string | null) => void;
  setFilters: (filters: Partial<InvoiceState["filters"]>) => void;
  addInvoices: (invoices: Invoice[]) => void;
  addBatch: (batch: InvoiceBatch) => void;
  updateBatchProcessed: (batchId: string) => void;
  updateBatchProgress: (batchId: string, successCount: number, failCount: number) => void;
  rejectInvoice: (invoiceId: string, templateId?: string, reason?: string) => void;
  rejectToException: (invoiceId: string, reason?: string) => void;
  passInvoice: (invoiceId: string) => void;
  sendToRecheck: (invoiceId: string) => void;
  sendToValidate: (invoiceIds: string[]) => void;
  batchPass: (invoiceIds: string[]) => void;
  batchReject: (invoiceIds: string[], reason?: string) => void;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: mockInvoices,
  batches: mockBatches,
  selectedInvoiceId: mockInvoices[0]?.invoiceId || null,
  selectedBatchId: null,
  filters: {},

  getInvoicesByBatch: (batchId: string) =>
    get().invoices.filter((inv) => inv.batchId === batchId),

  getInvoicesByStatus: (status: InvoiceStatus) =>
    get().invoices.filter((inv) => inv.status === status),

  getExceptionInvoices: () =>
    get().invoices.filter(
      (inv) => inv.status === "exception" || inv.status === "rejected"
    ),

  getSelectedInvoice: () =>
    get().invoices.find((inv) => inv.invoiceId === get().selectedInvoiceId),

  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.invoiceId === invoiceId
          ? {
              ...inv,
              status,
              validation: { ...inv.validation, overallStatus: status },
              reviewer: "当前录单员",
              reviewTime: new Date().toLocaleString("zh-CN"),
            }
          : inv
      ),
    })),

  updateInvoiceFields: (
    invoiceId: string,
    fields: Partial<Invoice["fields"]>
  ) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.invoiceId === invoiceId
          ? { ...inv, fields: { ...inv.fields, ...fields } }
          : inv
      ),
    })),

  updateInvoiceType: (invoiceId: string, type: Invoice["invoiceType"]) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.invoiceId === invoiceId ? { ...inv, invoiceType: type } : inv
      ),
    })),

  setSelectedInvoice: (invoiceId: string | null) =>
    set({ selectedInvoiceId: invoiceId }),

  setSelectedBatch: (batchId: string | null) => set({ selectedBatchId: batchId }),

  setFilters: (filters: Partial<InvoiceState["filters"]>) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  addInvoices: (newInvoices: Invoice[]) =>
    set((state) => ({ invoices: [...newInvoices, ...state.invoices] })),

  addBatch: (batch: InvoiceBatch) =>
    set((state) => ({ batches: [batch, ...state.batches] })),

  updateBatchProcessed: (batchId: string) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.batchId === batchId
          ? {
              ...b,
              processedCount: Math.min(b.processedCount + 1, b.totalCount),
              status:
                b.processedCount + 1 >= b.totalCount ? "completed" : "processing",
            }
          : b
      ),
    })),

  rejectInvoice: (invoiceId: string, templateId?: string, reason?: string) => {
    const newException: ExceptionRecord = {
      recordId: `EXC-${Date.now()}`,
      invoiceId,
      exceptionType: "人工退回",
      description: reason || "录单员审核不通过",
      rejectReason: reason,
      rejectTemplateId: templateId,
      operator: "当前录单员",
      createTime: new Date().toLocaleString("zh-CN"),
    };
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.invoiceId === invoiceId
          ? {
              ...inv,
              status: "rejected",
              validation: { ...inv.validation, overallStatus: "rejected" },
              exceptions: [...(inv.exceptions || []), newException],
              reviewer: "当前录单员",
              reviewTime: new Date().toLocaleString("zh-CN"),
            }
          : inv
      ),
    }));
  },

  rejectToException: (invoiceId: string, reason?: string) => {
    const newException: ExceptionRecord = {
      recordId: `EXC-${Date.now()}`,
      invoiceId,
      exceptionType: "验真退回",
      description: reason || "验真不通过，转入异常池",
      rejectReason: reason,
      operator: "当前录单员",
      createTime: new Date().toLocaleString("zh-CN"),
    };
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.invoiceId === invoiceId
          ? {
              ...inv,
              status: "exception",
              validation: { ...inv.validation, overallStatus: "exception" },
              exceptions: [...(inv.exceptions || []), newException],
              reviewer: "当前录单员",
              reviewTime: new Date().toLocaleString("zh-CN"),
            }
          : inv
      ),
    }));
  },

  passInvoice: (invoiceId: string) => {
    const now = new Date().toLocaleString("zh-CN");
    const newRecord: ExceptionRecord = {
      recordId: `EXC-${Date.now()}`,
      invoiceId,
      exceptionType: "复核通过",
      description: "票据复核通过，进入已通过状态",
      operator: "当前录单员",
      createTime: now,
    };
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.invoiceId === invoiceId
          ? {
              ...inv,
              status: "passed",
              validation: { ...inv.validation, overallStatus: "passed" },
              reviewer: "当前录单员",
              reviewTime: now,
              exceptions: [...(inv.exceptions || []), newRecord],
            }
          : inv
      ),
    }));
  },

  sendToRecheck: (invoiceId: string) => {
    const now = new Date().toLocaleString("zh-CN");
    const newRecord: ExceptionRecord = {
      recordId: `EXC-${Date.now()}`,
      invoiceId,
      exceptionType: "提交复核",
      description: "从异常池提交至复核流程",
      operator: "当前录单员",
      createTime: now,
    };
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.invoiceId === invoiceId
          ? {
              ...inv,
              status: "pending_recheck",
              validation: { ...inv.validation, overallStatus: "pending_recheck" },
              reviewer: "当前录单员",
              reviewTime: now,
              exceptions: [...(inv.exceptions || []), newRecord],
            }
          : inv
      ),
    }));
  },

  updateBatchProgress: (batchId: string, successCount: number, failCount: number) =>
    set((state) => ({
      batches: state.batches.map((b) =>
        b.batchId === batchId
          ? {
              ...b,
              processedCount: Math.min(b.processedCount + successCount + failCount, b.totalCount),
              status:
                b.processedCount + successCount + failCount >= b.totalCount
                  ? "completed"
                  : "processing",
            }
          : b
      ),
    })),

  sendToValidate: (invoiceIds: string[]) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        invoiceIds.includes(inv.invoiceId)
          ? {
              ...inv,
              status: "validating",
              validation: { ...inv.validation, overallStatus: "validating" },
            }
          : inv
      ),
    })),

  batchPass: (invoiceIds: string[]) =>
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        invoiceIds.includes(inv.invoiceId)
          ? {
              ...inv,
              status: "passed",
              validation: { ...inv.validation, overallStatus: "passed" },
              reviewer: "当前录单员",
              reviewTime: new Date().toLocaleString("zh-CN"),
            }
          : inv
      ),
    })),

  batchReject: (invoiceIds: string[], reason?: string) => {
    const now = new Date().toLocaleString("zh-CN");
    set((state) => ({
      invoices: state.invoices.map((inv) => {
        if (!invoiceIds.includes(inv.invoiceId)) return inv;
        const newException: ExceptionRecord = {
          recordId: `EXC-${Date.now()}-${inv.invoiceId}`,
          invoiceId: inv.invoiceId,
          exceptionType: "批量退回",
          description: reason || "批量处理退回",
          rejectReason: reason,
          operator: "当前录单员",
          createTime: now,
        };
        return {
          ...inv,
          status: "rejected",
          validation: { ...inv.validation, overallStatus: "rejected" },
          exceptions: [...(inv.exceptions || []), newException],
          reviewer: "当前录单员",
          reviewTime: now,
        };
      }),
    }));
  },
}));

interface SettingsState {
  rejectTemplates: RejectTemplate[];
  validationRules: ValidationRules;

  updateValidationRules: (rules: Partial<ValidationRules>) => void;
  addRejectTemplate: (template: Omit<RejectTemplate, "templateId">) => void;
  updateRejectTemplate: (templateId: string, updates: Partial<RejectTemplate>) => void;
  deleteRejectTemplate: (templateId: string) => void;
  toggleTemplate: (templateId: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  rejectTemplates: mockRejectTemplates,
  validationRules: defaultValidationRules,

  updateValidationRules: (rules: Partial<ValidationRules>) =>
    set((state) => ({
      validationRules: { ...state.validationRules, ...rules },
    })),

  addRejectTemplate: (template) =>
    set((state) => ({
      rejectTemplates: [
        ...state.rejectTemplates,
        {
          ...template,
          templateId: `TPL-${Date.now()}`,
        },
      ],
    })),

  updateRejectTemplate: (templateId, updates) =>
    set((state) => ({
      rejectTemplates: state.rejectTemplates.map((t) =>
        t.templateId === templateId ? { ...t, ...updates } : t
      ),
    })),

  deleteRejectTemplate: (templateId) =>
    set((state) => ({
      rejectTemplates: state.rejectTemplates.filter((t) => t.templateId !== templateId),
    })),

  toggleTemplate: (templateId) =>
    set((state) => ({
      rejectTemplates: state.rejectTemplates.map((t) =>
        t.templateId === templateId ? { ...t, enabled: !t.enabled } : t
      ),
    })),
}));
