import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

let socket: Socket | null = null;

/**
 * Lazy singleton socket.io connection (same origin → proxied to the API).
 * The access token is read fresh on every (re)connect so it survives refresh.
 */
export function getSocket(): Socket {
  socket ??= io({
    path: '/socket.io',
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken ?? '' }),
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
