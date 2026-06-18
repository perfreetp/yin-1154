import type {
  Invoice,
  InvoiceBatch,
  RejectTemplate,
  ValidationRules,
  DepartmentStats,
  DailyStats,
  ReviewerStats,
} from "@/types";

const generateInvoiceImage = (seed: number, type: string) => {
  const colors = {
    vat_special: "245,158,11",
    vat_normal: "59,130,246",
    receipt: "16,185,129",
    itinerary: "139,92,246",
    reimbursement: "239,68,68",
  };
  const color = colors[type as keyof typeof colors] || "100,116,139";
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560' viewBox='0 0 400 560'>
      <rect width='400' height='560' fill='white'/>
      <rect x='20' y='20' width='360' height='520' fill='rgb(${color})' fill-opacity='0.08' stroke='rgb(${color})' stroke-opacity='0.3' stroke-width='1'/>
      <rect x='40' y='50' width='320' height='60' fill='rgb(${color})' fill-opacity='0.12'/>
      <text x='200' y='88' text-anchor='middle' font-family='sans-serif' font-size='18' font-weight='bold' fill='rgb(${color})'>Invoice #${seed}</text>
      <line x1='40' y1='130' x2='360' y2='130' stroke='rgb(${color})' stroke-opacity='0.2'/>
      <text x='50' y='160' font-family='sans-serif' font-size='12' fill='#475569'>发票号码: ${seed.toString().padStart(8, "0")}</text>
      <text x='50' y='185' font-family='sans-serif' font-size='12' fill='#475569'>开票日期: 2026-06-${(seed % 28).toString().padStart(2, "0")}</text>
      <text x='50' y='210' font-family='sans-serif' font-size='12' fill='#475569'>购买方: 某某科技有限公司</text>
      <text x='50' y='235' font-family='sans-serif' font-size='12' fill='#475569'>销售方: 供应商${seed}有限公司</text>
      <rect x='40' y='260' width='320' height='180' fill='#F8FAFC' stroke='#E2E8F0' stroke-width='1'/>
      <text x='50' y='285' font-family='sans-serif' font-size='11' fill='#64748B'>项目名称</text>
      <text x='280' y='285' font-family='sans-serif' font-size='11' fill='#64748B'>金额</text>
      <line x1='40' y1='298' x2='360' y2='298' stroke='#E2E8F0'/>
      <text x='50' y='320' font-family='sans-serif' font-size='12' fill='#334155'>咨询服务费</text>
      <text x='280' y='320' font-family='sans-serif' font-size='12' fill='#334155'>¥${(seed * 128.5).toFixed(2)}</text>
      <text x='50' y='345' font-family='sans-serif' font-size='12' fill='#334155'>技术服务费</text>
      <text x='280' y='345' font-family='sans-serif' font-size='12' fill='#334155'>¥${(seed * 56.3).toFixed(2)}</text>
      <line x1='40' y1='370' x2='360' y2='370' stroke='#E2E8F0' stroke-dasharray='4'/>
      <text x='200' y='400' text-anchor='end' font-family='sans-serif' font-size='12' fill='#475569'>税额: ¥${(seed * 18.48).toFixed(2)}</text>
      <text x='200' y='425' text-anchor='end' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgb(${color})'>价税合计: ¥${(seed * 203.28).toFixed(2)}</text>
      <rect x='40' y='460' width='320' height='60' fill='#F1F5F9'/>
      <text x='50' y='485' font-family='sans-serif' font-size='11' fill='#64748B'>备注: 正常业务支出</text>
      <text x='50' y='505' font-family='sans-serif' font-size='10' fill='#94A3B8'>开票人: 财务${seed}</text>
    </svg>`
  )}`;
};

export const mockBatches: InvoiceBatch[] = [
  {
    batchId: "BATCH-20260618-001",
    batchName: "2026年6月第2周-研发部报销",
    uploader: "张晓峰",
    uploadTime: "2026-06-18 09:15:32",
    totalCount: 24,
    processedCount: 18,
    department: "研发中心",
    status: "processing",
  },
  {
    batchId: "BATCH-20260618-002",
    batchName: "2026年6月第2周-销售部差旅费",
    uploader: "李明华",
    uploadTime: "2026-06-18 10:22:45",
    totalCount: 36,
    processedCount: 36,
    department: "销售部",
    status: "completed",
  },
  {
    batchId: "BATCH-20260617-003",
    batchName: "2026年6月行政采购单据",
    uploader: "王淑芬",
    uploadTime: "2026-06-17 16:45:10",
    totalCount: 15,
    processedCount: 12,
    department: "行政部",
    status: "processing",
  },
];

