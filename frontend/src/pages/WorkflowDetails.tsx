// ============================================
// Workflow Details Page
// ============================================

import { useParams, Link } from 'react-router-dom';
import {
    ArrowRight,
    Workflow as WorkflowIcon,
    Play,
    Pause,
    Server,
    Calendar,
    Clock,
    Hash,
    Box,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { useWorkflow, useWorkflowExecutions } from '@/hooks/useWorkflows';
import { cn } from '@/lib/utils';

export default function WorkflowDetails() {
    const { id } = useParams<{ id: string }>();
    const { data: workflow, isLoading, error, refetch } = useWorkflow(id!);
    const { data: executionsData, isLoading: executionsLoading } = useWorkflowExecutions(id!);

    const executions = executionsData?.items || [];

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-lime-green" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-action-orange" />;
            case 'running':
                return <RefreshCw className="h-4 w-4 text-accent-yellow animate-spin" />;
            default:
                return <Clock className="h-4 w-4 text-white/50" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'success' | 'error' | 'warning' | 'secondary'> = {
            success: 'success',
            error: 'error',
            running: 'warning',
            waiting: 'secondary',
        };
        const labels: Record<string, string> = {
            success: 'نجاح',
            error: 'فشل',
            running: 'جاري',
            waiting: 'انتظار',
        };
        return (
            <Badge variant={variants[status] || 'secondary'}>
                {labels[status] || status}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !workflow) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-16 h-16 rounded-full bg-action-orange/20 flex-center">
                    <AlertCircle className="h-8 w-8 text-action-orange" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                    {error ? 'حدث خطأ' : 'Workflow غير موجود'}
                </h3>
                <Link to="/workflows">
                    <Button>
                        <ArrowRight className="h-4 w-4 ml-2" />
                        العودة للقائمة
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/50">
                <Link to="/workflows" className="hover:text-white transition-colors">
                    سير العمل
                </Link>
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span className="text-white">{workflow.name}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'w-14 h-14 rounded-xl flex-center',
                            workflow.active
                                ? 'bg-lime-green/20'
                                : 'bg-white/10'
                        )}
                    >
                        <WorkflowIcon
                            className={cn(
                                'h-7 w-7',
                                workflow.active ? 'text-lime-green' : 'text-white/50'
                            )}
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{workflow.name}</h1>
                        {workflow.instance && (
                            <div className="flex items-center gap-1 text-white/60 mt-1">
                                <Server className="h-4 w-4" />
                                <span>{workflow.instance.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <Badge
                    variant={workflow.active ? 'success' : 'secondary'}
                    className="text-base px-4 py-1"
                >
                    {workflow.active ? (
                        <>
                            <Play className="h-4 w-4 ml-2" />
                            نشط
                        </>
                    ) : (
                        <>
                            <Pause className="h-4 w-4 ml-2" />
                            متوقف
                        </>
                    )}
                </Badge>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 flex-center">
                            <Hash className="h-5 w-5 text-accent-yellow" />
                        </div>
                        <div>
                            <p className="text-xs text-white/50">n8n ID</p>
                            <p className="text-sm font-medium text-white">{workflow.n8nId}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-lime-green/10 flex-center">
                            <Box className="h-5 w-5 text-lime-green" />
                        </div>
                        <div>
                            <p className="text-xs text-white/50">عدد الـ Nodes</p>
                            <p className="text-sm font-medium text-white">{workflow.nodes?.length || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-medium-green/10 flex-center">
                            <Calendar className="h-5 w-5 text-medium-green" />
                        </div>
                        <div>
                            <p className="text-xs text-white/50">تاريخ الإنشاء</p>
                            <p className="text-sm font-medium text-white truncate">
                                {formatDate(workflow.createdAt)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-action-orange/10 flex-center">
                            <Clock className="h-5 w-5 text-action-orange" />
                        </div>
                        <div>
                            <p className="text-xs text-white/50">آخر تحديث</p>
                            <p className="text-sm font-medium text-white truncate">
                                {formatDate(workflow.updatedAt)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="nodes">
                <TabsList>
                    <TabsTrigger value="nodes">Nodes</TabsTrigger>
                    <TabsTrigger value="executions">التنفيذات</TabsTrigger>
                </TabsList>

                <TabsContent value="nodes" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">قائمة الـ Nodes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {workflow.nodes && workflow.nodes.length > 0 ? (
                                <div className="space-y-2">
                                    {workflow.nodes.map((node, index) => (
                                        <div
                                            key={node.id || index}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-accent-yellow/10 flex-center">
                                                <Box className="h-4 w-4 text-accent-yellow" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate">
                                                    {node.name}
                                                </p>
                                                <p className="text-xs text-white/50 truncate">
                                                    {node.type}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-white/50 text-center py-8">
                                    لا توجد nodes
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="executions" className="mt-4">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-lg">سجل التنفيذات</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => refetch()}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {executionsLoading ? (
                                <div className="flex-center py-8">
                                    <Spinner />
                                </div>
                            ) : executions.length > 0 ? (
                                <div className="space-y-2">
                                    {executions.map((execution) => (
                                        <div
                                            key={execution.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            {getStatusIcon(execution.status)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">
                                                    {execution.mode}
                                                </p>
                                                <p className="text-xs text-white/50">
                                                    {formatDate(execution.startedAt)}
                                                </p>
                                            </div>
                                            {getStatusBadge(execution.status)}
                                            {execution.error && (
                                                <span className="text-xs text-action-orange truncate max-w-[200px]">
                                                    {execution.error.message}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-white/50 text-center py-8">
                                    لا توجد تنفيذات
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
