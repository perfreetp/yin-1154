import { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Crop,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  FileText,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useInvoiceStore } from "@/store";
import {
  InvoiceType,
  InvoiceTypeLabels,
  InvoiceStatusColors,
  InvoiceStatusLabels,
} from "@/types";
import { cn } from "@/lib/utils";

const fieldLabels: Record<string, string> = {
  invoiceNumber: "发票号码",
  invoiceDate: "开票日期",
  totalAmount: "价税合计",
  taxAmount: "税额",
  buyerName: "购买方名称",
  buyerTaxId: "购买方税号",
  sellerName: "销售方名称",
  sellerTaxId: "销售方税号",
  remark: "备注",
};

const invoiceTypeOptions: InvoiceType[] = [
  "vat_special",
  "vat_normal",
  "receipt",
  "itinerary",
  "reimbursement",
];

export default function VerifyPage() {
  const {
    invoices,
    selectedInvoiceId,
    setSelectedInvoice,
    updateInvoiceFields,
    updateInvoiceStatus,
  } = useInvoiceStore();

  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "pending_review" || inv.status === "reviewing"
  );
  const currentIndex = pendingInvoices.findIndex(
    (inv) => inv.invoiceId === selectedInvoiceId
  );
  const selectedInvoice =
    pendingInvoices[currentIndex >= 0 ? currentIndex : 0] || pendingInvoices[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedInvoice(pendingInvoices[currentIndex - 1].invoiceId);
      setEditedFields(new Set());
    }
  };

  const handleNext = () => {
    if (currentIndex < pendingInvoices.length - 1) {
      setSelectedInvoice(pendingInvoices[currentIndex + 1].invoiceId);
      setEditedFields(new Set());
    }
  };

  const handleFieldChange = (field: string, value: string | number) => {
    if (!selectedInvoice) return;
    setEditedFields((prev) => new Set([...prev, field]));
    updateInvoiceFields(selectedInvoice.invoiceId, {
      [field]: value,
    } as any);
  };

  const handleInvoiceTypeChange = (type: InvoiceType) => {
    if (!selectedInvoice) return;
    updateInvoiceFields(selectedInvoice.invoiceId, {} as any);
  };

  const confirmAndNext = () => {
    if (!selectedInvoice) return;
    updateInvoiceStatus(selectedInvoice.invoiceId, "validating");
    if (currentIndex < pendingInvoices.length - 1) {
      setSelectedInvoice(pendingInvoices[currentIndex + 1].invoiceId);
      setEditedFields(new Set());
    }
  };

  if (!selectedInvoice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>暂无待校对的票据</p>
        </div>
      </div>
    );
  }

  const { fields, validation } = selectedInvoice;
  const amountDiff =
    selectedInvoice.reimbursementAmount &&
    Math.abs(selectedInvoice.reimbursementAmount - fields.totalAmount) > 0.01;

  return (
    <div className="flex h-full">
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              待校对队列
            </span>
            <span className="badge badge-info">{pendingInvoices.length}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pendingInvoices.map((inv, idx) => (
            <button
              key={inv.invoiceId}
              onClick={() => {
                setSelectedInvoice(inv.invoiceId);
                setEditedFields(new Set());
              }}
              className={cn(
                "w-full text-left p-2 rounded-sm transition-all group",
                inv.invoiceId === selectedInvoice.invoiceId
                  ? "bg-primary-50 border border-primary-200"
                  : "hover:bg-slate-50 border border-transparent"
              )}
            >
              <div className="flex items-start space-x-2">
                <div className="w-12 h-16 bg-slate-100 rounded-sm overflow-hidden flex-shrink-0 border border-slate-200">
                  <img
                    src={inv.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600">
                      #{idx + 1}
                    </span>
                    <span className={cn("badge", InvoiceStatusColors[inv.status])}>
                      {InvoiceStatusLabels[inv.status]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {InvoiceTypeLabels[inv.invoiceType]}
                  </p>
                  <p className="text-xs font-mono text-slate-700 mt-0.5">
                    ¥{fields.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {inv.fields.invoiceNumber}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-slate-100">
        <div className="h-11 bg-white border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              className="btn-ghost p-1.5"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600">
              <span className="font-medium text-slate-800">
                {currentIndex + 1}
              </span>{" "}
              / {pendingInvoices.length}
            </span>
            <button
              className="btn-ghost p-1.5"
              onClick={handleNext}
              disabled={currentIndex >= pendingInvoices.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-2" />
            <span className="text-xs font-mono text-primary-600">
              {selectedInvoice.invoiceId}
            </span>
            <span className="badge badge-info">
              置信度 {(selectedInvoice.confidence * 100).toFixed(1)}%
            </span>
            {selectedInvoice.pageCount && selectedInvoice.pageCount > 1 && (
              <span className="badge badge-slate">
                <Layers className="w-3 h-3 mr-1" />
                {selectedInvoice.pageCount}页
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              className="btn-ghost p-1.5"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-600 w-12 text-center">{zoom}%</span>
            <button
              className="btn-ghost p-1.5"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button
              className="btn-ghost p-1.5"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button className="btn-ghost p-1.5">
              <Crop className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
          <div
            className="bg-white shadow-panel rounded-sm overflow-hidden"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "top center",
            }}
          >
            <img
              src={selectedInvoice.imageUrl}
              alt="票据预览"
              className="block"
              style={{ maxWidth: 600 }}
            />
          </div>
        </div>
      </div>

      <div className="w-96 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">识别字段校对</span>
            {editedFields.size > 0 && (
              <span className="text-xs text-warning-600 bg-warning-50 px-2 py-0.5 rounded-sm">
                已修改 {editedFields.size} 项
              </span>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">票据类型</label>
            <div className="flex flex-wrap gap-1">
              {invoiceTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => handleInvoiceTypeChange(type)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-sm border transition-colors",
                    selectedInvoice.invoiceType === type
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary-300"
                  )}
                >
                  {InvoiceTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {amountDiff && (
            <div className="mx-3 mt-3 p-3 bg-warning-50 border border-warning-200 rounded-sm">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-warning-700">
                    报销单金额比对差异
                  </p>
                  <p className="text-xs text-warning-600 mt-0.5">
                    报销填报 ¥{selectedInvoice.reimbursementAmount?.toFixed(2)}
                    <ArrowRight className="w-3 h-3 inline mx-1" />
                    票据金额 ¥{fields.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 space-y-3">
            {["invoiceNumber", "invoiceDate", "totalAmount", "taxAmount"].map(
              (field) => {
                const confidence = fields.fieldConfidence[field] || 0.9;
                const isLowConfidence = confidence < 0.9;
                const isEdited = editedFields.has(field);
                const value = (fields as any)[field];

                return (
                  <div key={field}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600">
                        {fieldLabels[field]}
                      </label>
                      <div className="flex items-center space-x-1.5">
                        {isEdited && (
                          <span className="text-[10px] text-success-600 bg-success-50 px-1.5 py-0.5 rounded-sm">
                            已修改
                          </span>
                        )}
                        <div className="flex items-center">
                          <div
                            className={cn(
                              "w-10 h-1 rounded-sm overflow-hidden",
                              confidence >= 0.95
                                ? "bg-success-200"
                                : confidence >= 0.85
                                ? "bg-warning-200"
                                : "bg-danger-200"
                            )}
                          >
                            <div
                              className={cn(
                                "h-full",
                                confidence >= 0.95
                                  ? "bg-success-500"
                                  : confidence >= 0.85
                                  ? "bg-warning-500"
                                  : "bg-danger-500"
                              )}
                              style={{ width: `${confidence * 100}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] ml-1 font-mono",
                              confidence >= 0.95
                                ? "text-success-600"
                                : confidence >= 0.85
                                ? "text-warning-600"
                                : "text-danger-600"
                            )}
                          >
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <input
                      type={field.includes("Amount") ? "number" : "text"}
                      value={value}
                      onChange={(e) =>
                        handleFieldChange(
                          field,
                          field.includes("Amount")
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                      className={cn(
                        "input-field text-sm font-mono",
                        isLowConfidence && !isEdited && "input-field-warning"
                      )}
                    />
                  </div>
                );
              }
            )}

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-3">
                购销双方信息
              </p>
              {["buyerName", "buyerTaxId", "sellerName", "sellerTaxId"].map(
                (field) => {
                  const confidence = fields.fieldConfidence[field] || 0.9;
                  const isLowConfidence = confidence < 0.9;
                  const isEdited = editedFields.has(field);
                  const value = (fields as any)[field];

                  return (
                    <div key={field} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-500">
                          {fieldLabels[field]}
                        </label>
                        {isEdited && (
                          <span className="text-[10px] text-success-600">
                            已修改
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        className={cn(
                          "input-field text-sm",
                          isLowConfidence && !isEdited && "input-field-warning"
                        )}
                      />
                    </div>
                  );
                }
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="mb-1">
                <label className="text-xs text-slate-500">备注</label>
              </div>
              <textarea
                value={fields.remark || ""}
                onChange={(e) => handleFieldChange("remark", e.target.value)}
                rows={2}
                className="input-field text-sm resize-none"
                placeholder="无"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button className="btn-outline flex-1">暂存</button>
            <button className="btn-primary flex-1" onClick={confirmAndNext}>
              <Check className="w-4 h-4 mr-1.5" />
              确认并下一张
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
