import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FolderPlus,
  FileImage,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Eye,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Inbox,
  Sparkles,
  X,
  ArrowRight,
  Scan,
} from "lucide-react";
import { useInvoiceStore } from "@/store";
import {
  InvoiceStatusLabels,
  InvoiceStatusColors,
  InvoiceTypeLabels,
  InvoiceType,
  type Invoice,
  type InvoiceBatch,
} from "@/types";
import { cn } from "@/lib/utils";

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "recognizing" | "success" | "failed";
}

export default function UploadPage() {
  const {
    batches,
    invoices,
    addInvoices,
    addBatch,
    setSelectedInvoice,
    setSelectedBatch,
    updateBatchProgress,
  } = useInvoiceStore();
  const [isDragging, setIsDragging] = useState(false);
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const navigate = useNavigate();

  const generateInvoiceImage = (seed: number, type: string) => {
    const colors: Record<string, string> = {
      vat_special: "245,158,11",
      vat_normal: "59,130,246",
      receipt: "16,185,129",
      itinerary: "139,92,246",
      reimbursement: "239,68,68",
    };
    const color = colors[type] || "100,116,139";
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560' viewBox='0 0 400 560'>
        <rect width='400' height='560' fill='white'/>
        <rect x='20' y='20' width='360' height='520' fill='rgb(${color})' fill-opacity='0.08' stroke='rgb(${color})' stroke-opacity='0.3' stroke-width='1'/>
        <rect x='40' y='50' width='320' height='60' fill='rgb(${color})' fill-opacity='0.12'/>
        <text x='200' y='88' text-anchor='middle' font-family='sans-serif' font-size='18' font-weight='bold' fill='rgb(${color})'>Invoice #${seed}</text>
        <line x1='40' y1='130' x2='360' y2='130' stroke='rgb(${color})' stroke-opacity='0.2'/>
        <text x='50' y='160' font-family='sans-serif' font-size='12' fill='#475569'>发票号码: ${seed.toString().padStart(8, "0")}</text>
        <text x='50' y='185' font-family='sans-serif' font-size='12' fill='#475569'>开票日期: 2026-06-${(seed % 28 || 1).toString().padStart(2, "0")}</text>
        <text x='50' y='210' font-family='sans-serif' font-size='12' fill='#475569'>购买方: 某某科技有限公司</text>
        <text x='50' y='235' font-family='sans-serif' font-size='12' fill='#475569'>销售方: 供应商${seed}有限公司</text>
        <rect x='40' y='260' width='320' height='180' fill='#F8FAFC' stroke='#E2E8F0' stroke-width='1'/>
        <text x='50' y='285' font-family='sans-serif' font-size='11' fill='#64748B'>项目名称</text>
        <text x='280' y='285' font-family='sans-serif' font-size='11' fill='#64748B'>金额</text>
        <text x='50' y='320' font-family='sans-serif' font-size='12' fill='#334155'>咨询服务费</text>
        <text x='280' y='320' font-family='sans-serif' font-size='12' fill='#334155'>¥${(seed * 128.5).toFixed(2)}</text>
        <text x='200' y='425' text-anchor='end' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgb(${color})'>价税合计: ¥${(seed * 203.28).toFixed(2)}</text>
      </svg>`
    )}`;
  };

  const createInvoiceFromUpload = (
    fileId: string,
    fileName: string,
    batchId: string,
    seed: number
  ): Invoice => {
    const types: InvoiceType[] = [
      "vat_special",
      "vat_normal",
      "receipt",
      "itinerary",
      "reimbursement",
    ];
    const type = types[seed % 5];
    const imageUrl = generateInvoiceImage(seed, type);
    const amount = Number((seed * 203.28).toFixed(2));
    const tax = Number((seed * 18.48).toFixed(2));

    return {
      invoiceId: `INV-${Date.now()}-${seed.toString().padStart(4, "0")}`,
      batchId,
      imageUrl,
      thumbnailUrl: imageUrl,
      invoiceType: type,
      status: "pending_review",
      confidence: 0.78 + Math.random() * 0.2,
      fields: {
        invoiceNumber: (seed * 17).toString().padStart(8, "0"),
        invoiceDate: `2026-06-${(seed % 28 || 1).toString().padStart(2, "0")}`,
        totalAmount: amount,
        taxAmount: tax,
        buyerName: "某某科技有限公司",
        buyerTaxId: `91110000MA${(seed * 13579).toString().padStart(10, "0").slice(0, 10)}`,
        sellerName: `供应商${seed}有限公司`,
        sellerTaxId: `91310000MA${(seed * 24680).toString().padStart(10, "0").slice(0, 10)}`,
        remark: fileName,
        fieldConfidence: {
          invoiceNumber: 0.97,
          invoiceDate: 0.94,
          totalAmount: 0.96,
          taxAmount: 0.93,
          buyerName: 0.91,
          sellerName: 0.92,
        },
      },
      validation: {
        duplicateCheck: "passed",
        layoutCheck: "passed",
        amountCheck: "passed",
        riskWarning: "passed",
        reimbursementMatch: "passed",
        alterationCheck: "passed",
        overallStatus: "pending_review",
        warnings: [],
      },
      reimbursementAmount: amount,
      pageCount: 1,
    };
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    simulateUpload(files);
  }, []);

  const simulateUpload = (files: File[]) => {
    const timestamp = Date.now();
    const newBatchId = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 900 + 100)}`;
    setCurrentBatchId(newBatchId);

    const newBatch: InvoiceBatch = {
      batchId: newBatchId,
      batchName: `手动上传-${new Date().toLocaleDateString("zh-CN")}`,
      uploader: "当前录单员",
      uploadTime: new Date().toLocaleString("zh-CN"),
      totalCount: files.length,
      processedCount: 0,
      department: "财务共享中心",
      status: "processing",
    };
    addBatch(newBatch);

    const newFiles: UploadingFile[] = files.map((file, idx) => ({
      id: `file-${timestamp}-${idx}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading",
    }));
    setUploadingFiles((prev) => [...prev, ...newFiles]);

    const createdInvoices: Invoice[] = [];
    let successCount = 0;
    let failCount = 0;

    newFiles.forEach((f, idx) => {
      let progress = 0;
      const seed = Math.floor(Math.random() * 9000 + 1000);
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadingFiles((prev) =>
            prev.map((pf) =>
              pf.id === f.id ? { ...pf, progress: 100, status: "recognizing" } : pf
            )
          );
          setTimeout(() => {
            const isSuccess = Math.random() > 0.1;
            setUploadingFiles((prev) =>
              prev.map((pf) =>
                pf.id === f.id
                  ? { ...pf, status: isSuccess ? "success" : "failed" }
                  : pf
              )
            );
            if (isSuccess) {
              const newInvoice = createInvoiceFromUpload(
                f.id,
                f.name,
                newBatchId,
                seed + idx
              );
              createdInvoices.push(newInvoice);
              addInvoices([newInvoice]);
              if (createdInvoices.length === 1) {
                setSelectedInvoice(newInvoice.invoiceId);
              }
              successCount++;
            } else {
              failCount++;
            }
            updateBatchProgress(newBatchId, isSuccess ? 1 : 0, isSuccess ? 0 : 1);
          }, 1500 + idx * 300);
        } else {
          setUploadingFiles((prev) =>
            prev.map((pf) => (pf.id === f.id ? { ...pf, progress } : pf))
          );
        }
      }, 200 + idx * 100);
    });
  };

  const filteredBatches = batches;

  const getBatchInvoices = (batchId: string) =>
    invoices.filter((inv) => inv.batchId === batchId);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">票据批量上传</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            支持 PDF、JPG、PNG、TIFF 格式，单文件不超过 20MB
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-outline">
            <Filter className="w-4 h-4 mr-1.5" />
            筛选
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderPlus className="w-4 h-4 mr-1.5" />
            选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
            className="hidden"
            onChange={(e) => simulateUpload(Array.from(e.target.files || []))}
          />
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "card p-10 cursor-pointer transition-all duration-200 border-2 border-dashed",
          isDragging
            ? "border-primary-500 bg-primary-50/60"
            : "border-slate-300 hover:border-primary-400 hover:bg-slate-50"
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={cn(
              "w-16 h-16 rounded-sm flex items-center justify-center mb-4 transition-colors",
              isDragging ? "bg-primary-100" : "bg-slate-100"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8",
                isDragging ? "text-primary-600 animate-bounce" : "text-slate-400"
              )}
            />
          </div>
          <p className="text-base font-medium text-slate-700 mb-1">
            {isDragging ? "释放以上传文件" : "拖拽票据文件到此处，或点击选择"}
          </p>
          <p className="text-sm text-slate-400 mb-3">
            批量上传扫描件、拍照件均可自动识别裁边
          </p>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="inline-flex items-center bg-slate-50 px-2 py-1 rounded-sm border border-slate-200">
              <FileImage className="w-3 h-3 mr-1" /> PDF
            </span>
            <span className="inline-flex items-center bg-slate-50 px-2 py-1 rounded-sm border border-slate-200">
              <FileImage className="w-3 h-3 mr-1" /> JPG
            </span>
            <span className="inline-flex items-center bg-slate-50 px-2 py-1 rounded-sm border border-slate-200">
              <FileImage className="w-3 h-3 mr-1" /> PNG
            </span>
            <span className="inline-flex items-center bg-slate-50 px-2 py-1 rounded-sm border border-slate-200">
              <FileText className="w-3 h-3 mr-1" /> TIFF
            </span>
          </div>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-slate-700">
                上传队列 ({uploadingFiles.length})
              </span>
            </div>
            <button
              className="btn-ghost text-xs"
              onClick={() =>
                setUploadingFiles(uploadingFiles.filter((f) => f.status === "uploading" || f.status === "recognizing"))
              }
            >
              清除已完成
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {uploadingFiles.map((file) => (
              <div
                key={file.id}
                className="px-4 py-3 flex items-center hover:bg-slate-50 transition-colors"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-sm flex items-center justify-center mr-3 flex-shrink-0",
                    file.status === "success"
                      ? "bg-success-50"
                      : file.status === "failed"
                      ? "bg-danger-50"
                      : "bg-primary-50"
                  )}
                >
                  {file.status === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-success-600" />
                  ) : file.status === "failed" ? (
                    <XCircle className="w-5 h-5 text-danger-600" />
                  ) : file.status === "recognizing" ? (
                    <Sparkles className="w-5 h-5 text-primary-600 animate-pulse" />
                  ) : (
                    <FileImage className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center mt-1 space-x-3">
                    <span className="text-xs text-slate-400">
                      {formatSize(file.size)}
                    </span>
                    {file.status === "uploading" && (
                      <div className="flex-1 max-w-xs">
                        <div className="h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-primary-500 transition-all duration-200"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        file.status === "success"
                          ? "text-success-600"
                          : file.status === "failed"
                          ? "text-danger-600"
                          : file.status === "recognizing"
                          ? "text-primary-600"
                          : "text-slate-500"
                      )}
                    >
                      {file.status === "uploading"
                        ? `上传中 ${Math.round(file.progress)}%`
                        : file.status === "recognizing"
                        ? "AI识别中..."
                        : file.status === "success"
                        ? "识别完成"
                        : "识别失败"}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex items-center space-x-1">
                  {file.status === "failed" && (
                    <button className="btn-ghost p-1.5" title="重新上传">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button className="btn-ghost p-1.5" title="移除">
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-slate-500 mr-2" />
            <span className="text-sm font-medium text-slate-700">
              上传批次记录
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-slate-500">
              共 <span className="font-medium text-slate-700">{batches.length}</span> 个批次，
              <span className="font-medium text-slate-700 ml-1">
                {batches.reduce((a, b) => a + b.totalCount, 0)}
              </span>{" "}
              张票据
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header px-4 py-2.5 w-10">
                  <input type="checkbox" className="rounded-sm border-slate-300" />
                </th>
                <th className="table-header px-4 py-2.5">批次编号</th>
                <th className="table-header px-4 py-2.5">批次名称</th>
                <th className="table-header px-4 py-2.5">所属部门</th>
                <th className="table-header px-4 py-2.5">上传人</th>
                <th className="table-header px-4 py-2.5">上传时间</th>
                <th className="table-header px-4 py-2.5 w-40">处理进度</th>
                <th className="table-header px-4 py-2.5 w-24">状态</th>
                <th className="table-header px-4 py-2.5 w-24 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => {
                const batchInvoices = getBatchInvoices(batch.batchId);
                const progress = batch.totalCount > 0 ? Math.round((batch.processedCount / batch.totalCount) * 100) : 0;
                return (
                  <tr key={batch.batchId} className="table-row">
                    <td className="table-cell px-4">
                      <input type="checkbox" className="rounded-sm border-slate-300" />
                    </td>
                    <td className="table-cell px-4 font-mono text-xs text-primary-600">
                      {batch.batchId}
                    </td>
                    <td className="table-cell px-4 font-medium text-slate-700">
                      {batch.batchName}
                    </td>
                    <td className="table-cell px-4">{batch.department}</td>
                    <td className="table-cell px-4">{batch.uploader}</td>
                    <td className="table-cell px-4 text-slate-500">
                      {batch.uploadTime}
                    </td>
                    <td className="table-cell px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-300",
                              progress === 100 ? "bg-success-500" : "bg-primary-500"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-10 text-right">
                          {batch.processedCount}/{batch.totalCount}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell px-4">
                      <span
                        className={cn(
                          "badge",
                          batch.status === "completed"
                            ? "badge-success"
                            : "badge-info"
                        )}
                      >
                        {batch.status === "completed" ? "已完成" : "处理中"}
                      </span>
                    </td>
                    <td className="table-cell px-4 text-right">
                      <div className="flex items-center justify-end space-x-0.5">
                        <button
                          className="btn-ghost p-1.5"
                          title="查看详情"
                          onClick={() => setDetailBatchId(batch.batchId)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="btn-ghost p-1.5" title="删除">
                          <Trash2 className="w-4 h-4 text-slate-400" />
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

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "待校对",
            count: invoices.filter((i) => i.status === "pending_review").length,
            icon: Clock,
            color: "text-primary-600",
            bg: "bg-primary-50",
          },
          {
            label: "已通过",
            count: invoices.filter((i) => i.status === "passed").length,
            icon: CheckCircle2,
            color: "text-success-600",
            bg: "bg-success-50",
          },
          {
            label: "异常/退回",
            count: invoices.filter(
              (i) => i.status === "exception" || i.status === "rejected"
            ).length,
            icon: XCircle,
            color: "text-danger-600",
            bg: "bg-danger-50",
          },
          {
            label: "票据总数",
            count: invoices.length,
            icon: Inbox,
            color: "text-slate-600",
            bg: "bg-slate-100",
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center">
            <div className={`w-10 h-10 ${stat.bg} rounded-sm flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="ml-3">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-xl font-semibold text-slate-800 mt-0.5">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {detailBatchId && (() => {
        const batch = batches.find((b) => b.batchId === detailBatchId);
        const batchInvoices = getBatchInvoices(detailBatchId);
        const passedCount = batchInvoices.filter((i) => i.status === "passed").length;
        const pendingCount = batchInvoices.filter(
          (i) => i.status === "pending_review" || i.status === "reviewing"
        ).length;
        const exceptionCount = batchInvoices.filter(
          (i) => i.status === "exception" || i.status === "rejected"
        ).length;
        const passRate =
          batchInvoices.length > 0
            ? ((passedCount / batchInvoices.length) * 100).toFixed(1)
            : "0";

        if (!batch) return null;

        return (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-sm shadow-lg w-[900px] max-h-[85vh] flex flex-col animate-slide-up">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 flex items-center">
                    <Scan className="w-5 h-5 mr-2 text-primary-600" />
                    批次详情
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {batch.batchId} · {batch.batchName}
                  </p>
                </div>
                <button
                  className="btn-ghost p-1.5"
                  onClick={() => setDetailBatchId(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-6 flex-shrink-0">
                <div>
                  <p className="text-xs text-slate-500">所属部门</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {batch.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">上传人</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {batch.uploader}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">上传时间</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {batch.uploadTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">票据总数</p>
                  <p className="text-sm font-mono font-semibold text-slate-800 mt-0.5">
                    {batch.totalCount} 张
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">通过率</p>
                  <p className="text-sm font-mono font-semibold text-success-600 mt-0.5">
                    {passRate}%
                  </p>
                </div>
                <div className="ml-auto">
                  <span
                    className={cn(
                      "badge",
                      batch.status === "completed" ? "badge-success" : "badge-info"
                    )}
                  >
                    {batch.status === "completed" ? "已完成" : "处理中"}
                  </span>
                </div>
              </div>

              <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center space-x-4 text-xs flex-shrink-0">
                <span className="text-slate-500">
                  待校对: <span className="font-medium text-primary-600">{pendingCount}</span>
                </span>
                <span className="text-slate-500">
                  已通过: <span className="font-medium text-success-600">{passedCount}</span>
                </span>
                <span className="text-slate-500">
                  异常/退回:{" "}
                  <span className="font-medium text-danger-600">{exceptionCount}</span>
                </span>
                <div className="ml-auto flex items-center space-x-2">
                  <button
                    className="btn-primary text-xs"
                    onClick={() => {
                      setSelectedBatch(detailBatchId);
                      setDetailBatchId(null);
                      navigate("/verify");
                    }}
                  >
                    <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                    去识别校对台处理此批次
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr>
                      <th className="table-header px-4 py-2.5 text-left w-14">
                        缩略图
                      </th>
                      <th className="table-header px-4 py-2.5 text-left">
                        票据编号
                      </th>
                      <th className="table-header px-4 py-2.5 text-left">
                        发票号码
                      </th>
                      <th className="table-header px-4 py-2.5 text-left">
                        类型
                      </th>
                      <th className="table-header px-4 py-2.5 text-right">
                        金额
                      </th>
                      <th className="table-header px-4 py-2.5 text-left">
                        销售方
                      </th>
                      <th className="table-header px-4 py-2.5 text-center">
                        状态
                      </th>
                      <th className="table-header px-4 py-2.5 text-center">
                        置信度
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchInvoices.length > 0 ? (
                      batchInvoices.map((inv) => (
                        <tr
                          key={inv.invoiceId}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedInvoice(inv.invoiceId);
                            setDetailBatchId(null);
                            window.location.hash = "#/verify";
                          }}
                        >
                          <td className="px-4 py-2.5">
                            <img
                              src={inv.thumbnailUrl}
                              alt="票据"
                              className="w-10 h-14 object-cover rounded-sm border border-slate-200"
                            />
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-primary-600">
                            {inv.invoiceId}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 font-mono">
                            {inv.fields.invoiceNumber}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">
                            {InvoiceTypeLabels[inv.invoiceType]}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-mono text-right text-slate-800 font-medium">
                            ¥{inv.fields.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-600 max-w-[140px] truncate">
                            {inv.fields.sellerName}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={cn(
                                "badge badge-sm",
                                InvoiceStatusColors[inv.status]
                              )}
                            >
                              {InvoiceStatusLabels[inv.status]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-sm font-mono text-slate-600">
                            {(inv.confidence * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-slate-400 text-sm"
                        >
                          <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          暂无票据数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
