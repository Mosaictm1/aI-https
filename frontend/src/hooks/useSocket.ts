// ============================================
// Socket.io Hook - Real-time Features
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

// ==================== Types ====================

interface SocketEventData {
    workflowId?: string;
    executionId?: string;
    status?: string;
    message?: string;
    data?: unknown;
}

type EventCallback = (data: SocketEventData) => void;

// ==================== Socket Events ====================

export const SocketEvents = {
    // Execution events
    EXECUTION_STARTED: 'execution:started',
    EXECUTION_PROGRESS: 'execution:progress',
    EXECUTION_COMPLETED: 'execution:completed',
    EXECUTION_FAILED: 'execution:failed',

    // Instance events
    INSTANCE_CONNECTED: 'instance:connected',
    INSTANCE_DISCONNECTED: 'instance:disconnected',
    INSTANCE_SYNCED: 'instance:synced',
    INSTANCE_ERROR: 'instance:error',

    // Workflow events
    WORKFLOW_UPDATED: 'workflow:updated',
    WORKFLOW_ACTIVATED: 'workflow:activated',
    WORKFLOW_DEACTIVATED: 'workflow:deactivated',

    // AI events
    AI_ANALYSIS_STARTED: 'ai:analysis:started',
    AI_ANALYSIS_COMPLETED: 'ai:analysis:completed',
    AI_FIX_APPLIED: 'ai:fix:applied',

    // Notification events
    NOTIFICATION: 'notification',
} as const;

// ==================== Hook ====================

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const token = useAuthStore((state) => state.token);

    // Connect to socket
    const connect = useCallback(() => {
        if (socketRef.current?.connected || !token) {
            return;
        }

        const socketUrl = import.meta.env.VITE_SOCKET_URL ||
            import.meta.env.VITE_API_URL?.replace('/api/v1', '') ||
            window.location.origin;

        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
            setIsConnected(true);
            setConnectionError(null);
            console.log('🔌 Socket connected');
        });

        socketRef.current.on('disconnect', (reason) => {
            setIsConnected(false);
            console.log('🔌 Socket disconnected:', reason);
        });

        socketRef.current.on('connect_error', (error) => {
            setConnectionError(error.message);
            console.error('🔌 Socket connection error:', error.message);
        });
    }, [token]);

    // Disconnect from socket
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    // Subscribe to an event
    const on = useCallback((event: string, callback: EventCallback) => {
        socketRef.current?.on(event, callback);

        // Return cleanup function
        return () => {
            socketRef.current?.off(event, callback);
        };
    }, []);

    // Emit an event
    const emit = useCallback((event: string, data?: unknown) => {
        socketRef.current?.emit(event, data);
    }, []);

    // Subscribe to workflow updates
    const subscribeToWorkflow = useCallback((workflowId: string) => {
        emit('subscribe:workflow', workflowId);
    }, [emit]);

    // Unsubscribe from workflow updates
    const unsubscribeFromWorkflow = useCallback((workflowId: string) => {
        emit('unsubscribe:workflow', workflowId);
    }, [emit]);

    // Subscribe to instance updates
    const subscribeToInstance = useCallback((instanceId: string) => {
        emit('subscribe:instance', instanceId);
    }, [emit]);

    // Unsubscribe from instance updates
    const unsubscribeFromInstance = useCallback((instanceId: string) => {
        emit('unsubscribe:instance', instanceId);
    }, [emit]);

    // Auto-connect when token is available
    useEffect(() => {
        if (token) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
        connect,
        disconnect,
        on,
        emit,
        subscribeToWorkflow,
        unsubscribeFromWorkflow,
        subscribeToInstance,
        unsubscribeFromInstance,
    };
};

export default useSocket;
