export interface HIDDevice {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  deviceId?: string;
  path?: string;
  opened?: boolean;
  close(): Promise<void>;
  sendFeatureReport(reportId: number, data: number[] | Uint8Array): Promise<void>;
  sendReport(reportId: number, data: number[] | Uint8Array): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): this;
}
