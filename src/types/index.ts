export type InvoiceType =
  | "vat_special"
  | "vat_normal"
  | "receipt"
  | "itinerary"
  | "reimbursement";

export type InvoiceStatus =
  | "uploading"
  | "recognizing"
  | "pending_review"
  | "reviewing"
  | "validating"
  | "passed"
  | "pending_recheck"
  | "exception"
  | "rejected";

export type ValidationStatus = "passed" | "warning" | "failed";

export interface InvoiceBatch {
  batchId: string;
  batchName: string;
  uploader: string;
  uploadTime: string;
  totalCount: number;
  processedCount: number;
  department: string;
  status: "processing" | "completed";
}

export interface InvoiceFields {
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  buyerName: string;
  buyerTaxId: string;
  sellerName: string;
  sellerTaxId: string;
  remark?: string;
  fieldConfidence: Record<string, number>;
}

export interface WarningItem {
  type: "duplicate" | "layout" | "amount" | "risk" | "mismatch" | "alteration";
  level: "info" | "warning" | "error";
  message: string;
  detail?: string;
}

export interface ValidationResult {
  duplicateCheck: ValidationStatus;
  layoutCheck: ValidationStatus;
  amountCheck: ValidationStatus;
  riskWarning: ValidationStatus;
  reimbursementMatch: ValidationStatus;
  alterationCheck: ValidationStatus;
  overallStatus: InvoiceStatus;
  warnings: WarningItem[];
}

export interface ExceptionRecord {
  recordId: string;
  invoiceId: string;
  exceptionType: string;
  description: string;
  rejectReason?: string;
  rejectTemplateId?: string;
  operator: string;
  createTime: string;
}

export interface Invoice {
  invoiceId: string;
  batchId: string;
  imageUrl: string;
  thumbnailUrl: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  confidence: number;
  reviewer?: string;
  reviewTime?: string;
  fields: InvoiceFields;
  validation: ValidationResult;
  exceptions?: ExceptionRecord[];
  reimbursementAmount?: number;
  pageCount?: number;
}

export interface RejectTemplate {
  templateId: string;
  category: string;
  content: string;
  enabled: boolean;
}

export interface ValidationRules {
  duplicateCheckEnabled: boolean;
  consecutiveInvoiceThreshold: number;
  sameMerchantThreshold: number;
  amountDeviationThreshold: number;
  confidenceThreshold: number;
  autoCropSensitivity: "low" | "medium" | "high";
  alterationCheckEnabled: boolean;
}

export interface DepartmentStats {
  department: string;
  totalCount: number;
  passedCount: number;
  rejectedCount: number;
  pendingCount: number;
  passRate: number;
}

export interface DailyStats {
  date: string;
  processedCount: number;
  passedCount: number;
  rejectedCount: number;
  avgProcessTime: number;
}

export interface ReviewerStats {
  reviewer: string;
  processedCount: number;
  avgProcessTime: number;
  passRate: number;
}

export const InvoiceTypeLabels: Record<InvoiceType, string> = {
  vat_special: "增值税专用发票",
  vat_normal: "增值税普通发票",
  receipt: "收据",
  itinerary: "行程单",
  reimbursement: "报销单",
};

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  uploading: "上传中",
  recognizing: "识别中",
  pending_review: "待校对",
  reviewing: "校对中",
  validating: "验真中",
  passed: "已通过",
  pending_recheck: "待复核",
  exception: "异常",
  rejected: "已退回",
};

export const InvoiceStatusColors: Record<InvoiceStatus, string> = {
  uploading: "badge-slate",
  recognizing: "badge-slate",
  pending_review: "badge-info",
  reviewing: "badge-info",
  validating: "badge-warning",
  passed: "badge-success",
  pending_recheck: "badge-warning",
  exception: "badge-danger",
  rejected: "badge-danger",
};
