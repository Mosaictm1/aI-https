// ============================================
// Workflows Page
// ============================================

import { useState, useMemo } from 'react';
import {
    Workflow as WorkflowIcon,
    Search,
    Filter,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import { useWorkflows } from '@/hooks/useWorkflows';
import { useInstances } from '@/hooks/useInstances';

export default function Workflows() {
    const [selectedInstance, setSelectedInstance] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: instancesData } = useInstances();
    const {
        data: workflowsData,
        isLoading,
        error,
        refetch,
    } = useWorkflows({
        instanceId: selectedInstance === 'all' ? undefined : selectedInstance,
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        search: searchQuery || undefined,
    });

    const instances = instancesData?.items || [];
    const workflows = workflowsData?.items || [];

    // ==================== Filtered Results ====================

    const filteredWorkflows = useMemo(() => {
        let result = workflows;

        // Local search filter (in addition to API search)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((w) =>
                w.name.toLowerCase().includes(query)
            );
        }

        return result;
    }, [workflows, searchQuery]);

    // ==================== Render ====================

    if (isLoading) {
        return (
            <div className="flex-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="w-16 h-16 rounded-full bg-action-orange/20 flex-center">
                    <AlertCircle className="h-8 w-8 text-action-orange" />
                </div>
                <h3 className="text-lg font-semibold text-white">حدث خطأ</h3>
                <p className="text-white/60 text-center max-w-md">
                    {error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل البيانات'}
                </p>
                <Button onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    إعادة المحاولة
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">سير العمل</h1>
                    <p className="text-white/60 mt-1">
                        عرض وإدارة جميع الـ Workflows
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تحديث
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                        placeholder="بحث في Workflows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                    />
                </div>

                {/* Instance Filter */}
                <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="جميع الـ Instances" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">جميع الـ Instances</SelectItem>
                        {instances.map((instance) => (
                            <SelectItem key={instance.id} value={instance.id}>
                                {instance.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <Filter className="h-4 w-4 ml-2" />
                        <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">متوقف</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-white/50">
                عرض {filteredWorkflows.length} من {workflowsData?.total || 0} workflow
            </div>

            {/* Workflows Grid */}
            {filteredWorkflows.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-accent-yellow/10 flex-center mb-4">
                            <WorkflowIcon className="h-8 w-8 text-accent-yellow" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            {searchQuery || statusFilter !== 'all' || selectedInstance !== 'all'
                                ? 'لا توجد نتائج'
                                : 'لا توجد Workflows'}
                        </h3>
                        <p className="text-white/60 text-center max-w-md">
                            {searchQuery || statusFilter !== 'all' || selectedInstance !== 'all'
                                ? 'جرب تغيير معايير البحث أو الفلاتر'
                                : 'قم بمزامنة الـ Instances لعرض الـ Workflows'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredWorkflows.map((workflow) => (
                        <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                </div>
            )}
        </div>
    );
}
