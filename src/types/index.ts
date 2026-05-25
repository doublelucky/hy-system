export interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  role: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'warning';
  ipAddress: string;
  version: string;
  lastOnline: string;
  description?: string;
}

export interface DeviceLog {
  id: string;
  deviceId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type AppType = 'android' | 'windows' | 'linux';

export interface AppVersion {
  id: string;
  appType: AppType;
  version: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  releaseDate: string;
  changelog: string;
  status: 'latest' | 'stable' | 'archived';
  minOsVersion: string;
  md5: string;
}

export const appTypeLabels: Record<AppType, string> = {
  android: 'Android APK',
  windows: 'Windows EXE',
  linux: 'Linux DEB',
};

export type FirmwareType = 'mcu' | 'fpga';

export interface Firmware {
  id: string;
  firmwareType: FirmwareType;
  name: string;
  model: string;
  version: string;
  fileName: string;
  fileSize: number;
  compatibleDevices: string;
  releaseDate: string;
  changelog: string;
  status: 'latest' | 'stable' | 'archived';
  md5: string;
}

export const firmwareTypeLabels: Record<FirmwareType, string> = {
  mcu: 'MCU 固件',
  fpga: 'FPGA 固件',
};

export interface MediaFolder {
  id: string;
  name: string;
  createdAt: string;
  fileCount: number;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface MediaFile {
  id: string;
  folderId: string;
  name: string;
  type: MediaType;
  size: number;
  url: string;
  uploadDate: string;
  width?: number;
  height?: number;
  duration?: string;
}

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  sortOrder: number;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}
