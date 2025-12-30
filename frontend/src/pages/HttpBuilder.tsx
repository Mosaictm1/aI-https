// ============================================
// HTTP Builder Page
// ============================================

import { useState } from 'react';
import {
    Send,
    Plus,
    Trash2,
    Copy,
    Clock,
    FileCode,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import type { HttpMethod, HttpHeader, HttpParam, HttpResponse } from '@/types';

// ==================== Constants ====================

const HTTP_METHODS: { value: HttpMethod; label: string; color: string }[] = [
    { value: 'GET', label: 'GET', color: 'text-lime-green' },
    { value: 'POST', label: 'POST', color: 'text-accent-yellow' },
    { value: 'PUT', label: 'PUT', color: 'text-medium-green' },
    { value: 'PATCH', label: 'PATCH', color: 'text-action-orange' },
    { value: 'DELETE', label: 'DELETE', color: 'text-red-500' },
];

// ==================== Component ====================

export default function HttpBuilder() {
    const { toast } = useToast();

    // Request State
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState('');
    const [headers, setHeaders] = useState<HttpHeader[]>([
        { key: 'Content-Type', value: 'application/json', enabled: true },
    ]);
    const [params, setParams] = useState<HttpParam[]>([]);
    const [body, setBody] = useState('');

    // Response State
    const [response, setResponse] = useState<HttpResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // ==================== Handlers ====================

    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '', enabled: true }]);
    };

    const updateHeader = (index: number, field: keyof HttpHeader, value: string | boolean) => {
        const updated = [...headers];
        updated[index] = { ...updated[index], [field]: value };
        setHeaders(updated);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const addParam = () => {
        setParams([...params, { key: '', value: '', enabled: true }]);
    };

    const updateParam = (index: number, field: keyof HttpParam, value: string | boolean) => {
        const updated = [...params];
        updated[index] = { ...updated[index], [field]: value };
        setParams(updated);
    };

    const removeParam = (index: number) => {
        setParams(params.filter((_, i) => i !== index));
    };

    const sendRequest = async () => {
        if (!url) {
            toast({
                title: 'خطأ',
                description: 'يرجى إدخال URL',
                variant: 'error',
            });
            return;
        }

        setIsLoading(true);
        const startTime = Date.now();

        try {
            // Build URL with params
            const urlObj = new URL(url);
            params.filter(p => p.enabled && p.key).forEach(p => {
                urlObj.searchParams.append(p.key, p.value);
            });

            // Build headers
            const headerObj: Record<string, string> = {};
            headers.filter(h => h.enabled && h.key).forEach(h => {
                headerObj[h.key] = h.value;
            });

            const options: RequestInit = {
                method,
                headers: headerObj,
            };

            if (method !== 'GET' && method !== 'HEAD' && body) {
                options.body = body;
            }

            const res = await fetch(urlObj.toString(), options);
            const responseBody = await res.text();

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                body: responseBody,
                time: Date.now() - startTime,
                size: new Blob([responseBody]).size,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Request failed';
            toast({
                title: 'خطأ في الطلب',
                description: message,
                variant: 'error',
            });
            setResponse(null);
        } finally {
            setIsLoading(false);
        }
    };

    const copyResponse = () => {
        if (response) {
            navigator.clipboard.writeText(response.body);
            toast({
                title: 'تم النسخ',
                description: 'تم نسخ الاستجابة',
            });
        }
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-lime-green';
        if (status >= 300 && status < 400) return 'text-accent-yellow';
        if (status >= 400 && status < 500) return 'text-action-orange';
        return 'text-red-500';
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // ==================== Render ====================

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">HTTP Builder</h1>
                <p className="text-white/60 mt-1">بناء واختبار طلبات HTTP</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Request Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Method & URL */}
                        <div className="flex gap-2">
                            <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HTTP_METHODS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            <span className={m.color}>{m.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://api.example.com/endpoint"
                                className="flex-1"
                            />
                            <Button onClick={sendRequest} disabled={isLoading}>
                                {isLoading ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="headers">
                            <TabsList>
                                <TabsTrigger value="headers">Headers</TabsTrigger>
                                <TabsTrigger value="params">Params</TabsTrigger>
                                <TabsTrigger value="body">Body</TabsTrigger>
                            </TabsList>

                            {/* Headers Tab */}
                            <TabsContent value="headers" className="mt-4 space-y-2">
                                {headers.map((header, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="checkbox"
                                            checked={header.enabled}
                                            onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                                            className="w-4 h-4 mt-3"
                                        />
                                        <Input
                                            value={header.key}
                                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                            placeholder="Key"
                                            className="flex-1"
                                        />
                                        <Input
                                            value={header.value}
                                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeHeader(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-white/50" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addHeader}>
                                    <Plus className="h-4 w-4 ml-2" />
                                    إضافة Header
                                </Button>
                            </TabsContent>

                            {/* Params Tab */}
                            <TabsContent value="params" className="mt-4 space-y-2">
                                {params.map((param, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="checkbox"
                                            checked={param.enabled}
                                            onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                                            className="w-4 h-4 mt-3"
                                        />
                                        <Input
                                            value={param.key}
                                            onChange={(e) => updateParam(index, 'key', e.target.value)}
                                            placeholder="Key"
                                            className="flex-1"
                                        />
                                        <Input
                                            value={param.value}
                                            onChange={(e) => updateParam(index, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeParam(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-white/50" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={addParam}>
                                    <Plus className="h-4 w-4 ml-2" />
                                    إضافة Param
                                </Button>
                            </TabsContent>

                            {/* Body Tab */}
                            <TabsContent value="body" className="mt-4">
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder='{"key": "value"}'
                                    className="w-full h-48 p-3 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm resize-none focus:outline-none focus:border-accent-yellow/50"
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Response Panel */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-lg">الاستجابة</CardTitle>
                        {response && (
                            <Button variant="ghost" size="sm" onClick={copyResponse}>
                                <Copy className="h-4 w-4 ml-2" />
                                نسخ
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex-center py-20">
                                <Spinner size="lg" />
                            </div>
                        ) : response ? (
                            <div className="space-y-4">
                                {/* Status Bar */}
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                                    <Badge
                                        variant={response.status < 400 ? 'success' : 'error'}
                                        className="text-lg px-3 py-1"
                                    >
                                        <span className={getStatusColor(response.status)}>
                                            {response.status}
                                        </span>
                                    </Badge>
                                    <span className="text-white/50">{response.statusText}</span>
                                    <div className="flex items-center gap-1 text-white/50 mr-auto">
                                        <Clock className="h-4 w-4" />
                                        <span>{response.time}ms</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-white/50">
                                        <FileCode className="h-4 w-4" />
                                        <span>{formatBytes(response.size)}</span>
                                    </div>
                                </div>

                                {/* Response Body */}
                                <div className="relative">
                                    <pre className="p-4 rounded-lg bg-deep-teal-200/50 border border-white/10 overflow-auto max-h-96 text-sm font-mono text-white/80">
                                        {(() => {
                                            try {
                                                return JSON.stringify(JSON.parse(response.body), null, 2);
                                            } catch {
                                                return response.body;
                                            }
                                        })()}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-white/50">
                                <Send className="h-12 w-12 mb-4 opacity-30" />
                                <p>أرسل طلباً لرؤية الاستجابة</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