const invoiceTypes = ["vat_special", "vat_normal", "receipt", "itinerary", "reimbursement"] as const;
const statuses = ["passed", "pending_review", "pending_recheck", "exception", "rejected"] as const;

const generateWarnings = (seed: number, status: string) => {
  const warnings = [];
  if (status === "exception" || status === "rejected") {
    if (seed % 3 === 0) {
      warnings.push({
        type: "duplicate",
        level: "error",
        message: "检测到重复发票",
        detail: "该发票号码已于2026-05-20报销过，报销单号 BX-20260520-089",
      });
    }
    if (seed % 4 === 0) {
      warnings.push({
        type: "alteration",
        level: "error",
        message: "疑似涂改痕迹",
        detail: "金额区域检测到像素异常，建议人工核验",
      });
    }
    if (seed % 5 === 0) {
      warnings.push({
        type: "layout",
        level: "warning",
        message: "版式异常",
        detail: "发票右上角防伪码区域模糊不清",
      });
    }
  }
  if (status === "pending_recheck") {
    warnings.push({
      type: "risk",
      level: "warning",
      message: "连号发票预警",
      detail: `该发票与批次内其他${seed % 3 + 1}张发票存在连号特征`,
    });
  }
  if (seed % 7 === 0 && status !== "passed") {
    warnings.push({
      type: "mismatch",
      level: "warning",
      message: "报销单金额不符",
      detail: `报销单填报金额 ¥${(seed * 210).toFixed(2)}，票据识别金额 ¥${(seed * 203.28).toFixed(2)}，差额 ¥${(seed * 6.72).toFixed(2)}`,
    });
  }
  return warnings;
};

export const generateMockInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  for (let i = 1; i <= 42; i++) {
    const type = invoiceTypes[i % 5];
    const status = statuses[i % 5];
    const warnings = generateWarnings(i, status);
    const hasWarning = warnings.length > 0;

    invoices.push({
      invoiceId: `INV-${i.toString().padStart(6, "0")}`,
      batchId: mockBatches[i % 3].batchId,
      imageUrl: generateInvoiceImage(i, type),
      thumbnailUrl: generateInvoiceImage(i, type),
      invoiceType: type,
      status: status,
      confidence: 0.75 + (i % 25) / 100,
      reviewer: i % 2 === 0 ? "录单员A" : i % 3 === 0 ? "录单员B" : undefined,
      reviewTime:
        i % 2 === 0 ? `2026-06-18 ${(9 + (i % 6)).toString().padStart(2, "0")}:${(i * 7 % 60).toString().padStart(2, "0")}:00` : undefined,
      fields: {
        invoiceNumber: i.toString().padStart(8, "0"),
        invoiceDate: `2026-06-${(i % 28 || 1).toString().padStart(2, "0")}`,
        totalAmount: Number((i * 203.28).toFixed(2)),
        taxAmount: Number((i * 18.48).toFixed(2)),
        buyerName: "某某科技有限公司",
        buyerTaxId: `91110000MA${(i * 13579).toString().padStart(10, "0").slice(0, 10)}`,
        sellerName: `供应商${i}有限公司`,
        sellerTaxId: `91310000MA${(i * 24680).toString().padStart(10, "0").slice(0, 10)}`,
        remark: "正常业务支出",
        fieldConfidence: {
          invoiceNumber: 0.98,
          invoiceDate: 0.95 - (i % 10) / 100,
          totalAmount: 0.96,
          taxAmount: 0.94,
          buyerName: 0.92,
          sellerName: 0.93 - (i % 8) / 100,
        },
      },
      validation: {
        duplicateCheck: hasWarning && warnings.some((w) => w.type === "duplicate") ? "failed" : "passed",
        layoutCheck: hasWarning && warnings.some((w) => w.type === "layout") ? "warning" : "passed",
        amountCheck: "passed",
        riskWarning: hasWarning && warnings.some((w) => w.type === "risk") ? "warning" : "passed",
        reimbursementMatch: hasWarning && warnings.some((w) => w.type === "mismatch") ? "warning" : "passed",
        alterationCheck: hasWarning && warnings.some((w) => w.type === "alteration") ? "failed" : "passed",
        overallStatus: status,
        warnings: warnings,
      },
      reimbursementAmount: i % 7 === 0 ? Number((i * 210).toFixed(2)) : Number((i * 203.28).toFixed(2)),
      pageCount: i % 3 + 1,
    });
  }
  return invoices;
};

