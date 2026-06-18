import { useLocation } from "react-router-dom";
import { Bell, Search, ChevronRight, Home } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/upload": {
    title: "上传台",
    subtitle: "批量导入扫描件与拍照件，管理上传批次",
  },
  "/verify": {
    title: "识别校对台",
    subtitle: "自动OCR识别，人工校对关键字段",
  },
  "/validate": {
    title: "验真台",
    subtitle: "查重验真、风险预警、合规校验",
  },
  "/exceptions": {
    title: "异常池",
    subtitle: "处理异常单据，退回原因登记",
  },
  "/settings": {
    title: "规则配置",
    subtitle: "校验规则、退回模板、识别参数设置",
  },
  "/statistics": {
    title: "统计页",
    subtitle: "通过率统计、处理效率分析、数据导出",
  },
};

export default function TopNav() {
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || {
    title: "工作台",
    subtitle: "",
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 flex-shrink-0 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center min-w-0">
        <div className="flex items-center text-xs text-slate-400">
          <Home className="w-3.5 h-3.5" />
          <ChevronRight className="w-3.5 h-3.5 mx-1" />
          <span className="text-slate-600">{pageInfo.title}</span>
        </div>
        <div className="ml-6 pl-6 border-l border-slate-200">
          <h1 className="text-base font-semibold text-slate-800">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-slate-400">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="ml-auto flex items-center space-x-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索发票号、批次号..."
            className="w-56 pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
          />
        </div>

        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="text-xs text-slate-500">
          <span className="text-success-600 font-medium">28</span> 待处理 /
          <span className="ml-1 text-slate-700 font-medium">156</span> 今日已处理
        </div>
      </div>
    </header>
  );
}
