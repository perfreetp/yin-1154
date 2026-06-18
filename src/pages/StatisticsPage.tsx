import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  FileCheck,
  FileX,
  Download,
  Calendar,
  ChevronDown,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { useInvoiceStore } from "@/store";
import {
  mockDepartmentStats,
  mockDailyStats,
  mockReviewerStats,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  InvoiceTypeLabels,
  InvoiceStatusColors,
  InvoiceStatusLabels,
} from "@/types";

export default function StatisticsPage() {
  const { invoices, batches } = useInvoiceStore();
  const [dateRange, setDateRange] = useState("7");

  const exportToCSV = (
    data: Record<string, any>[],
    filename: string,
    headers: { key: string; label: string }[]
  ) => {
    const headerRow = headers.map((h) => `"${h.label}"`).join(",");
    const dataRows = data.map((row) =>
      headers.map((h) => {
        const val = row[h.key] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildFullReportData = () => {
    return invoices.map((inv) => {
      const batch = batches.find((b) => b.batchId === inv.batchId);
      const lastException = inv.exceptions?.[inv.exceptions.length - 1];
      return {
        批次编号: inv.batchId,
        批次名称: batch?.batchName || "-",
        所属部门: batch?.department || "-",
        票据编号: inv.invoiceId,
        发票号码: inv.fields.invoiceNumber,
        票据类型: InvoiceTypeLabels[inv.invoiceType],
        开票日期: inv.fields.invoiceDate,
        价税合计: inv.fields.totalAmount,
        税额: inv.fields.taxAmount,
        销售方: inv.fields.sellerName,
        购买方: inv.fields.buyerName,
        票据状态: InvoiceStatusLabels[inv.status],
        置信度: `${(inv.confidence * 100).toFixed(1)}%`,
        查重检测: inv.validation.duplicateCheck,
        版式校验: inv.validation.layoutCheck,
        涂改检测: inv.validation.alterationCheck,
        风险预警: inv.validation.riskWarning,
        报销比对: inv.validation.reimbursementMatch,
        验真结果: inv.validation.warnings.length > 0
          ? inv.validation.warnings.map((w) => w.message).join("; ")
          : "全部通过",
        处理人: inv.reviewer || "-",
        处理时间: inv.reviewTime || "-",
        复核结果: inv.status === "passed" ? "通过" : inv.status === "rejected" ? "已退回" : inv.status === "exception" ? "异常待处理" : "处理中",
        退回原因: lastException?.rejectReason || "-",
      };
    });
  };

  const buildBatchData = () => {
    return batches.map((batch) => {
      const batchInvoices = invoices.filter((i) => i.batchId === batch.batchId);
      const passed = batchInvoices.filter((i) => i.status === "passed").length;
      const rejected = batchInvoices.filter((i) => i.status === "rejected").length;
      const pending = batchInvoices.length - passed - rejected;
      const passRate = batchInvoices.length > 0
        ? ((passed / batchInvoices.length) * 100).toFixed(2) + "%"
        : "-";
      return {
        批次编号: batch.batchId,
        批次名称: batch.batchName,
        所属部门: batch.department,
        上传人: batch.uploader,
        上传时间: batch.uploadTime,
        票据总数: batch.totalCount,
        已通过: passed,
        已退回: rejected,
        待处理: pending,
        通过率: passRate,
        批次状态: batch.status === "completed" ? "已完成" : "处理中",
      };
    });
  };

  const buildSingleBatchData = (batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    const batchInvoices = invoices.filter((i) => i.batchId === batchId);
    return batchInvoices.map((inv) => ({
      批次编号: batch?.batchId || "-",
      批次名称: batch?.batchName || "-",
      所属部门: batch?.department || "-",
      票据编号: inv.invoiceId,
      发票号码: inv.fields.invoiceNumber,
      票据类型: InvoiceTypeLabels[inv.invoiceType],
      金额: inv.fields.totalAmount,
      销售方: inv.fields.sellerName,
      票据状态: InvoiceStatusLabels[inv.status],
      处理人: inv.reviewer || "-",
      复核结果: inv.status === "passed" ? "通过" : inv.status === "rejected" ? "已退回" : "处理中",
    }));
  };

  const reportHeaders = [
    { key: "批次编号", label: "批次编号" },
    { key: "批次名称", label: "批次名称" },
    { key: "所属部门", label: "所属部门" },
    { key: "票据编号", label: "票据编号" },
    { key: "发票号码", label: "发票号码" },
    { key: "票据类型", label: "票据类型" },
    { key: "开票日期", label: "开票日期" },
    { key: "价税合计", label: "价税合计(元)" },
    { key: "税额", label: "税额(元)" },
    { key: "销售方", label: "销售方" },
    { key: "购买方", label: "购买方" },
    { key: "票据状态", label: "票据状态" },
    { key: "置信度", label: "识别置信度" },
    { key: "查重检测", label: "查重检测" },
    { key: "版式校验", label: "版式校验" },
    { key: "涂改检测", label: "涂改检测" },
    { key: "风险预警", label: "风险预警" },
    { key: "报销比对", label: "报销比对" },
    { key: "验真结果", label: "验真结果说明" },
    { key: "处理人", label: "处理人" },
    { key: "处理时间", label: "处理时间" },
    { key: "复核结果", label: "复核结果" },
    { key: "退回原因", label: "退回原因" },
  ];

  const batchHeaders = [
    { key: "批次编号", label: "批次编号" },
    { key: "批次名称", label: "批次名称" },
    { key: "所属部门", label: "所属部门" },
    { key: "上传人", label: "上传人" },
    { key: "上传时间", label: "上传时间" },
    { key: "票据总数", label: "票据总数" },
    { key: "已通过", label: "已通过" },
    { key: "已退回", label: "已退回" },
    { key: "待处理", label: "待处理" },
    { key: "通过率", label: "通过率" },
    { key: "批次状态", label: "批次状态" },
  ];

  const totalProcessed = invoices.filter(
    (i) => i.status === "passed" || i.status === "rejected"
  ).length;
  const totalPassed = invoices.filter((i) => i.status === "passed").length;
  const totalRejected = invoices.filter((i) => i.status === "rejected").length;
  const overallPassRate =
    totalProcessed > 0 ? ((totalPassed / totalProcessed) * 100).toFixed(1) : "0";

  const typeStats = Object.entries(
    invoices.reduce((acc, inv) => {
      if (!acc[inv.invoiceType])
        acc[inv.invoiceType] = { total: 0, passed: 0 };
      acc[inv.invoiceType].total++;
      if (inv.status === "passed") acc[inv.invoiceType].passed++;
      return acc;
    }, {} as Record<string, { total: number; passed: number }>)
  );

  const maxDailyCount = Math.max(...mockDailyStats.map((d) => d.processedCount));
  const maxDeptCount = Math.max(...mockDepartmentStats.map((d) => d.totalCount));

  return (
    <div className="p-5 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
            数据统计看板
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            票据处理效率、通过率及部门分布统计
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-primary-400 appearance-none cursor-pointer"
            >
              <option value="7">近7天</option>
              <option value="30">近30天</option>
              <option value="90">近90天</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button className="btn-outline">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            筛选
          </button>
          <button
            className="btn-primary"
            onClick={() => exportToCSV(buildFullReportData(), "票据处理明细报表", reportHeaders)}
          >
            <Download className="w-4 h-4 mr-1.5" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "处理总量",
            value: totalProcessed,
            icon: FileCheck,
            color: "text-primary-600",
            bg: "bg-primary-50",
            trend: "up",
            trendValue: "+12.5%",
          },
          {
            label: "通过数量",
            value: totalPassed,
            icon: TrendingUp,
            color: "text-success-600",
            bg: "bg-success-50",
            trend: "up",
            trendValue: "+8.3%",
          },
          {
            label: "退回数量",
            value: totalRejected,
            icon: FileX,
            color: "text-danger-600",
            bg: "bg-danger-50",
            trend: "down",
            trendValue: "-3.2%",
          },
          {
            label: "整体通过率",
            value: `${overallPassRate}%`,
            icon: BarChart3,
            color: "text-warning-600",
            bg: "bg-warning-50",
            trend: "stable",
            trendValue: "持平",
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 ${stat.bg} rounded-sm flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  stat.trend === "up"
                    ? "text-success-600"
                    : stat.trend === "down"
                    ? "text-danger-600"
                    : "text-slate-500"
                )}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : stat.trend === "down" ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {stat.trendValue}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-slate-800 mt-1">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card overflow-hidden col-span-2">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                每日处理趋势
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                近7天票据处理量与通过率变化
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center">
                <span className="w-3 h-3 bg-primary-500 rounded-sm mr-1.5" />
                处理量
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-success-500 rounded-sm mr-1.5" />
                通过量
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 bg-danger-400 rounded-sm mr-1.5" />
                退回量
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-end justify-between h-52 space-x-2">
              {mockDailyStats.map((day) => {
                const processedH = (day.processedCount / maxDailyCount) * 100;
                const passedH = (day.passedCount / maxDailyCount) * 100;
                const rejectedH = (day.rejectedCount / maxDailyCount) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end justify-center space-x-1 h-44">
                      <div
                        className="w-4 bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600"
                        style={{ height: `${processedH}%` }}
                        title={`处理量: ${day.processedCount}`}
                      />
                      <div
                        className="w-4 bg-success-500 rounded-t-sm transition-all hover:bg-success-600"
                        style={{ height: `${passedH}%` }}
                        title={`通过量: ${day.passedCount}`}
                      />
                      <div
                        className="w-4 bg-danger-400 rounded-t-sm transition-all hover:bg-danger-500"
                        style={{ height: `${rejectedH}%` }}
                        title={`退回量: ${day.rejectedCount}`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{day.date}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      平均 {day.avgProcessTime}s
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">票据类型分布</h3>
            <p className="text-xs text-slate-500 mt-0.5">按类型统计处理数量</p>
          </div>
          <div className="p-5 space-y-4">
            {typeStats.map(([type, stats]) => {
              const passRate =
                stats.total > 0
                  ? ((stats.passed / stats.total) * 100).toFixed(0)
                  : "0";
              const maxTypeTotal = Math.max(...typeStats.map(([, s]) => s.total));
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-600">
                      {InvoiceTypeLabels[type as keyof typeof InvoiceTypeLabels]}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-slate-800 font-mono">
                        {stats.total}
                      </span>
                      <span className="text-[10px] text-success-600">
                        {passRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                      style={{ width: `${(stats.total / maxTypeTotal) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center">
              <Users className="w-4 h-4 mr-1.5" />
              部门通过率统计
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {mockDepartmentStats.map((dept) => {
              const barW = (dept.totalCount / maxDeptCount) * 100;
              return (
                <div key={dept.department}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">
                      {dept.department}
                    </span>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-500">
                        {dept.passedCount}/{dept.totalCount}
                      </span>
                      <span
                        className={cn(
                          "font-medium font-mono",
                          dept.passRate >= 90
                            ? "text-success-600"
                            : dept.passRate >= 80
                            ? "text-warning-600"
                            : "text-danger-600"
                        )}
                      >
                        {dept.passRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-sm overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full",
                        dept.passRate >= 90
                          ? "bg-gradient-to-r from-success-400 to-success-600"
                          : dept.passRate >= 80
                          ? "bg-gradient-to-r from-warning-400 to-warning-600"
                          : "bg-gradient-to-r from-danger-400 to-danger-600"
                      )}
                      style={{ width: `${barW}%` }}
                    />
                    <div
                      className="absolute top-0 h-full w-px bg-white/50"
                      style={{ left: `${(dept.passedCount / dept.totalCount) * barW}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center">
              <Clock className="w-4 h-4 mr-1.5" />
              录单员处理效率
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header px-5 py-2.5">录单员</th>
                  <th className="table-header px-5 py-2.5 text-right">处理量</th>
                  <th className="table-header px-5 py-2.5 text-right">平均耗时</th>
                  <th className="table-header px-5 py-2.5 text-right">通过率</th>
                  <th className="table-header px-5 py-2.5 text-right w-24">效率评级</th>
                </tr>
              </thead>
              <tbody>
                {mockReviewerStats.map((r, idx) => (
                  <tr key={r.reviewer} className="table-row">
                    <td className="table-cell px-5">
                      <div className="flex items-center">
                        <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-sm flex items-center justify-center text-xs font-medium">
                          {r.reviewer.slice(-1)}
                        </div>
                        <span className="ml-2 text-sm text-slate-700">
                          {r.reviewer}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell px-5 text-right font-mono text-slate-800">
                      {r.processedCount}
                    </td>
                    <td className="table-cell px-5 text-right">
                      <span
                        className={cn(
                          "font-mono",
                          r.avgProcessTime <= 38
                            ? "text-success-600"
                            : r.avgProcessTime <= 42
                            ? "text-warning-600"
                            : "text-danger-600"
                        )}
                      >
                        {r.avgProcessTime}s
                      </span>
                    </td>
                    <td className="table-cell px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              r.passRate >= 90
                                ? "bg-success-500"
                                : r.passRate >= 85
                                ? "bg-warning-500"
                                : "bg-danger-500"
                            )}
                            style={{ width: `${r.passRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-700 w-12 text-right">
                          {r.passRate}%
                        </span>
                      </div>
                    </td>
                    <td className="table-cell px-5 text-right">
                      <span
                        className={cn(
                          "badge",
                          idx === 0
                            ? "badge-success"
                            : idx <= 2
                            ? "badge-info"
                            : "badge-warning"
                        )}
                      >
                        {idx === 0 ? "优秀" : idx <= 2 ? "良好" : "待提升"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              批次处理明细
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              各批次票据处理进度与结果，支持导出给记账岗位
            </p>
          </div>
          <button
            className="btn-outline text-xs"
            onClick={() => exportToCSV(buildBatchData(), "批次处理汇总表", batchHeaders)}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            导出当前结果
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header px-5 py-2.5 w-10">
                  <input type="checkbox" className="rounded-sm border-slate-300" />
                </th>
                <th className="table-header px-5 py-2.5">批次编号</th>
                <th className="table-header px-5 py-2.5">批次名称</th>
                <th className="table-header px-5 py-2.5">部门</th>
                <th className="table-header px-5 py-2.5 text-right">总数</th>
                <th className="table-header px-5 py-2.5 text-right">通过</th>
                <th className="table-header px-5 py-2.5 text-right">退回</th>
                <th className="table-header px-5 py-2.5 text-right">待处理</th>
                <th className="table-header px-5 py-2.5 text-right w-32">通过率</th>
                <th className="table-header px-5 py-2.5 text-right w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {batches.length > 0
                ? batches.map((batch) => {
                    const batchInvoices = invoices.filter(
                      (i) => i.batchId === batch.batchId
                    );
                    const passed = batchInvoices.filter(
                      (i) => i.status === "passed"
                    ).length;
                    const rejected = batchInvoices.filter(
                      (i) => i.status === "rejected"
                    ).length;
                    const pending = batchInvoices.length - passed - rejected;
                    const rate =
                      batchInvoices.length > 0
                        ? Math.round((passed / batchInvoices.length) * 100)
                        : 0;
                    return (
                      <tr key={batch.batchId} className="table-row">
                        <td className="table-cell px-5">
                          <input
                            type="checkbox"
                            className="rounded-sm border-slate-300"
                          />
                        </td>
                        <td className="table-cell px-5 font-mono text-xs text-primary-600">
                          {batch.batchId}
                        </td>
                        <td className="table-cell px-5 text-slate-700">
                          {batch.batchName}
                        </td>
                        <td className="table-cell px-5">{batch.department}</td>
                        <td className="table-cell px-5 text-right font-mono text-slate-800">
                          {batch.totalCount}
                        </td>
                        <td className="table-cell px-5 text-right font-mono text-success-600">
                          {passed}
                        </td>
                        <td className="table-cell px-5 text-right font-mono text-danger-600">
                          {rejected}
                        </td>
                        <td className="table-cell px-5 text-right font-mono text-slate-600">
                          {pending}
                        </td>
                        <td className="table-cell px-5">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  rate >= 90
                                    ? "bg-success-500"
                                    : rate >= 80
                                    ? "bg-warning-500"
                                    : "bg-danger-500"
                                )}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-xs font-mono font-medium w-12 text-right",
                                rate >= 90
                                  ? "text-success-600"
                                  : rate >= 80
                                  ? "text-warning-600"
                                  : "text-danger-600"
                              )}
                            >
                              {rate}%
                            </span>
                          </div>
                        </td>
                        <td className="table-cell px-5 text-right">
                          <button
                            className="btn-ghost text-xs"
                            onClick={() =>
                              exportToCSV(
                                buildSingleBatchData(batch.batchId),
                                `批次_${batch.batchId}_明细`,
                                [
                                  { key: "批次编号", label: "批次编号" },
                                  { key: "批次名称", label: "批次名称" },
                                  { key: "所属部门", label: "所属部门" },
                                  { key: "票据编号", label: "票据编号" },
                                  { key: "发票号码", label: "发票号码" },
                                  { key: "票据类型", label: "票据类型" },
                                  { key: "金额", label: "金额(元)" },
                                  { key: "销售方", label: "销售方" },
                                  { key: "票据状态", label: "票据状态" },
                                  { key: "处理人", label: "处理人" },
                                  { key: "复核结果", label: "复核结果" },
                                ]
                              )
                            }
                          >
                            <Download className="w-3 h-3 mr-1" />
                            导出
                          </button>
                        </td>
                      </tr>
                    );
                  })
                : mockDepartmentStats.slice(0, 5).map((dept, idx) => {
                    const rate = dept.passRate;
                    const batchId = `BATCH-202606${10 + idx}-00${idx + 1}`;
                    return (
                      <tr key={dept.department + idx} className="table-row">
                        <td className="table-cell px-5">
                          <input type="checkbox" className="rounded-sm border-slate-300" />
                        </td>
                        <td className="table-cell px-5 font-mono text-xs text-primary-600">
                          {batchId}
                        </td>
                        <td className="table-cell px-5 text-slate-700">
                          2026年6月第{idx + 1}周-{dept.department}报销
                        </td>
                        <td className="table-cell px-5">{dept.department}</td>
                        <td className="table-cell px-5 text-right font-mono text-slate-800">
                          {dept.totalCount}
                        </td>
                        <td className="table-cell px-5 text-right font-mono text-success-600">
                          {dept.passedCount}
                        </td>
                        <td className="table-cell px-5 text-right font-mono text-danger-600">
                          {dept.rejectedCount}
                        </td>
                        <td className="table-cell px-5 text-right font-mono text-warning-600">
                          {dept.pendingCount}
                        </td>
                        <td className="table-cell px-5">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  rate >= 90
                                    ? "bg-success-500"
                                    : rate >= 80
                                    ? "bg-warning-500"
                                    : "bg-danger-500"
                                )}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-xs font-mono font-medium w-12 text-right",
                                rate >= 90
                                  ? "text-success-600"
                                  : rate >= 80
                                  ? "text-warning-600"
                                  : "text-danger-600"
                              )}
                            >
                              {rate}%
                            </span>
                          </div>
                        </td>
                        <td className="table-cell px-5 text-right">
                          <button
                            className="btn-ghost text-xs"
                            onClick={() =>
                              exportToCSV(
                                buildSingleBatchData(batchId),
                                `批次_${batchId}_明细`,
                                [
                                  { key: "批次编号", label: "批次编号" },
                                  { key: "批次名称", label: "批次名称" },
                                  { key: "所属部门", label: "所属部门" },
                                  { key: "票据编号", label: "票据编号" },
                                  { key: "发票号码", label: "发票号码" },
                                  { key: "票据类型", label: "票据类型" },
                                  { key: "金额", label: "金额(元)" },
                                  { key: "销售方", label: "销售方" },
                                  { key: "票据状态", label: "票据状态" },
                                  { key: "处理人", label: "处理人" },
                                  { key: "复核结果", label: "复核结果" },
                                ]
                              )
                            }
                          >
                            <Download className="w-3 h-3 mr-1" />
                            导出
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
