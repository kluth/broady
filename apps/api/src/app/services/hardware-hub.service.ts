import { Server } from 'socket.io';

export class HardwareHubService {
  private io: Server;
  
  // Simulated connected devices
  private streamDecks: any[] = [];
  private audioInterfaces: any[] = [];

  constructor(io: Server) {
    this.io = io;
    this.initializeVirtualDevices();
    this.setupSocketListeners();
  }

  private initializeVirtualDevices() {
    // Simulate a Stream Deck XL
    this.streamDecks.push({
      id: 'sd-virtual-1',
      model: 'stream-deck-xl',
      serialNumber: 'VIRTUAL-SD-XL-001',
      name: 'Virtual Stream Deck XL',
      rows: 4,
      columns: 8,
      keyCount: 32,
      connected: true,
      brightness: 75
    });

    // Simulate a GoXLR
    this.audioInterfaces.push({
      id: 'goxlr-virtual-1',
      type: 'goxlr',
      name: 'Virtual GoXLR',
      manufacturer: 'TC Helicon',
      connected: true,
      inputs: 4,
      outputs: 4
    });
  }

  private setupSocketListeners() {
    this.io.on('connection', (socket) => {
      
      // Request initial device lists
      socket.on('hardware:list-devices', () => {
        socket.emit('hardware:devices', {
          streamDecks: this.streamDecks,
          audioInterfaces: this.audioInterfaces
        });
      });

      // Stream Deck Actions
      socket.on('streamdeck:set-brightness', (data) => {
        const device = this.streamDecks.find(d => d.id === data.deviceId);
        if (device) {
          device.brightness = data.brightness;
          this.io.emit('streamdeck:status', device); // Broadcast update
        }
      });

      socket.on('streamdeck:simulate-press', (data) => {
        // Allow frontend to simulate physical button press via API for testing
        this.io.emit('streamdeck:key-down', {
          deviceId: data.deviceId,
          keyIndex: data.keyIndex
        });
        
        setTimeout(() => {
          this.io.emit('streamdeck:key-up', {
            deviceId: data.deviceId,
            keyIndex: data.keyIndex
          });
        }, 150);
      });

      // Audio Actions
      socket.on('audio:set-fader', (data) => {
        // Broadcast fader move to all clients (sync UI)
        this.io.emit('audio:fader-moved', data);
      });

    });
  }
}
