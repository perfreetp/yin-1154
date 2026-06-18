import { useState } from "react";
import {
  Settings,
  Shield,
  FileText,
  Scan,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Check,
  RotateCcw,
  Copy,
  AlertTriangle,
  DollarSign,
  Store,
  Eye,
} from "lucide-react";
import { useSettingsStore } from "@/store";
import type { RejectTemplate } from "@/types";
import { cn } from "@/lib/utils";

type TabKey = "validation" | "templates" | "recognition";

export default function SettingsPage() {
  const {
    validationRules,
    updateValidationRules,
    rejectTemplates,
    addRejectTemplate,
    updateRejectTemplate,
    deleteRejectTemplate,
    toggleTemplate,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<TabKey>("validation");
  const [editingTemplate, setEditingTemplate] = useState<RejectTemplate | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    category: "票面问题",
    content: "",
    enabled: true,
  });
  const [rulesChanged, setRulesChanged] = useState(false);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "validation", label: "校验规则", icon: Shield },
    { key: "templates", label: "退回模板", icon: FileText },
    { key: "recognition", label: "识别参数", icon: Scan },
  ];

  const handleSaveRules = () => {
    setRulesChanged(false);
  };

  const handleAddTemplate = () => {
    if (newTemplate.content.trim()) {
      addRejectTemplate(newTemplate);
      setNewTemplate({ category: "票面问题", content: "", enabled: true });
      setIsAddingTemplate(false);
    }
  };

  const handleUpdateTemplate = () => {
    if (editingTemplate) {
      updateRejectTemplate(editingTemplate.templateId, editingTemplate);
      setEditingTemplate(null);
    }
  };

  const groupedTemplates = rejectTemplates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, RejectTemplate[]>);

  return (
    <div className="p-5 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary-600" />
            规则配置中心
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            配置票据验真规则、退回原因模板和识别参数
          </p>
        </div>
        {(rulesChanged || editingTemplate || isAddingTemplate) && (
          <div className="flex items-center space-x-2">
            <button
              className="btn-outline"
              onClick={() => {
                setRulesChanged(false);
                setEditingTemplate(null);
                setIsAddingTemplate(false);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              重置
            </button>
            <button className="btn-primary" onClick={handleSaveRules}>
              <Save className="w-4 h-4 mr-1.5" />
              保存配置
            </button>
          </div>
        )}
      </div>

      <div className="flex space-x-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center",
              activeTab === tab.key
                ? "text-primary-600 border-primary-600"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4 mr-1.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "validation" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5 space-y-5">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-primary-50 rounded-sm flex items-center justify-center">
                <Copy className="w-5 h-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  查重检测规则
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  防止同一张发票重复报销
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-slate-700">启用重复报销检测</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    检测历史数据库中相同发票号码的报销记录
                  </p>
                </div>
                <button
                  onClick={() => {
                    updateValidationRules({
                      duplicateCheckEnabled: !validationRules.duplicateCheckEnabled,
                    });
                    setRulesChanged(true);
                  }}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    validationRules.duplicateCheckEnabled
                      ? "bg-primary-600"
                      : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-sm shadow transition-all",
                      validationRules.duplicateCheckEnabled
                        ? "left-[22px]"
                        : "left-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-5">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-warning-50 rounded-sm flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  风险预警规则
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  连号票、同商户集中报销等风险检测
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-700">连号票预警阈值</label>
                  <span className="text-sm font-mono font-medium text-primary-600">
                    {validationRules.consecutiveInvoiceThreshold} 张
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={validationRules.consecutiveInvoiceThreshold}
                  onChange={(e) => {
                    updateValidationRules({
                      consecutiveInvoiceThreshold: Number(e.target.value),
                    });
                    setRulesChanged(true);
                  }}
                  className="w-full accent-primary-600"
                />
                <p className="text-xs text-slate-500 mt-1">
                  同批次内连续发票号码达到该数量时触发预警
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-700">
                    <Store className="w-3.5 h-3.5 inline mr-1" />
                    同商户集中报销阈值
                  </label>
                  <span className="text-sm font-mono font-medium text-primary-600">
                    {validationRules.sameMerchantThreshold} 张/日
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={validationRules.sameMerchantThreshold}
                  onChange={(e) => {
                    updateValidationRules({
                      sameMerchantThreshold: Number(e.target.value),
                    });
                    setRulesChanged(true);
                  }}
                  className="w-full accent-primary-600"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-5">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-danger-50 rounded-sm flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-danger-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  金额校验规则
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  报销单金额与票据金额比对规则
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-700">
                    允许金额偏差阈值
                  </label>
                  <span className="text-sm font-mono font-medium text-primary-600">
                    ±{validationRules.amountDeviationThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={validationRules.amountDeviationThreshold}
                  onChange={(e) => {
                    updateValidationRules({
                      amountDeviationThreshold: Number(e.target.value),
                    });
                    setRulesChanged(true);
                  }}
                  className="w-full accent-primary-600"
                />
                <p className="text-xs text-slate-500 mt-1">
                  超过该偏差比例时标记为金额不符
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-5">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-success-50 rounded-sm flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-success-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  涂改检测规则
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  检测票据像素异常区域，识别潜在涂改痕迹
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-slate-700">启用涂改痕迹检测</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  对金额、日期等关键字段区域进行像素级分析
                </p>
              </div>
              <button
                onClick={() => {
                  updateValidationRules({
                    alterationCheckEnabled: !validationRules.alterationCheckEnabled,
                  });
                  setRulesChanged(true);
                }}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  validationRules.alterationCheckEnabled
                    ? "bg-primary-600"
                    : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-sm shadow transition-all",
                    validationRules.alterationCheckEnabled
                      ? "left-[22px]"
                      : "left-0.5"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              共 {rejectTemplates.length} 个模板，启用中{" "}
              {rejectTemplates.filter((t) => t.enabled).length} 个
            </p>
            <button
              className="btn-primary"
              onClick={() => setIsAddingTemplate(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              新增模板
            </button>
          </div>

          {isAddingTemplate && (
            <div className="card p-4 border-primary-300 bg-primary-50/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-700">新增退回模板</h4>
                <button
                  className="btn-ghost p-1"
                  onClick={() => setIsAddingTemplate(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">分类</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, category: e.target.value })
                    }
                    className="input-field text-sm w-48"
                  >
                    <option>票面问题</option>
                    <option>重复报销</option>
                    <option>信息不符</option>
                    <option>版式异常</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    模板内容
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, content: e.target.value })
                    }
                    rows={3}
                    className="input-field text-sm resize-none"
                    placeholder="请输入退回原因模板内容..."
                  />
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <button
                    className="btn-outline text-xs"
                    onClick={() => setIsAddingTemplate(false)}
                  >
                    取消
                  </button>
                  <button
                    className="btn-primary text-xs"
                    onClick={handleAddTemplate}
                    disabled={!newTemplate.content.trim()}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    确认添加
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700">
                    {category}
                    <span className="text-xs text-slate-400 ml-2">
                      ({templates.length} 个模板)
                    </span>
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {templates.map((template) => (
                    <div
                      key={template.templateId}
                      className={cn(
                        "px-4 py-3 flex items-start",
                        !template.enabled && "bg-slate-50 opacity-60"
                      )}
                    >
                      <button
                        onClick={() => toggleTemplate(template.templateId)}
                        className={cn(
                          "w-9 h-5 rounded-full transition-colors relative flex-shrink-0 mt-0.5",
                          template.enabled ? "bg-primary-600" : "bg-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-sm shadow transition-all",
                            template.enabled ? "left-[18px]" : "left-0.5"
                          )}
                        />
                      </button>
                      <div className="ml-3 flex-1 min-w-0">
                        {editingTemplate?.templateId === template.templateId ? (
                          <div className="space-y-2">
                            <select
                              value={editingTemplate.category}
                              onChange={(e) =>
                                setEditingTemplate({
                                  ...editingTemplate,
                                  category: e.target.value,
                                })
                              }
                              className="input-field text-xs w-36"
                            >
                              <option>票面问题</option>
                              <option>重复报销</option>
                              <option>信息不符</option>
                              <option>版式异常</option>
                            </select>
                            <textarea
                              value={editingTemplate.content}
                              onChange={(e) =>
                                setEditingTemplate({
                                  ...editingTemplate,
                                  content: e.target.value,
                                })
                              }
                              rows={2}
                              className="input-field text-sm resize-none"
                            />
                            <div className="flex items-center space-x-1">
                              <button
                                className="btn-success text-xs py-1 px-2"
                                onClick={handleUpdateTemplate}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                保存
                              </button>
                              <button
                                className="btn-ghost text-xs py-1 px-2"
                                onClick={() => setEditingTemplate(null)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-slate-700">
                              {template.content}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {template.enabled ? "已启用" : "已停用"}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="ml-2 flex items-center space-x-0.5 flex-shrink-0">
                        <button
                          className="btn-ghost p-1.5"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="编辑"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="删除"
                          onClick={() => deleteRejectTemplate(template.templateId)}
                        >
                          <Trash2 className="w-4 h-4 text-danger-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "recognition" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5 space-y-5">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-primary-50 rounded-sm flex items-center justify-center">
                <Scan className="w-5 h-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  OCR 识别参数
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  控制识别精度与人工干预阈值
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-700">
                  字段置信度阈值
                </label>
                <span className="text-sm font-mono font-medium text-primary-600">
                  {(validationRules.confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={99}
                value={validationRules.confidenceThreshold * 100}
                onChange={(e) => {
                  updateValidationRules({
                    confidenceThreshold: Number(e.target.value) / 100,
                  });
                  setRulesChanged(true);
                }}
                className="w-full accent-primary-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                低于该置信度的字段将自动标记，提醒人工校对
              </p>
              <div className="mt-3 h-2 bg-slate-100 rounded-sm overflow-hidden flex">
                <div
                  className="bg-danger-400"
                  style={{ width: `${validationRules.confidenceThreshold * 50}%` }}
                />
                <div
                  className="bg-warning-400"
                  style={{
                    width: `${(0.95 - validationRules.confidenceThreshold) * 200}%`,
                  }}
                />
                <div className="bg-success-400 flex-1" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>50% 需人工校对</span>
                <span>95% 高置信度</span>
                <span>99%</span>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-5">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-slate-100 rounded-sm flex items-center justify-center">
                <Eye className="w-5 h-5 text-slate-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  图像预处理参数
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  自动裁边、扶正和图像增强设置
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-700 mb-2 block">
                自动裁边灵敏度
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      updateValidationRules({ autoCropSensitivity: level });
                      setRulesChanged(true);
                    }}
                    className={cn(
                      "px-3 py-2 text-sm rounded-sm border transition-all",
                      validationRules.autoCropSensitivity === level
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-primary-300"
                    )}
                  >
                    {level === "low" ? "低" : level === "medium" ? "中" : "高"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                灵敏度越高，裁边越激进，适合拍摄角度倾斜较大的图片
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
