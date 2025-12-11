import * as si from 'systeminformation';
import { Server } from 'socket.io';

export class GameProcessService {
  private io: Server;
  private checkInterval: NodeJS.Timeout | null = null;
  private knownGames = [
    { name: 'League of Legends', process: 'LeagueClient.exe' },
    { name: 'Valorant', process: 'VALORANT.exe' },
    { name: 'Counter-Strike 2', process: 'cs2.exe' },
    { name: 'Fortnite', process: 'FortniteClient-Win64-Shipping.exe' },
    { name: 'Minecraft', process: 'Minecraft.exe' },
    { name: 'Minecraft', process: 'javaw.exe' },
    { name: 'Overwatch', process: 'Overwatch.exe' },
    { name: 'Call of Duty', process: 'cod.exe' },
    { name: 'Apex Legends', process: 'r5apex.exe' },
    { name: 'Rocket League', process: 'r5apex.exe' },
    { name: 'Grand Theft Auto V', process: 'RocketLeague.exe' },
    { name: 'Dota 2', process: 'dota2.exe' },
    { name: 'World of Warcraft', process: 'Wow.exe' },
    { name: 'Among Us', process: 'Among Us.exe' },
    { name: 'Roblox', process: 'RobloxPlayerBeta.exe' }
  ];

  constructor(io: Server) {
    this.io = io;
    this.startMonitoring();
  }

  private startMonitoring() {
    // Check every 5 seconds
    this.checkInterval = setInterval(async () => {
      await this.checkRunningProcesses();
    }, 5000);
  }

  private async checkRunningProcesses() {
    try {
      const processes = await si.processes();
      const runningList = processes.list;

      const detectedGames: any[] = [];

      for (const game of this.knownGames) {
        const found = runningList.find(p => 
          p.name.toLowerCase() === game.process.toLowerCase() || 
          p.command.toLowerCase().includes(game.process.toLowerCase())
        );

        if (found) {
          detectedGames.push({
            name: game.name,
            processName: game.process,
            pid: found.pid,
            cpu: found.cpu,
            memory: found.mem,
            startTime: new Date(Date.now() - (found.started ? (Date.now() - Date.parse(found.started)) : 0)) // Estimate start time
          });
        }
      }

      if (detectedGames.length > 0) {
        this.io.emit('games:detected', detectedGames);
      } else {
        this.io.emit('games:detected', []);
      }

    } catch (error) {
      console.error('Error checking processes:', error);
    }
  }

  public getKnownGames() {
    return this.knownGames;
  }
}