export const mockInvoices = generateMockInvoices();

export const mockRejectTemplates: RejectTemplate[] = [
  {
    templateId: "TPL-001",
    category: "票面问题",
    content: "发票票面信息模糊不清，关键信息无法识别，请重新上传清晰版本。",
    enabled: true,
  },
  {
    templateId: "TPL-002",
    category: "票面问题",
    content: "发票存在涂改痕迹，金额或日期区域有修改迹象，请提供原始票据或联系开票方重开。",
    enabled: true,
  },
  {
    templateId: "TPL-003",
    category: "重复报销",
    content: "该发票号码已存在报销记录，属于重复提交，请核实后处理。",
    enabled: true,
  },
  {
    templateId: "TPL-004",
    category: "信息不符",
    content: "发票购买方信息与公司抬头不符，请确认发票抬头正确或更换发票。",
    enabled: true,
  },
  {
    templateId: "TPL-005",
    category: "信息不符",
    content: "报销单填报金额与票据实际金额不一致，请核实并修改报销单。",
    enabled: true,
  },
  {
    templateId: "TPL-006",
    category: "版式异常",
    content: "发票版式不符合国家标准，缺少必要的防伪元素或发票专用章，请更换有效发票。",
    enabled: true,
  },
];

export const defaultValidationRules: ValidationRules = {
  duplicateCheckEnabled: true,
  consecutiveInvoiceThreshold: 3,
  sameMerchantThreshold: 5,
  amountDeviationThreshold: 5,
  confidenceThreshold: 0.85,
  autoCropSensitivity: "medium",
  alterationCheckEnabled: true,
};

export const mockDepartmentStats: DepartmentStats[] = [
  { department: "研发中心", totalCount: 156, passedCount: 138, rejectedCount: 12, pendingCount: 6, passRate: 88.46 },
  { department: "销售部", totalCount: 243, passedCount: 205, rejectedCount: 28, pendingCount: 10, passRate: 84.36 },
  { department: "市场部", totalCount: 89, passedCount: 76, rejectedCount: 9, pendingCount: 4, passRate: 85.39 },
  { department: "行政部", totalCount: 67, passedCount: 61, rejectedCount: 4, pendingCount: 2, passRate: 91.04 },
  { department: "财务部", totalCount: 45, passedCount: 42, rejectedCount: 2, pendingCount: 1, passRate: 93.33 },
  { department: "人力资源部", totalCount: 38, passedCount: 34, rejectedCount: 3, pendingCount: 1, passRate: 89.47 },
];

export const mockDailyStats: DailyStats[] = [
  { date: "06-12", processedCount: 128, passedCount: 108, rejectedCount: 15, avgProcessTime: 42 },
  { date: "06-13", processedCount: 156, passedCount: 132, rejectedCount: 18, avgProcessTime: 38 },
  { date: "06-14", processedCount: 98, passedCount: 84, rejectedCount: 10, avgProcessTime: 45 },
  { date: "06-15", processedCount: 189, passedCount: 162, rejectedCount: 21, avgProcessTime: 36 },
  { date: "06-16", processedCount: 145, passedCount: 124, rejectedCount: 16, avgProcessTime: 40 },
  { date: "06-17", processedCount: 176, passedCount: 150, rejectedCount: 20, avgProcessTime: 39 },
  { date: "06-18", processedCount: 92, passedCount: 78, rejectedCount: 10, avgProcessTime: 41 },
];

export const mockReviewerStats: ReviewerStats[] = [
  { reviewer: "录单员A", processedCount: 312, avgProcessTime: 35, passRate: 91.3 },
  { reviewer: "录单员B", processedCount: 278, avgProcessTime: 42, passRate: 87.8 },
  { reviewer: "录单员C", processedCount: 245, avgProcessTime: 38, passRate: 89.5 },
  { reviewer: "录单员D", processedCount: 198, avgProcessTime: 45, passRate: 85.2 },
];
