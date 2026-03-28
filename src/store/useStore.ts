import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'employee';
  balance: number;
  lat: number;
  lng: number;
}

interface AppState {
  user: User | null;
  socket: any | null;
  notifications: any[];
  setUser: (user: User | null) => void;
  initSocket: () => void;
  addNotification: (notification: any) => void;
  clearNotifications: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  socket: null,
  notifications: [],
  setUser: (user) => {
    set({ user });
    if (user) {
      get().initSocket();
    }
  },
  initSocket: () => {
    const user = get().user;
    if (!user) return;
    
    const socket = io();
    socket.emit('join_user', user.id);
    
    socket.on('notification', async (notification) => {
      set((state) => ({ notifications: [notification, ...state.notifications] }));
      
      if (notification.type === 'JOB_COMPLETED') {
        const user = get().user;
        if (user) {
          const res = await fetch(`/api/users/${user.id}`);
          if (res.ok) {
            const updatedUser = await res.json();
            set({ user: updatedUser });
          }
        }
      }
    });
    
    set({ socket });
  },
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
  clearNotifications: () => set({ notifications: [] }),
}));
