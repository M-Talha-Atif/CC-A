import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useUserStore from '@/store/userStore';

export const useSocket = () => {
  const { user, isAuthenticated } = useUserStore();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      
      // Authenticate with user ID
      socket.emit('authenticate', user.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user?.id]);

  const onNewNotification = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new_notification', callback);
    }
  };

  const offNewNotification = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('new_notification', callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    onNewNotification,
    offNewNotification,
  };
};