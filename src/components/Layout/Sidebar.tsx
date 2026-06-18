import { cn } from "@/lib/utils";
import {
  Upload,
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  Settings,
  BarChart3,
  Receipt,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { path: "/upload", label: "上传台", icon: Upload },
  { path: "/verify", label: "识别校对台", icon: FileCheck2 },
  { path: "/validate", label: "验真台", icon: ShieldCheck },
  { path: "/exceptions", label: "异常池", icon: AlertTriangle },
  { path: "/settings", label: "规则配置", icon: Settings },
  { path: "/statistics", label: "统计页", icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 bg-primary-700 text-white flex flex-col h-screen flex-shrink-0">
      <div className="h-14 flex items-center px-5 border-b border-primary-800">
        <Receipt className="w-6 h-6 text-primary-200" />
        <span className="ml-2.5 font-semibold text-base tracking-wide">
          票据验真工作台
        </span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm rounded-sm transition-colors group",
                isActive
                  ? "bg-primary-600 text-white shadow-inner"
                  : "text-primary-100 hover:bg-primary-600/60 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-white" : "text-primary-300 group-hover:text-white"
                )}
              />
              <span className="ml-3 font-medium">{item.label}</span>
              {item.path === "/exceptions" && (
                <span className="ml-auto bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-sm font-semibold">
                  12
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-primary-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-sm bg-primary-500 flex items-center justify-center text-sm font-semibold">
            录
          </div>
          <div className="ml-2.5 min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">录单员A</p>
            <p className="text-xs text-primary-300 truncate">财务共享中心</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
