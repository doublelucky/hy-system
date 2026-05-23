import type { ApiResponse, Device, DeviceLog, PaginatedData } from '../types';

const mockDevices: Device[] = Array.from({ length: 23 }, (_, i) => ({
  id: `DEV-${String(i + 1).padStart(4, '0')}`,
  name: `设备-${['温湿度传感器', '智能摄像头', '环境监测仪', '门禁控制器', '烟雾报警器'][i % 5]}${Math.floor(i / 5) + 1}`,
  type: ['sensor', 'camera', 'monitor', 'controller', 'alarm'][i % 5],
  status: (['online', 'online', 'online', 'offline', 'warning'] as const)[i % 5],
  ipAddress: `192.168.1.${100 + i}`,
  version: `v${1 + (i % 3)}.${i % 10}.${i % 5}`,
  lastOnline: new Date(Date.now() - (i % 7) * 3600000).toISOString(),
  description: `这是${['温湿度传感器', '智能摄像头', '环境监测仪', '门禁控制器', '烟雾报警器'][i % 5]}设备，负责${['环境数据采集', '视频监控', '环境综合监测', '出入口管控', '火灾预警'][i % 5]}。`,
}));

export async function getDeviceList(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}): Promise<ApiResponse<PaginatedData<Device>>> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  let list = [...mockDevices];

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter((d) => d.name.toLowerCase().includes(kw) || d.id.toLowerCase().includes(kw));
  }
  if (params.status) {
    list = list.filter((d) => d.status === params.status);
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const start = (page - 1) * pageSize;

  return {
    code: 0,
    data: { list: list.slice(start, start + pageSize), total: list.length, page, pageSize },
    message: 'ok',
  };
}

export async function getDeviceDetail(id: string): Promise<ApiResponse<Device>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const device = mockDevices.find((d) => d.id === id);
  if (!device) return { code: 404, data: null as unknown as Device, message: '设备不存在' };
  return { code: 0, data: device, message: 'ok' };
}

export async function getDeviceLogs(deviceId: string): Promise<ApiResponse<DeviceLog[]>> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const levels: DeviceLog['level'][] = ['info', 'info', 'info', 'warn', 'error'];
  const messages = [
    '设备启动完成',
    '固件版本检查通过',
    '定时数据上报成功',
    '内存使用率超过阈值 80%',
    '传感器数据读取异常，已重试',
    '网络连接恢复正常',
    '配置同步完成',
    'CPU 温度偏高',
  ];

  const logs: DeviceLog[] = Array.from({ length: 15 }, (_, i) => ({
    id: `log-${deviceId}-${i}`,
    deviceId,
    level: levels[i % levels.length],
    message: messages[i % messages.length],
    timestamp: new Date(Date.now() - i * 120000).toISOString(),
  }));

  return { code: 0, data: logs, message: 'ok' };
}

export async function pushMessageToDevices(deviceIds: string[]): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { code: 0, data: null, message: `已向 ${deviceIds.length} 台设备推送信息` };
}

export async function pushUpdateToDevices(deviceIds: string[], version: string): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { code: 0, data: null, message: `已向 ${deviceIds.length} 台设备推送更新 (${version})` };
}
