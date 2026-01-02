// ============================================
// History Page - سجل النشاطات والـ Workflows
// ============================================

import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    History as HistoryIcon,
    Workflow,
    Bot,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    Sparkles,
    ExternalLink,
    FileJson,
    Check,
} from 'lucide-react';
import { useAIAnalysis, type BuildHistoryItem } from '@/hooks/useAIAnalysis';
import { cn } from '@/lib/utils';

export default function History() {
    const { useBuildHistory, useAnalysisHistory } = useAIAnalysis();
    const { data: buildHistory, isLoading: isBuildLoading } = useBuildHistory();
    const { data: analysisHistory, isLoading: isAnalysisLoading } = useAnalysisHistory();

    const [activeTab, setActiveTab] = useState<'builds' | 'fixes'>('builds');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy - HH:mm', { locale: ar });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple">
                            <HistoryIcon className="h-6 w-6 text-white" />
                        </div>
                        سجل النشاطات
                    </h1>
                    <p className="text-white/60 mt-1">
                        جميع الـ Workflows والإصلاحات التي تم إنشاؤها
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('builds')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                        activeTab === 'builds'
                            ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-glow-cyan'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                >
                    <Sparkles className="h-4 w-4" />
                    Workflows المبنية
                    {buildHistory && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                            {buildHistory.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('fixes')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                        activeTab === 'fixes'
                            ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-glow-cyan'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                >
                    <Bot className="h-4 w-4" />
                    الإصلاحات
                    {analysisHistory && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                            {analysisHistory.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {/* Builds Tab */}
                {activeTab === 'builds' && (
                    <>
                        {isBuildLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-cyan border-t-transparent" />
                            </div>
                        ) : !buildHistory || buildHistory.length === 0 ? (
                            <div className="text-center py-12 glass-card rounded-xl">
                                <Workflow className="h-12 w-12 text-white/30 mx-auto mb-4" />
                                <p className="text-white/60">لا توجد Workflows مبنية بعد</p>
                                <p className="text-white/40 text-sm mt-1">
                                    استخدم AI Fixer لبناء Workflows جديدة
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {buildHistory.map((item: BuildHistoryItem) => (
                                    <BuildHistoryCard
                                        key={item.id}
                                        item={item}
                                        isExpanded={expandedItem === item.id}
                                        onToggle={() =>
                                            setExpandedItem(expandedItem === item.id ? null : item.id)
                                        }
                                        formatDate={formatDate}
                                        copyToClipboard={copyToClipboard}
                                        copiedId={copiedId}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Fixes Tab */}
                {activeTab === 'fixes' && (
                    <>
                        {isAnalysisLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-cyan border-t-transparent" />
                            </div>
                        ) : !analysisHistory || analysisHistory.length === 0 ? (
                            <div className="text-center py-12 glass-card rounded-xl">
                                <Bot className="h-12 w-12 text-white/30 mx-auto mb-4" />
                                <p className="text-white/60">لا توجد إصلاحات بعد</p>
                                <p className="text-white/40 text-sm mt-1">
                                    استخدم AI Fixer لإصلاح الأخطاء في Workflows
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {analysisHistory.map((item) => (
                                    <AnalysisHistoryCard
                                        key={item.id}
                                        item={item}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== Build History Card ====================

interface BuildHistoryCardProps {
    item: BuildHistoryItem;
    isExpanded: boolean;
    onToggle: () => void;
    formatDate: (date: string) => string;
    copyToClipboard: (text: string, id: string) => void;
    copiedId: string | null;
}

function BuildHistoryCard({
    item,
    isExpanded,
    onToggle,
    formatDate,
    copyToClipboard,
    copiedId,
}: BuildHistoryCardProps) {
    return (
        <div
            className={cn(
                'glass-card rounded-xl overflow-hidden transition-all duration-300',
                isExpanded ? 'ring-1 ring-accent-cyan/50' : ''
            )}
        >
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-start gap-4 text-right hover:bg-white/5 transition-colors"
            >
                <div
                    className={cn(
                        'p-2 rounded-lg shrink-0',
                        item.success
                            ? 'bg-status-success/20 text-status-success'
                            : 'bg-status-error/20 text-status-error'
                    )}
                >
                    {item.success ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <XCircle className="h-5 w-5" />
                    )}
                </div>

                <div className="flex-1 min-w-0 text-right">
                    <h3 className="font-semibold text-white truncate">
                        {item.workflowName || 'Workflow بدون اسم'}
                    </h3>
                    <p className="text-sm text-white/60 line-clamp-2 mt-1">
                        {item.idea}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Workflow className="h-3 w-3" />
                            {item.nodesCount} nodes
                        </span>
                    </div>
                </div>

                <div className="shrink-0">
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-white/40" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-white/40" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4 animate-fade-in">
                    {/* Services */}
                    {item.extractedServices && item.extractedServices.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-white/70 mb-2">
                                الخدمات المستخدمة
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {item.extractedServices.map((service, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 rounded-full bg-accent-cyan/10 text-accent-cyan text-sm"
                                    >
                                        {service}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Explanation */}
                    {item.explanation && (
                        <div>
                            <h4 className="text-sm font-medium text-white/70 mb-2">الشرح</h4>
                            <p className="text-sm text-white/60 whitespace-pre-wrap">
                                {item.explanation}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                        {item.n8nWorkflowUrl && (
                            <a
                                href={item.n8nWorkflowUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 transition-colors text-sm"
                            >
                                <ExternalLink className="h-4 w-4" />
                                فتح في n8n
                            </a>
                        )}
                        {item.workflowJson !== null && item.workflowJson !== undefined && (
                            <button
                                onClick={() =>
                                    copyToClipboard(
                                        JSON.stringify(item.workflowJson, null, 2),
                                        item.id
                                    )
                                }
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-sm"
                            >
                                {copiedId === item.id ? (
                                    <>
                                        <Check className="h-4 w-4 text-status-success" />
                                        تم النسخ
                                    </>
                                ) : (
                                    <>
                                        <FileJson className="h-4 w-4" />
                                        نسخ JSON
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== Analysis History Card ====================

interface AnalysisHistoryCardProps {
    item: {
        id: string;
        nodeId: string;
        nodeName: string;
        nodeType: string;
        errorMessage: string;
        status: string;
        createdAt: string;
        workflow: {
            id: string;
            name: string;
        };
    };
    formatDate: (date: string) => string;
}

function AnalysisHistoryCard({ item, formatDate }: AnalysisHistoryCardProps) {
    const statusColors = {
        COMPLETED: 'bg-status-success/20 text-status-success',
        APPLIED: 'bg-accent-cyan/20 text-accent-cyan',
        FAILED: 'bg-status-error/20 text-status-error',
        PENDING: 'bg-status-warning/20 text-status-warning',
    };

    const statusText = {
        COMPLETED: 'تم التحليل',
        APPLIED: 'تم التطبيق',
        FAILED: 'فشل',
        PENDING: 'قيد الانتظار',
    };

    return (
        <div className="glass-card rounded-xl p-4">
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent-purple/20 text-accent-purple shrink-0">
                    <Bot className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-white truncate">{item.nodeName}</h3>
                        <span
                            className={cn(
                                'px-2 py-1 rounded-full text-xs shrink-0',
                                statusColors[item.status as keyof typeof statusColors] ||
                                statusColors.PENDING
                            )}
                        >
                            {statusText[item.status as keyof typeof statusText] || item.status}
                        </span>
                    </div>

                    <p className="text-sm text-white/50 mt-1">{item.nodeType}</p>

                    <p className="text-sm text-status-error/80 mt-2 line-clamp-2">
                        {item.errorMessage}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Workflow className="h-3 w-3" />
                            {item.workflow.name}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
