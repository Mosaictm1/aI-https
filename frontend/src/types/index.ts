// ============================================
// API Types for AI-HTTP Frontend
// ============================================

// ==================== User ====================

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserSettings {
    theme: 'dark' | 'light';
    language: 'ar' | 'en';
    emailNotifications: boolean;
}

// ==================== Instance ====================

export type InstanceStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';

export interface Instance {
    id: string;
    name: string;
    url: string;
    status: InstanceStatus;
    version?: string;
    lastSync: string | null;
    lastError?: string;
    workflowCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInstanceInput {
    name: string;
    url: string;
    apiKey: string;
}

export interface UpdateInstanceInput {
    name?: string;
    url?: string;
    apiKey?: string;
}

// ==================== Workflow ====================

export interface Workflow {
    id: string;
    n8nId: string;
    name: string;
    active: boolean;
    instanceId: string;
    instance?: Instance;
    nodes: WorkflowNode[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowNode {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    parameters: Record<string, unknown>;
}

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'success' | 'error' | 'waiting' | 'running';
    startedAt: string;
    stoppedAt: string | null;
    mode: string;
    error?: {
        message: string;
        node?: string;
    };
}

// ==================== API Key ====================

export interface ApiKey {
    id: string;
    name: string;
    keyPreview: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
}

export interface CreateApiKeyInput {
    name: string;
    expiresIn?: number; // days
}

export interface CreateApiKeyResponse {
    apiKey: ApiKey;
    key: string; // full key, only shown once
}

// ==================== Dashboard ====================

export interface DashboardStats {
    activeWorkflows: number;
    connectedInstances: number;
    todayRequests: number;
    apiKeysCount: number;
    recentActivity: ActivityItem[];
}

export interface ActivityItem {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
}

// ==================== HTTP Builder ====================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface HttpHeader {
    key: string;
    value: string;
    enabled: boolean;
}

export interface HttpParam {
    key: string;
    value: string;
    enabled: boolean;
}

export interface HttpRequest {
    id?: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers: HttpHeader[];
    params: HttpParam[];
    body: string;
    bodyType: 'none' | 'json' | 'form-data' | 'raw';
    auth: {
        type: 'none' | 'bearer' | 'basic' | 'api-key';
        token?: string;
        username?: string;
        password?: string;
        key?: string;
        value?: string;
        addTo?: 'header' | 'query';
    };
}

export interface HttpResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
    size: number;
}

// ==================== Pagination ====================

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==================== API Response ====================

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
}
