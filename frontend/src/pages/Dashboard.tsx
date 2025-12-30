import { Link } from 'react-router-dom';
import {
    Workflow,
    Server,
    Activity,
    Key,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInstances } from '@/hooks/useInstances';
import { useWorkflows } from '@/hooks/useWorkflows';

const quickActions = [
    { label: 'HTTP Request جديد', icon: Activity, href: '/http-builder' },
    { label: 'تحليل خطأ', icon: AlertTriangle, href: '/ai-analysis' },
    { label: 'إضافة Instance', icon: Server, href: '/instances' },
];

export default function Dashboard() {
    const { data: instancesData, isLoading: instancesLoading, refetch: refetchInstances } = useInstances();
    const { data: workflowsData, isLoading: workflowsLoading, refetch: refetchWorkflows } = useWorkflows();

    const instances = instancesData?.items || [];
    const workflows = workflowsData?.items || [];

    const activeWorkflows = workflows.filter((w) => w.active).length;
    const connectedInstances = instances.filter((i) => i.status === 'CONNECTED').length;

    const isLoading = instancesLoading || workflowsLoading;

    const stats = [
        {
            title: 'سير العمل النشطة',
            value: activeWorkflows.toString(),
            change: `من ${workflows.length} إجمالي`,
            icon: Workflow,
            trend: activeWorkflows > 0 ? 'up' : 'neutral',
        },
        {
            title: 'الـ Instances المتصلة',
            value: connectedInstances.toString(),
            change: `من ${instances.length} إجمالي`,
            icon: Server,
            trend: connectedInstances > 0 ? 'up' : 'neutral',
        },
        {
            title: 'سير العمل الكلي',
            value: workflows.length.toString(),
            change: '',
            icon: Activity,
            trend: 'neutral',
        },
        {
            title: 'مفاتيح API',
            value: instances.length > 0 ? instances.length.toString() : '0',
            change: '',
            icon: Key,
            trend: 'neutral',
        },
    ];

    // Generate recent activity from workflows
    const recentActivity = workflows.slice(0, 4).map((workflow, index) => ({
        id: workflow.id || index,
        type: workflow.active ? 'success' : 'warning',
        message: workflow.active
            ? `"${workflow.name}" نشط ويعمل`
            : `"${workflow.name}" غير نشط`,
        time: workflow.updatedAt
            ? new Date(workflow.updatedAt).toLocaleDateString('ar-SA')
            : 'غير معروف',
    }));

    const handleRefresh = () => {
        refetchInstances();
        refetchWorkflows();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-accent-yellow" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">مرحباً بك! 👋</h1>
                    <p className="text-white/60 mt-1">إليك نظرة عامة على نشاطك اليوم</p>
                </div>
                <Button className="gap-2" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                    تحديث البيانات
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} hover className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/60">{stat.title}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                    {stat.change && (
                                        <p
                                            className={`text-xs mt-1 ${stat.trend === 'up'
                                                ? 'text-lime-green'
                                                : stat.trend === 'down'
                                                    ? 'text-action-orange'
                                                    : 'text-white/40'
                                                }`}
                                        >
                                            {stat.change}
                                        </p>
                                    )}
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent-yellow/20 to-action-orange/10 flex-center">
                                    <stat.icon className="h-6 w-6 text-accent-yellow" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-lg">النشاط الأخير</CardTitle>
                        <Link to="/workflows">
                            <Button variant="ghost" size="sm">
                                عرض الكل
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-white/40">
                                <Workflow className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>لا يوجد نشاط حتى الآن</p>
                                <p className="text-sm">قم بإضافة Instance ومزامنة سير العمل</p>
                            </div>
                        ) : (
                            recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex-center ${activity.type === 'success'
                                            ? 'bg-lime-green/20'
                                            : activity.type === 'error'
                                                ? 'bg-action-orange/20'
                                                : 'bg-accent-yellow/20'
                                            }`}
                                    >
                                        {activity.type === 'success' ? (
                                            <CheckCircle className="h-4 w-4 text-lime-green" />
                                        ) : activity.type === 'error' ? (
                                            <AlertTriangle className="h-4 w-4 text-action-orange" />
                                        ) : (
                                            <Clock className="h-4 w-4 text-accent-yellow" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{activity.message}</p>
                                        <p className="text-xs text-white/40">{activity.time}</p>
                                    </div>
                                    <Badge
                                        variant={
                                            activity.type === 'success'
                                                ? 'success'
                                                : activity.type === 'error'
                                                    ? 'error'
                                                    : 'warning'
                                        }
                                    >
                                        {activity.type === 'success'
                                            ? 'نشط'
                                            : activity.type === 'error'
                                                ? 'خطأ'
                                                : 'غير نشط'}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {quickActions.map((action, index) => (
                            <Link key={index} to={action.href}>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3 h-12"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-accent-yellow/10 flex-center">
                                        <action.icon className="h-4 w-4 text-accent-yellow" />
                                    </div>
                                    {action.label}
                                </Button>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
