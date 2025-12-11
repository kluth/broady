import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  readonly connected = signal(false);

  constructor() {
    // In production, this URL should come from environment config
    this.socket = io('http://localhost:3333');

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected.set(false);
    });
  }

  // Generic listen method
  on<T>(event: string, callback: (data: T) => void): void {
    this.socket.on(event, callback);
  }

  // Generic emit method
  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  // Cleanup
  disconnect(): void {
    this.socket.disconnect();
  }
}
