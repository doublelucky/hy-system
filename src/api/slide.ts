import type { ApiResponse, Slide } from '../types';

const slideData: Slide[] = [
  {
    id: 'slide-1', title: 'HeyIoT 智能管理平台', subtitle: '全新 v3.0 版本发布，全面提升设备管理效率',
    imageUrl: '', link: '/dashboard', sortOrder: 1, status: 'published',
    createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-05-22T14:00:00Z',
  },
  {
    id: 'slide-2', title: '固件 OTA 升级方案', subtitle: '支持 MCU/FPGA 差分升级，设备固件一键推送',
    imageUrl: '', link: '/firmware', sortOrder: 2, status: 'published',
    createdAt: '2026-05-05T09:00:00Z', updatedAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'slide-3', title: '多平台客户端下载', subtitle: '支持 Android APK、Windows EXE、Linux DEB 安装包',
    imageUrl: '', link: '/version', sortOrder: 3, status: 'published',
    createdAt: '2026-05-10T08:00:00Z', updatedAt: '2026-05-18T16:00:00Z',
  },
  {
    id: 'slide-4', title: '设备批量推送功能上线', subtitle: '支持跨分页批量选择设备，推送消息和固件更新',
    imageUrl: '', link: '/device', sortOrder: 4, status: 'draft',
    createdAt: '2026-05-23T11:00:00Z', updatedAt: '2026-05-23T11:00:00Z',
  },
  {
    id: 'slide-5', title: '智能告警通知系统', subtitle: '实时监控设备状态，异常情况即时推送告警信息',
    imageUrl: '', link: '/dashboard', sortOrder: 5, status: 'draft',
    createdAt: '2026-05-24T09:00:00Z', updatedAt: '2026-05-24T09:00:00Z',
  },
];

export async function getSlideList(): Promise<ApiResponse<Slide[]>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const list = [...slideData].sort((a, b) => a.sortOrder - b.sortOrder);
  return { code: 0, data: list, message: 'ok' };
}

export async function getSlide(id: string): Promise<ApiResponse<Slide>> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const slide = slideData.find((s) => s.id === id);
  if (!slide) return { code: 404, data: null as unknown as Slide, message: '幻灯片不存在' };
  return { code: 0, data: slide, message: 'ok' };
}

export async function saveSlide(params: Omit<Slide, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiResponse<Slide>> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (params.id) {
    const idx = slideData.findIndex((s) => s.id === params.id);
    if (idx >= 0) {
      slideData[idx] = { ...slideData[idx], ...params, updatedAt: new Date().toISOString() };
      return { code: 0, data: slideData[idx], message: '保存成功' };
    }
  }

  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    ...params,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  slideData.push(newSlide);
  return { code: 0, data: newSlide, message: '创建成功' };
}

export async function deleteSlide(id: string): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const idx = slideData.findIndex((s) => s.id === id);
  if (idx >= 0) slideData.splice(idx, 1);
  return { code: 0, data: null, message: '删除成功' };
}
