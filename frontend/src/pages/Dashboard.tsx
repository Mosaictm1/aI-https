import {
    Workflow,
    Server,
    Activity,
    Key,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Placeholder data - will be replaced with API calls
const stats = [
    {
        title: 'سير العمل النشطة',
        value: '12',
        change: '+2',
        icon: Workflow,
        trend: 'up',
    },
    {
        title: 'الـ Instances المتصلة',
        value: '3',
        change: '0',
        icon: Server,
        trend: 'neutral',
    },
    {
        title: 'الطلبات اليوم',
        value: '1,247',
        change: '+18%',
        icon: Activity,
        trend: 'up',
    },
    {
        title: 'مفاتيح API',
        value: '5',
        change: '-1',
        icon: Key,
        trend: 'down',
    },
];

const recentActivity = [
    {
        id: 1,
        type: 'success',
        message: 'تم تنفيذ "Email Automation" بنجاح',
        time: 'منذ 5 دقائق',
    },
    {
        id: 2,
        type: 'error',
        message: 'فشل في تنفيذ "Data Sync Workflow"',
        time: 'منذ 12 دقيقة',
    },
    {
        id: 3,
        type: 'warning',
        message: 'تحذير: HTTP Request Node يحتاج تحديث',
        time: 'منذ 25 دقيقة',
    },
    {
        id: 4,
        type: 'success',
        message: 'تم إضافة Instance جديد',
        time: 'منذ ساعة',
    },
];

const quickActions = [
    { label: 'HTTP Request جديد', icon: Activity, href: '/http-builder' },
    { label: 'تحليل خطأ', icon: AlertTriangle, href: '/ai-analysis' },
    { label: 'إضافة Instance', icon: Server, href: '/instances' },
];

export default function Dashboard() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">مرحباً بك! 👋</h1>
                    <p className="text-white/60 mt-1">إليك نظرة عامة على نشاطك اليوم</p>
                </div>
                <Button className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    عرض التقارير
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
                        <Button variant="ghost" size="sm">
                            عرض الكل
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentActivity.map((activity) => (
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
                                        ? 'نجاح'
                                        : activity.type === 'error'
                                            ? 'خطأ'
                                            : 'تحذير'}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="w-full justify-start gap-3 h-12"
                            >
                                <div className="w-8 h-8 rounded-lg bg-accent-yellow/10 flex-center">
                                    <action.icon className="h-4 w-4 text-accent-yellow" />
                                </div>
                                {action.label}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
