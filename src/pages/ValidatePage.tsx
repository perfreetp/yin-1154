import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronRight,
  FileWarning,
  Users,
  Calendar,
  Hash,
  DollarSign,
  Store,
  ArrowRight,
  Send,
  FileCheck,
  FileX,
  Eye,
  RotateCcw,
  X,
  MessageSquare,
} from "lucide-react";
import { useInvoiceStore, useSettingsStore } from "@/store";
import {
  InvoiceTypeLabels,
  InvoiceStatusColors,
  InvoiceStatusLabels,
  ValidationStatus,
} from "@/types";
import { cn } from "@/lib/utils";

const statusIconMap = {
  passed: CheckCircle2,
  warning: AlertTriangle,
  failed: XCircle,
};

const statusColorMap = {
  passed: "text-success-600 bg-success-50",
  warning: "text-warning-600 bg-warning-50",
  failed: "text-danger-600 bg-danger-50",
};

const validationItems = [
  {
    key: "duplicateCheck",
    label: "查重检测",
    description: "检测发票是否重复报销",
    icon: Copy,
  },
  {
    key: "layoutCheck",
    label: "版式校验",
    description: "验证发票版式是否符合标准",
    icon: FileWarning,
  },
  {
    key: "alterationCheck",
    label: "涂改检测",
    description: "检测是否存在涂改痕迹",
    icon: RotateCcw,
  },
  {
    key: "amountCheck",
    label: "金额校验",
    description: "价税合计与分项金额是否一致",
    icon: DollarSign,
  },
  {
    key: "riskWarning",
    label: "风险预警",
    description: "连号票、同商户集中报销检测",
    icon: AlertTriangle,
  },
  {
    key: "reimbursementMatch",
    label: "报销单比对",
    description: "与报销单填报内容比对",
    icon: FileCheck,
  },
];

