// ============================================
// Workflow Card Component
// ============================================

import { Link } from 'react-router-dom';
import {
    Workflow as WorkflowIcon,
    Play,
    Pause,
    ExternalLink,
    Clock,
    Server,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Workflow } from '@/types';

interface WorkflowCardProps {
    workflow: Workflow;
}

export default function WorkflowCard({ workflow }: WorkflowCardProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card hover className="overflow-hidden group">
            <CardContent className="p-0">
                {/* Status indicator bar */}
                <div
                    className={cn(
                        'h-1',
                        workflow.active
                            ? 'bg-gradient-to-r from-lime-green to-medium-green'
                            : 'bg-gradient-to-r from-white/20 to-white/10'
                    )}
                />

                <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-lg flex-center shrink-0',
                                    workflow.active
                                        ? 'bg-lime-green/20'
                                        : 'bg-white/10'
                                )}
                            >
                                <WorkflowIcon
                                    className={cn(
                                        'h-5 w-5',
                                        workflow.active ? 'text-lime-green' : 'text-white/50'
                                    )}
                                />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-white truncate">
                                    {workflow.name}
                                </h3>
                                {workflow.instance && (
                                    <div className="flex items-center gap-1 text-sm text-white/50">
                                        <Server className="h-3 w-3" />
                                        <span className="truncate">{workflow.instance.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Badge
                            variant={workflow.active ? 'success' : 'secondary'}
                            className="shrink-0"
                        >
                            {workflow.active ? (
                                <>
                                    <Play className="h-3 w-3 ml-1" />
                                    نشط
                                </>
                            ) : (
                                <>
                                    <Pause className="h-3 w-3 ml-1" />
                                    متوقف
                                </>
                            )}
                        </Badge>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-4 text-sm text-white/50">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>آخر تحديث: {formatDate(workflow.updatedAt)}</span>
                        </div>
                        {workflow.nodes && (
                            <span>{workflow.nodes.length} nodes</span>
                        )}
                    </div>

                    {/* Tags */}
                    {workflow.tags && workflow.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {workflow.tags.slice(0, 3).map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/70"
                                >
                                    {tag}
                                </span>
                            ))}
                            {workflow.tags.length > 3 && (
                                <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-white/50">
                                    +{workflow.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2">
                        <Link to={`/workflows/${workflow.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                                <ExternalLink className="h-4 w-4 ml-2" />
                                عرض التفاصيل
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
