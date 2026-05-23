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
