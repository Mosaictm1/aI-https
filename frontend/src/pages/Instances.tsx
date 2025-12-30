// ============================================
// Instances Page
// ============================================

import { useState } from 'react';
import { Server, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import InstanceCard from '@/components/instances/InstanceCard';
import AddInstanceModal from '@/components/instances/AddInstanceModal';
import EditInstanceModal from '@/components/instances/EditInstanceModal';
import DeleteConfirmModal from '@/components/instances/DeleteConfirmModal';
import {
    useInstances,
    useDeleteInstance,
    useSyncWorkflows,
    useTestConnection,
} from '@/hooks/useInstances';
import { useToast } from '@/components/ui/toast';
import type { Instance } from '@/types';

export default function Instances() {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);

    const { toast } = useToast();
    const { data: instancesData, isLoading, error, refetch } = useInstances();
    const deleteInstance = useDeleteInstance();
    const syncWorkflows = useSyncWorkflows();
    const testConnection = useTestConnection();

    const instances = instancesData?.items || [];

    // ==================== Handlers ====================

    const handleEdit = (instance: Instance) => {
        setSelectedInstance(instance);
        setEditModalOpen(true);
    };

    const handleDelete = (instance: Instance) => {
        setSelectedInstance(instance);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedInstance) return;

        try {
            await deleteInstance.mutateAsync(selectedInstance.id);
            toast({
                title: 'تم الحذف',
                description: `تم حذف ${selectedInstance.name} بنجاح`,
                variant: 'success',
            });
            setDeleteModalOpen(false);
            setSelectedInstance(null);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف';
            toast({
                title: 'خطأ',
                description: message,
                variant: 'error',
            });
        }
    };

    const handleSync = async (instance: Instance) => {
        setSyncingId(instance.id);
        try {
            const result = await syncWorkflows.mutateAsync(instance.id);
            toast({
                title: 'تمت المزامنة',
                description: `تم مزامنة ${result.synced} workflow`,
                variant: 'success',
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'حدث خطأ أثناء المزامنة';
            toast({
                title: 'خطأ في المزامنة',
                description: message,
                variant: 'error',
            });
        } finally {
            setSyncingId(null);
        }
    };

    const handleTest = async (instance: Instance) => {
        setTestingId(instance.id);
        try {
            const result = await testConnection.mutateAsync(instance.id);
            if (result.connected) {
                toast({
                    title: 'الاتصال ناجح',
                    description: result.message || 'تم الاتصال بـ n8n بنجاح',
                    variant: 'success',
                });
            } else {
                toast({
                    title: 'فشل الاتصال',
                    description: result.message || 'تعذر الاتصال بـ n8n',
                    variant: 'error',
                });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الاختبار';
            toast({
                title: 'خطأ',
                description: message,
                variant: 'error',
            });
        } finally {
            setTestingId(null);
        }
    };

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
                    <h1 className="text-2xl font-bold text-white">الـ Instances</h1>
                    <p className="text-white/60 mt-1">
                        إدارة اتصالات n8n الخاصة بك
                    </p>
                </div>
                <Button onClick={() => setAddModalOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة Instance
                </Button>
            </div>

            {/* Instances Grid */}
            {instances.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-accent-yellow/10 flex-center mb-4">
                            <Server className="h-8 w-8 text-accent-yellow" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            لا توجد Instances
                        </h3>
                        <p className="text-white/60 text-center max-w-md mb-4">
                            أضف أول n8n instance للبدء في إدارة سير العمل الخاص بك
                        </p>
                        <Button onClick={() => setAddModalOpen(true)}>
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة Instance
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {instances.map((instance) => (
                        <InstanceCard
                            key={instance.id}
                            instance={instance}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSync={handleSync}
                            onTest={handleTest}
                            isSyncing={syncingId === instance.id}
                            isTesting={testingId === instance.id}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <AddInstanceModal
                open={addModalOpen}
                onOpenChange={setAddModalOpen}
            />

            <EditInstanceModal
                instance={selectedInstance}
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
            />

            <DeleteConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="حذف Instance"
                description={`هل أنت متأكد من حذف "${selectedInstance?.name}"؟`}
                onConfirm={handleConfirmDelete}
                isDeleting={deleteInstance.isPending}
            />
        </div>
    );
}