export default function ValidatePage() {
  const {
    invoices,
    selectedInvoiceId,
    setSelectedInvoice,
    passInvoice,
    sendToRecheck,
    rejectToException,
  } = useInvoiceStore();
  const { rejectTemplates } = useSettingsStore();
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(
    new Set()
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTemplateId, setRejectTemplateId] = useState("");

  const validatingInvoices = invoices.filter(
    (inv) =>
      inv.status === "validating" ||
      inv.status === "passed" ||
      inv.status === "pending_recheck"
  );

  const summaryStats = {
    total: validatingInvoices.length,
    passed: validatingInvoices.filter((i) => i.status === "passed").length,
    pending: validatingInvoices.filter((i) => i.status === "validating").length,
    recheck: validatingInvoices.filter((i) => i.status === "pending_recheck")
      .length,
  };

  const selectedInvoice =
    validatingInvoices.find((inv) => inv.invoiceId === selectedInvoiceId) ||
    validatingInvoices[0];

  const toggleWarning = (key: string) => {
    setExpandedWarnings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderValidationStatus = (status: ValidationStatus) => {
    const Icon = statusIconMap[status];
    return (
      <div
        className={cn(
          "w-5 h-5 rounded-sm flex items-center justify-center",
          statusColorMap[status]
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
    );
  };

  if (!selectedInvoice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>暂无待验真的票据</p>
        </div>
      </div>
    );
  }

  const { fields, validation } = selectedInvoice;

  return (
    <div className="p-5 space-y-5 h-full overflow-auto">
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "待验真",
            count: summaryStats.pending,
            icon: ShieldCheck,
            color: "text-primary-600",
            bg: "bg-primary-50",
          },
          {
            label: "已通过",
            count: summaryStats.passed,
            icon: CheckCircle2,
            color: "text-success-600",
            bg: "bg-success-50",
          },
          {
            label: "待复核",
            count: summaryStats.recheck,
            icon: AlertTriangle,
            color: "text-warning-600",
            bg: "bg-warning-50",
          },
          {
            label: "总验真",
            count: summaryStats.total,
            icon: FileCheck,
            color: "text-slate-600",
            bg: "bg-slate-100",
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center">
            <div
              className={`w-10 h-10 ${stat.bg} rounded-sm flex items-center justify-center`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-xl font-semibold text-slate-800 mt-0.5">
                {stat.count}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5" style={{ height: "calc(100vh - 260px)" }}>
        <div className="col-span-3 card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <span className="text-sm font-medium text-slate-700">
              验真队列
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {validatingInvoices.map((inv) => {
              const hasWarnings = inv.validation.warnings.length > 0;
              return (
                <button
                  key={inv.invoiceId}
                  onClick={() => setSelectedInvoice(inv.invoiceId)}
                  className={cn(
                    "w-full text-left p-3 rounded-sm transition-all",
                    inv.invoiceId === selectedInvoice.invoiceId
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-slate-50 border border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-mono text-primary-600">
                        {inv.invoiceId}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {InvoiceTypeLabels[inv.invoiceType]}
                      </p>
                      <p className="text-sm font-mono font-medium text-slate-800 mt-1">
                        ¥{inv.fields.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={cn("badge", InvoiceStatusColors[inv.status])}
                      >
                        {InvoiceStatusLabels[inv.status]}
                      </span>
                      {hasWarnings && (
                        <span className="text-xs text-danger-600 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          {inv.validation.warnings.length}项
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-5 card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">
                票据影像
              </span>
              <span className="text-xs font-mono text-slate-400">
                {selectedInvoice.invoiceId}
              </span>
            </div>
            <button className="btn-ghost text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              放大查看
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-start justify-center">
            <img
              src={selectedInvoice.imageUrl}
              alt="票据预览"
              className="max-w-full bg-white shadow-panel rounded-sm"
            />
          </div>
        </div>

        <div className="col-span-4 flex flex-col space-y-4 overflow-hidden">
          <div className="card overflow-hidden">
            <div
              className={cn(
                "px-4 py-3 border-b flex items-center",
                validation.overallStatus === "passed"
                  ? "bg-success-50 border-success-100"
                  : validation.overallStatus === "pending_recheck"
                  ? "bg-warning-50 border-warning-100"
                  : "bg-primary-50 border-primary-100"
              )}
            >
              {validation.overallStatus === "passed" ? (
                <ShieldCheck className="w-5 h-5 text-success-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-warning-600" />
              )}
              <div className="ml-2.5 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {validation.overallStatus === "passed"
                    ? "验真通过"
                    : validation.overallStatus === "pending_recheck"
                    ? "存在风险，建议复核"
                    : "验真中"}
                </p>
                <p className="text-xs text-slate-500">
                  {validation.warnings.length > 0
                    ? `检测到 ${validation.warnings.length} 项预警`
                    : "全部校验项通过"}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-3 overflow-hidden">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div className="flex items-center text-xs">
                <Hash className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <span className="text-slate-500">票号:</span>
                <span className="ml-1 font-mono text-slate-700">
                  {fields.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <span className="text-slate-500">日期:</span>
                <span className="ml-1 text-slate-700">{fields.invoiceDate}</span>
              </div>
              <div className="flex items-center text-xs">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <span className="text-slate-500">金额:</span>
                <span className="ml-1 font-mono font-medium text-slate-800">
                  ¥{fields.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center text-xs">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                <span className="text-slate-500">税额:</span>
                <span className="ml-1 font-mono text-slate-700">
                  ¥{fields.taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center text-xs col-span-2">
                <Store className="w-3.5 h-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
                <span className="text-slate-500">销售方:</span>
                <span className="ml-1 text-slate-700 truncate">
                  {fields.sellerName}
                </span>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-medium text-slate-700">
                验真详情
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {validationItems.map((item) => {
                const status = (validation as any)[item.key] as ValidationStatus;
                const warningsForItem = validation.warnings.filter(
                  (w) =>
                    (item.key === "duplicateCheck" && w.type === "duplicate") ||
                    (item.key === "layoutCheck" && w.type === "layout") ||
                    (item.key === "alterationCheck" && w.type === "alteration") ||
                    (item.key === "riskWarning" && w.type === "risk") ||
                    (item.key === "reimbursementMatch" && w.type === "mismatch")
                );
                const hasWarnings = warningsForItem.length > 0;
                const isExpanded = expandedWarnings.has(item.key);

                return (
                  <div key={item.key}>
                    <button
                      onClick={() => hasWarnings && toggleWarning(item.key)}
                      className="w-full px-4 py-2.5 flex items-center hover:bg-slate-50 transition-colors text-left"
                    >
                      {renderValidationStatus(status)}
                      <item.icon className="w-4 h-4 text-slate-400 ml-2.5" />
                      <div className="ml-2 flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{item.label}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      {hasWarnings && (
                        <>
                          <span className="badge badge-danger mr-2">
                            {warningsForItem.length}项预警
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </>
                      )}
                    </button>
                    {hasWarnings && isExpanded && (
                      <div className="px-4 pb-3">
                        {warningsForItem.map((w, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-2.5 rounded-sm text-xs",
                              w.level === "error"
                                ? "bg-danger-50 border border-danger-100"
                                : "bg-warning-50 border border-warning-100"
                            )}
                          >
                            <p
                              className={cn(
                                "font-medium",
                                w.level === "error"
                                  ? "text-danger-700"
                                  : "text-warning-700"
                              )}
                            >
                              {w.message}
                            </p>
                            {w.detail && (
                              <p
                                className={cn(
                                  "mt-1",
                                  w.level === "error"
                                    ? "text-danger-600"
                                    : "text-warning-600"
                                )}
                              >
                                {w.detail}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-3">
            <div className="flex items-center space-x-2">
              <button className="btn-outline flex-1" onClick={() => sendToRecheck(selectedInvoice.invoiceId)}>
                <Users className="w-4 h-4 mr-1.5" />
                提交复核
              </button>
              <button
                className="btn-danger flex-1"
                onClick={() => {
                  setShowRejectModal(true);
                  setRejectReason("");
                  setRejectTemplateId("");
                }}
              >
                <FileX className="w-4 h-4 mr-1.5" />
                退回异常池
              </button>
              <button
                className="btn-success flex-1"
                onClick={() => passInvoice(selectedInvoice.invoiceId)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                验真通过
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-sm shadow-lg w-[500px] animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                退回至异常池
              </h3>
              <button
                className="btn-ghost p-1.5"
                onClick={() => setShowRejectModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-danger-50 rounded-sm border border-danger-100">
                <p className="text-sm text-danger-700">
                  正在退回: <span className="font-mono">{selectedInvoice.invoiceId}</span>
                </p>
                <p className="text-xs text-danger-600 mt-0.5">
                  金额: ¥{selectedInvoice.fields.totalAmount.toFixed(2)} ·{" "}
                  {InvoiceTypeLabels[selectedInvoice.invoiceType]}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  选择退回原因模板
                </label>
                <select
                  value={rejectTemplateId}
                  onChange={(e) => {
                    setRejectTemplateId(e.target.value);
                    const tpl = rejectTemplates.find((t) => t.templateId === e.target.value);
                    if (tpl) setRejectReason(tpl.content);
                  }}
                  className="input-field text-sm"
                >
                  <option value="">-- 请选择模板或手动填写 --</option>
                  {rejectTemplates.filter((t) => t.enabled).map((t) => (
                    <option key={t.templateId} value={t.templateId}>
                      [{t.category}] {t.content.slice(0, 30)}
                      {t.content.length > 30 ? "..." : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  退回原因说明 <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="input-field text-sm resize-none"
                  placeholder="请详细说明退回原因，便于后续复核处理"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>操作人: 当前录单员</span>
                <span>
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  {new Date().toLocaleString("zh-CN")}
                </span>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                className="btn-outline"
                onClick={() => setShowRejectModal(false)}
              >
                取消
              </button>
              <button
                className="btn-danger"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  rejectToException(selectedInvoice.invoiceId, rejectReason);
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectTemplateId("");
                }}
              >
                <FileX className="w-4 h-4 mr-1.5" />
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
