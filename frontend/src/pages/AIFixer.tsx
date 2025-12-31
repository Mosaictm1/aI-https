// ============================================
// AI Fixer Page - Fix Workflows with AI
// ============================================

import { useState } from 'react';
import {
    Bot,
    Wand2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2,
    Sparkles,
    Zap,
    FileCode,
    Plus,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflows, useWorkflow } from '@/hooks/useWorkflows';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { cn } from '@/lib/utils';

// ==================== Types ====================

interface FixResult {
    success: boolean;
    externalIssue?: boolean;
    summary?: string;
    analysis?: string;
    explanation?: string;
    recommendations?: string[];
    issuesFixed?: Array<{
        errorName: string;
        description: string;
        solution: string;
        nodeAffected?: string;
    }>;
    nodesAdded?: Array<{
        nodeName: string;
        purpose: string;
    }>;
    executionResult?: {
        successful: boolean;
        status: string;
        resultUrl?: string;
    };
    workflowNowDoes?: string[];
    finalMessage?: string;
}

// ==================== Component ====================

export default function AIFixer() {
    const { data: workflowsData } = useWorkflows();
    const { analyze, isAnalyzing } = useAIAnalysis();

    const workflows = workflowsData?.items || [];

    const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
    const [selectedNode, setSelectedNode] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState('');
    const [result, setResult] = useState<FixResult | null>(null);
    const [mode, setMode] = useState<'fix' | 'build'>('fix');
    const [buildIdea, setBuildIdea] = useState('');

    // Fetch full workflow details when selected
    const { data: selectedWorkflowData } = useWorkflow(selectedWorkflow);

    // Filter HTTP Request nodes
    const httpNodes = selectedWorkflowData?.nodes?.filter(
        (n: { type: string }) => n.type?.toLowerCase().includes('httprequest') || n.type?.toLowerCase().includes('http request')
    ) || [];

    const handleFixWorkflow = async () => {
        if (!selectedWorkflow || !selectedNode || !errorMessage) return;

        try {
            const response = await analyze({
                workflowId: selectedWorkflow,
                nodeId: selectedNode,
                errorMessage,
            });
            setResult(response as unknown as FixResult);
        } catch (error) {
            console.error('Fix failed:', error);
        }
    };

    const handleBuildWorkflow = async () => {
        if (!buildIdea) return;
        // TODO: Implement build workflow
        alert('ميزة بناء Workflow قادمة قريباً!');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-yellow to-action-orange flex-center">
                        <Bot className="h-7 w-7 text-dark-green" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            AI Workflow Assistant
                            <Sparkles className="h-5 w-5 text-accent-yellow" />
                        </h1>
                        <p className="text-white/60">إصلاح وبناء Workflows بالذكاء الاصطناعي</p>
                    </div>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-3">
                <Button
                    variant={mode === 'fix' ? 'default' : 'outline'}
                    onClick={() => setMode('fix')}
                    className="gap-2"
                >
                    <Wand2 className="h-4 w-4" />
                    إصلاح Workflow
                </Button>
                <Button
                    variant={mode === 'build' ? 'default' : 'outline'}
                    onClick={() => setMode('build')}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    بناء Workflow جديد
                </Button>
            </div>

            {mode === 'fix' ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Input Section */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <AlertCircle className="h-5 w-5 text-action-orange" />
                                وصف المشكلة
                            </CardTitle>
                            <CardDescription>
                                اختر الـ Workflow والـ Node الذي به مشكلة
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Workflow Selector */}
                            <div>
                                <label className="text-sm text-white/70 mb-2 block">
                                    اختر الـ Workflow
                                </label>
                                <select
                                    className="w-full bg-[#1a2e35] border border-white/20 rounded-lg px-3 py-2 text-white focus:border-accent-yellow focus:outline-none cursor-pointer"
                                    value={selectedWorkflow}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                        setSelectedWorkflow(e.target.value);
                                        setSelectedNode('');
                                    }}
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="">اختر Workflow...</option>
                                    {workflows.map((wf) => (
                                        <option key={wf.id} value={wf.id}>
                                            {wf.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Node Selector */}
                            {selectedWorkflow && (
                                <div>
                                    <label className="text-sm text-white/70 mb-2 block">
                                        اختر الـ HTTP Request Node
                                    </label>
                                    <select
                                        className="w-full bg-[#1a2e35] border border-white/20 rounded-lg px-3 py-2 text-white focus:border-accent-yellow focus:outline-none cursor-pointer"
                                        value={selectedNode}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedNode(e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="">اختر Node...</option>
                                        {httpNodes.map((node: { id: string; name: string }) => (
                                            <option key={node.id} value={node.id}>
                                                {node.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Error Message */}
                            <div>
                                <label className="text-sm text-white/70 mb-2 block">
                                    رسالة الخطأ
                                </label>
                                <Textarea
                                    placeholder="الصق رسالة الخطأ هنا..."
                                    className="min-h-[150px] bg-white/10 border-white/20 text-white placeholder:text-white/30"
                                    value={errorMessage}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setErrorMessage(e.target.value)}
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                className="w-full gap-2"
                                onClick={handleFixWorkflow}
                                disabled={!selectedWorkflow || !selectedNode || !errorMessage || isAnalyzing}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        جاري الإصلاح... (قد يستغرق 10 دقائق)
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4" />
                                        إصلاح بالذكاء الاصطناعي
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Result Section */}
                    <Card className={cn(
                        "glass-card transition-all",
                        result?.success ? "border-lime-green/50" : result ? "border-action-orange/50" : ""
                    )}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <FileCode className="h-5 w-5 text-accent-yellow" />
                                نتيجة الإصلاح
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {result ? (
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div className={cn(
                                        "flex items-center gap-3 p-4 rounded-lg",
                                        result.success ? "bg-lime-green/10" : result.externalIssue ? "bg-accent-yellow/10" : "bg-action-orange/10"
                                    )}>
                                        {result.success ? (
                                            <CheckCircle className="h-6 w-6 text-lime-green" />
                                        ) : result.externalIssue ? (
                                            <AlertCircle className="h-6 w-6 text-accent-yellow" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-action-orange" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-white">
                                                {result.success ? 'تم الإصلاح بنجاح!' : result.externalIssue ? 'مشكلة خارجية' : 'فشل الإصلاح'}
                                            </p>
                                            {result.summary && (
                                                <p className="text-sm text-white/70">{result.summary}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Analysis / Explanation */}
                                    {(result.analysis || result.explanation) && (
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <h4 className="text-sm font-semibold text-white mb-2">📊 التحليل:</h4>
                                            <p className="text-sm text-white/70">{result.analysis || result.explanation}</p>
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {result.recommendations && result.recommendations.length > 0 && (
                                        <div className="p-3 bg-accent-yellow/10 rounded-lg">
                                            <h4 className="text-sm font-semibold text-accent-yellow mb-2">💡 التوصيات:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-white/70">
                                                {result.recommendations.map((rec, i) => (
                                                    <li key={i}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Issues Fixed */}
                                    {result.issuesFixed && result.issuesFixed.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-white">المشاكل التي تم إصلاحها:</h4>
                                            {result.issuesFixed.map((issue, i) => (
                                                <div key={i} className="p-3 bg-white/5 rounded-lg space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="error">{issue.errorName}</Badge>
                                                        {issue.nodeAffected && (
                                                            <Badge variant="secondary">{issue.nodeAffected}</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-white/70">{issue.description}</p>
                                                    <p className="text-sm text-lime-green">✓ {issue.solution}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Nodes Added */}
                                    {result.nodesAdded && result.nodesAdded.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-white">Nodes جديدة تمت إضافتها:</h4>
                                            {result.nodesAdded.map((node, i) => (
                                                <div key={i} className="flex items-center gap-2 p-2 bg-accent-yellow/10 rounded-lg">
                                                    <Plus className="h-4 w-4 text-accent-yellow" />
                                                    <span className="text-white">{node.nodeName}</span>
                                                    <span className="text-white/50 text-sm">- {node.purpose}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Execution Result */}
                                    {result.executionResult && (
                                        <div className={cn(
                                            "p-3 rounded-lg",
                                            result.executionResult.successful ? "bg-lime-green/10" : "bg-action-orange/10"
                                        )}>
                                            <p className="font-semibold text-white flex items-center gap-2">
                                                <Zap className="h-4 w-4" />
                                                نتيجة التنفيذ: {result.executionResult.status}
                                            </p>
                                            {result.executionResult.resultUrl && (
                                                <a
                                                    href={result.executionResult.resultUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-accent-yellow hover:underline"
                                                >
                                                    {result.executionResult.resultUrl}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Workflow Now Does */}
                                    {result.workflowNowDoes && result.workflowNowDoes.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-white">الـ Workflow الآن يفعل:</h4>
                                            <ol className="list-decimal list-inside space-y-1 text-white/70 text-sm">
                                                {result.workflowNowDoes.map((step, i) => (
                                                    <li key={i}>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    {/* Final Message */}
                                    {result.finalMessage && (
                                        <div className="p-3 bg-lime-green/20 rounded-lg text-center">
                                            <p className="font-semibold text-lime-green">{result.finalMessage}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-white/50">
                                    <Bot className="h-16 w-16 mb-4 opacity-30" />
                                    <p>اختر Workflow ووصف المشكلة</p>
                                    <p className="text-sm">وسيقوم الـ AI بإصلاحها تلقائياً</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* Build Mode */
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Sparkles className="h-5 w-5 text-accent-yellow" />
                            بناء Workflow من فكرة
                        </CardTitle>
                        <CardDescription>
                            اشرح فكرتك وسيقوم الـ AI ببناء الـ Workflow لك
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="مثال: أريد workflow يأخذ صورة من Wavespeed AI ثم ينشرها على Instagram عبر Late API..."
                            className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/30"
                            value={buildIdea}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBuildIdea(e.target.value)}
                        />
                        <Button
                            className="gap-2"
                            onClick={handleBuildWorkflow}
                            disabled={!buildIdea}
                        >
                            <Wand2 className="h-4 w-4" />
                            بناء الـ Workflow
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Info Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="glass-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-lime-green/10 flex-center">
                            <CheckCircle className="h-5 w-5 text-lime-green" />
                        </div>
                        <div>
                            <p className="font-semibold text-white">إصلاح تلقائي</p>
                            <p className="text-xs text-white/50">يصلح ويشغل ويتحقق</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 flex-center">
                            <RefreshCw className="h-5 w-5 text-accent-yellow" />
                        </div>
                        <div>
                            <p className="font-semibold text-white">تكرار حتى النجاح</p>
                            <p className="text-xs text-white/50">لا يتوقف حتى يعمل 100%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-action-orange/10 flex-center">
                            <Zap className="h-5 w-5 text-action-orange" />
                        </div>
                        <div>
                            <p className="font-semibold text-white">بحث في Documentation</p>
                            <p className="text-xs text-white/50">يبحث ويجد الحل الصحيح</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
