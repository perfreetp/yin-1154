import { useState } from "react";
import {
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  FileX,
  Send,
  Clock,
  User,
  RotateCcw,
  CheckCircle2,
  Eye,
  X,
  MessageSquare,
  AlertOctagon,
  Copy,
  Layout,
  FileCheck,
} from "lucide-react";
import { useInvoiceStore, useSettingsStore } from "@/store";
import {
  InvoiceTypeLabels,
  InvoiceStatusColors,
  InvoiceStatusLabels,
  Invoice,
} from "@/types";
import { cn } from "@/lib/utils";

const exceptionTypeMap: Record<string, { label: string; color: string; icon: any }> = {
  duplicate: { label: "重复报销", color: "badge-danger", icon: Copy },
  alteration: { label: "涂改痕迹", color: "badge-danger", icon: RotateCcw },
  layout: { label: "版式异常", color: "badge-warning", icon: Layout },
  risk: { label: "风险预警", color: "badge-warning", icon: AlertTriangle },
  mismatch: { label: "金额不符", color: "badge-warning", icon: FileCheck },
};

export default function ExceptionsPage() {
  const { invoices, rejectInvoice, passInvoice, sendToRecheck } = useInvoiceStore();
  const { rejectTemplates } = useSettingsStore();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTemplateId, setRejectTemplateId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const exceptionInvoices = invoices.filter(
    (inv) =>
      inv.status === "exception" ||
      inv.status === "rejected" ||
      inv.validation.warnings.some((w) => w.level === "error")
  );

  const filteredInvoices =
    filterType === "all"
      ? exceptionInvoices
      : exceptionInvoices.filter((inv) =>
          inv.validation.warnings.some((w) => w.type === filterType)
        );

  const handleConfirmReject = () => {
    if (selectedInvoice) {
      rejectInvoice(
        selectedInvoice.invoiceId,
        rejectTemplateId || undefined,
        rejectReason || undefined
      );
      setShowRejectModal(false);
      setSelectedInvoice(null);
      setRejectTemplateId("");
      setRejectReason("");
    }
  };

  const getExceptionBadges = (invoice: Invoice) => {
    const types = new Set(invoice.validation.warnings.map((w) => w.type));
    return Array.from(types);
  };

  const exceptionStats = {
    total: exceptionInvoices.length,
    alteration: exceptionInvoices.filter((i) =>
      i.validation.warnings.some((w) => w.type === "alteration")
    ).length,
    duplicate: exceptionInvoices.filter((i) =>
      i.validation.warnings.some((w) => w.type === "duplicate")
    ).length,
    risk: exceptionInvoices.filter((i) =>
      i.validation.warnings.some((w) => w.type === "risk")
    ).length,
  };

  const groupedTemplates = rejectTemplates.reduce((acc, t) => {
    if (!t.enabled) return acc;
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, typeof rejectTemplates>);

  return (
    <div className="p-5 space-y-5 h-full flex flex-col">
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "异常总数",
            count: exceptionStats.total,
            icon: AlertOctagon,
            color: "text-danger-600",
            bg: "bg-danger-50",
            filter: "all",
          },
          {
            label: "涂改票据",
            count: exceptionStats.alteration,
            icon: RotateCcw,
            color: "text-danger-600",
            bg: "bg-danger-50",
            filter: "alteration",
          },
          {
            label: "重复报销",
            count: exceptionStats.duplicate,
            icon: Copy,
            color: "text-warning-600",
            bg: "bg-warning-50",
            filter: "duplicate",
          },
          {
            label: "风险预警",
            count: exceptionStats.risk,
            icon: AlertTriangle,
            color: "text-warning-600",
            bg: "bg-warning-50",
            filter: "risk",
          },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setFilterType(stat.filter)}
            className={cn(
              "card p-4 flex items-center text-left transition-all hover:shadow-card-hover",
              filterType === stat.filter && "ring-2 ring-primary-400"
            )}
          >
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
          </button>
        ))}
      </div>

      <div className="card overflow-hidden flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-slate-700">
              异常票据列表
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索发票号、销售方..."
                className="w-52 pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="btn-outline text-xs">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              筛选
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            <button className="btn-outline text-xs">批量操作</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr>
                <th className="table-header px-4 py-2.5 w-10">
                  <input type="checkbox" className="rounded-sm border-slate-300" />
                </th>
                <th className="table-header px-4 py-2.5 w-16">预览</th>
                <th className="table-header px-4 py-2.5">票据编号</th>
                <th className="table-header px-4 py-2.5">票据类型</th>
                <th className="table-header px-4 py-2.5">异常类型</th>
                <th className="table-header px-4 py-2.5">金额</th>
                <th className="table-header px-4 py-2.5">销售方</th>
                <th className="table-header px-4 py-2.5 w-28">状态</th>
                <th className="table-header px-4 py-2.5">处理人</th>
                <th className="table-header px-4 py-2.5 w-28 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const exceptionTypes = getExceptionBadges(invoice);
                return (
                  <tr
                    key={invoice.invoiceId}
                    className={cn(
                      "table-row",
                      invoice.status === "exception" && "bg-danger-50/30"
                    )}
                  >
                    <td className="table-cell px-4">
                      <input
                        type="checkbox"
                        className="rounded-sm border-slate-300"
                      />
                    </td>
                    <td className="table-cell px-4">
                      <div className="w-10 h-14 bg-slate-100 rounded-sm overflow-hidden border border-slate-200">
                        <img
                          src={invoice.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="table-cell px-4 font-mono text-xs text-primary-600">
                      {invoice.invoiceId}
                      <p className="text-slate-400 text-[10px] mt-0.5">
                        {invoice.fields.invoiceNumber}
                      </p>
                    </td>
                    <td className="table-cell px-4 text-slate-600 text-xs">
                      {InvoiceTypeLabels[invoice.invoiceType]}
                    </td>
                    <td className="table-cell px-4">
                      <div className="flex flex-wrap gap-1">
                        {exceptionTypes.map((type) => {
                          const info = exceptionTypeMap[type] || {
                            label: type,
                            color: "badge-slate",
                            icon: AlertTriangle,
                          };
                          return (
                            <span key={type} className={cn("badge", info.color)}>
                              <info.icon className="w-3 h-3 mr-0.5" />
                              {info.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="table-cell px-4 font-mono font-medium text-slate-800">
                      ¥{invoice.fields.totalAmount.toFixed(2)}
                    </td>
                    <td className="table-cell px-4 text-slate-600 max-w-[200px] truncate">
                      {invoice.fields.sellerName}
                    </td>
                    <td className="table-cell px-4">
                      <span
                        className={cn("badge", InvoiceStatusColors[invoice.status])}
                      >
                        {InvoiceStatusLabels[invoice.status]}
                      </span>
                    </td>
                    <td className="table-cell px-4">
                      <div className="flex items-center text-xs text-slate-500">
                        {invoice.reviewer ? (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            {invoice.reviewer}
                          </>
                        ) : (
                          <span className="text-slate-400">待处理</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell px-4 text-right">
                      <div className="flex items-center justify-end space-x-0.5">
                        <button
                          className="btn-ghost p-1.5"
                          title="查看详情"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="退回处理"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowRejectModal(true);
                          }}
                        >
                          <FileX className="w-4 h-4 text-danger-500" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="复核通过"
                          onClick={() => passInvoice(invoice.invoiceId)}
                        >
                          <CheckCircle2 className="w-4 h-4 text-success-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && !showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-sm shadow-lg w-[900px] max-h-[85vh] flex flex-col animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  异常票据详情
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedInvoice.invoiceId} · {InvoiceTypeLabels[selectedInvoice.invoiceType]}
                </p>
              </div>
              <button
                className="btn-ghost p-1.5"
                onClick={() => setSelectedInvoice(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex">
              <div className="w-1/2 p-5 bg-slate-100 overflow-auto flex items-start justify-center">
                <img
                  src={selectedInvoice.imageUrl}
                  alt="票据预览"
                  className="max-w-full bg-white shadow-panel rounded-sm"
                />
              </div>
              <div className="w-1/2 p-5 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-danger-500 mr-1.5" />
                    异常信息
                  </h4>
                  {selectedInvoice.validation.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-sm border",
                        w.level === "error"
                          ? "bg-danger-50 border-danger-200"
                          : "bg-warning-50 border-warning-200"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium",
                          w.level === "error" ? "text-danger-700" : "text-warning-700"
                        )}
                      >
                        {w.message}
                      </p>
                      {w.detail && (
                        <p
                          className={cn(
                            "text-xs mt-1",
                            w.level === "error" ? "text-danger-600" : "text-warning-600"
                          )}
                        >
                          {w.detail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    票据信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">发票号码</span>
                      <p className="font-mono text-slate-800 mt-0.5">
                        {selectedInvoice.fields.invoiceNumber}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">开票日期</span>
                      <p className="text-slate-800 mt-0.5">
                        {selectedInvoice.fields.invoiceDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">价税合计</span>
                      <p className="font-mono font-medium text-slate-800 mt-0.5">
                        ¥{selectedInvoice.fields.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">税额</span>
                      <p className="font-mono text-slate-800 mt-0.5">
                        ¥{selectedInvoice.fields.taxAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 text-xs">销售方</span>
                      <p className="text-slate-800 mt-0.5">
                        {selectedInvoice.fields.sellerName}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 text-xs">购买方</span>
                      <p className="text-slate-800 mt-0.5">
                        {selectedInvoice.fields.buyerName}
                      </p>
                    </div>
                  </div>
                </div>

                {(() => {
                  const timelineRecords = [
                    ...(selectedInvoice.exceptions || []),
                  ];
                  if (
                    !timelineRecords.some(
                      (r) => r.exceptionType === "初始识别"
                    ) &&
                    selectedInvoice.status !== "uploading" &&
                    selectedInvoice.status !== "recognizing"
                  ) {
                    timelineRecords.unshift({
                      recordId: "init",
                      invoiceId: selectedInvoice.invoiceId,
                      exceptionType: "初始识别",
                      description: "票据完成初始识别，进入待校对队列",
                      operator: "OCR系统",
                      createTime: selectedInvoice.reviewTime || "系统自动",
                    });
                  }
                  return timelineRecords.length > 0;
                })() && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-primary-600" />
                      处理时间线
                    </h4>
                    <div className="relative">
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
                      <div className="space-y-4">
                        {(selectedInvoice.exceptions || [])
                          .slice()
                          .reverse()
                          .map((exc, idx, arr) => {
                            const isLatest = idx === 0;
                            const typeColor: Record<string, string> = {
                              验真退回: "text-danger-500 bg-danger-100",
                              人工退回: "text-danger-500 bg-danger-100",
                              批量退回: "text-danger-500 bg-danger-100",
                              复核通过: "text-success-500 bg-success-100",
                              提交复核: "text-warning-500 bg-warning-100",
                              异常处理: "text-warning-500 bg-warning-100",
                            };
                            const dotColor = typeColor[exc.exceptionType] || "text-slate-500 bg-slate-100";
                            return (
                              <div key={exc.recordId} className="relative pl-8">
                                <div
                                  className={cn(
                                    "absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center",
                                    dotColor.split(" ")[1]
                                  )}
                                >
                                  {exc.exceptionType.includes("退回") ? (
                                    <FileX
                                      className={cn(
                                        "w-3 h-3",
                                        dotColor.split(" ")[0]
                                      )}
                                    />
                                  ) : exc.exceptionType.includes("通过") ? (
                                    <CheckCircle2
                                      className={cn(
                                        "w-3 h-3",
                                        dotColor.split(" ")[0]
                                      )}
                                    />
                                  ) : (
                                    <Send
                                      className={cn(
                                        "w-3 h-3",
                                        dotColor.split(" ")[0]
                                      )}
                                    />
                                  )}
                                </div>
                                {isLatest && (
                                  <span className="absolute left-7 top-0 text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-sm">
                                    最新
                                  </span>
                                )}
                                <div className="pt-0.5">
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={cn(
                                        "text-xs font-medium",
                                        exc.exceptionType.includes("退回")
                                          ? "text-danger-700"
                                          : exc.exceptionType.includes("通过")
                                          ? "text-success-700"
                                          : "text-warning-700"
                                      )}
                                    >
                                      {exc.exceptionType}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {exc.description}
                                  </p>
                                  {exc.rejectReason && (
                                    <div className="mt-2 p-2.5 bg-danger-50 border border-danger-100 rounded-sm">
                                      <p className="text-xs text-danger-600">
                                        <span className="font-medium">退回原因：</span>
                                        {exc.rejectReason}
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-400">
                                    <span className="flex items-center">
                                      <User className="w-3 h-3 mr-1" />
                                      {exc.operator}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {exc.createTime}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                className="btn-outline"
                onClick={() => setSelectedInvoice(null)}
              >
                关闭
              </button>
              <button
                className="btn-warning"
                onClick={() => sendToRecheck(selectedInvoice.invoiceId)}
              >
                <Send className="w-4 h-4 mr-1.5" />
                提交复核
              </button>
              <button
                className="btn-danger"
                onClick={() => setShowRejectModal(true)}
              >
                <FileX className="w-4 h-4 mr-1.5" />
                退回
              </button>
              <button
                className="btn-success"
                onClick={() => {
                  passInvoice(selectedInvoice.invoiceId);
                  setSelectedInvoice(null);
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-sm shadow-lg w-[500px] animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                退回异常票据
              </h3>
              <button
                className="btn-ghost p-1.5"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectTemplateId("");
                  setRejectReason("");
                }}
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
                    const template = rejectTemplates.find(
                      (t) => t.templateId === e.target.value
                    );
                    if (template) setRejectReason(template.content);
                  }}
                  className="input-field text-sm"
                >
                  <option value="">-- 请选择模板或手动填写 --</option>
                  {Object.entries(groupedTemplates).map(([category, temps]) => (
                    <optgroup key={category} label={category}>
                      {temps.map((t) => (
                        <option key={t.templateId} value={t.templateId}>
                          {t.content.slice(0, 40)}
                          {t.content.length > 40 ? "..." : ""}
                        </option>
                      ))}
                    </optgroup>
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
                  placeholder="请详细说明退回原因，便于申请人理解并修改"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>操作人: 当前录单员</span>
                <span>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date().toLocaleString("zh-CN")}
                </span>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                className="btn-outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectTemplateId("");
                  setRejectReason("");
                }}
              >
                取消
              </button>
              <button
                className="btn-danger"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
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
