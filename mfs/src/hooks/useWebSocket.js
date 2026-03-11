import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

export const useWebSocket = () => {
  const socketRef = useRef(null);
  const callbacksRef = useRef(new Map());

  useEffect(() => {
    const token = localStorage.getItem('token');
    const wsUrl = import.meta.env.VITE_WS_URL;

    // Only connect if we have an auth token AND a configured WS URL
    if (!token || !wsUrl) return;

    // Initialize WebSocket connection
    try {
      socketRef.current = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    } catch (e) {
      console.warn('Failed to create WebSocket:', e);
      return;
    }

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      // Warn instead of spamming errors to console
      console.warn('WebSocket connect error:', err?.message || err);
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle incoming messages
    socketRef.current.on('message', (data) => {
      const { event, payload } = data;
      const callbacks = callbacksRef.current.get(event);
      
      if (callbacks) {
        callbacks.forEach(callback => callback(payload));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const subscribe = useCallback((event, callback) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    callbacksRef.current.get(event).add(callback);
  }, []);

  const unsubscribe = useCallback((event, callback) => {
    if (callbacksRef.current.has(event)) {
      callbacksRef.current.get(event).delete(callback);
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    subscribe,
    unsubscribe,
    emit,
    connected: socketRef.current?.connected || false,
  };
};