import type { ApiResponse, MediaFile, MediaFolder } from '../types';

const folders: MediaFolder[] = [
  { id: 'root', name: '全部文件', createdAt: '2026-01-01T00:00:00Z', fileCount: 0 },
  { id: 'f-1', name: '设备图片', createdAt: '2026-03-10T09:00:00Z', fileCount: 5 },
  { id: 'f-2', name: '固件截图', createdAt: '2026-04-15T14:30:00Z', fileCount: 3 },
  { id: 'f-3', name: '操作手册', createdAt: '2026-05-01T10:00:00Z', fileCount: 4 },
  { id: 'f-4', name: '告警录像', createdAt: '2026-05-10T08:00:00Z', fileCount: 2 },
  { id: 'f-5', name: '语音记录', createdAt: '2026-05-20T16:00:00Z', fileCount: 3 },
];

const mockColors = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

const files: MediaFile[] = [
  // 设备图片 folder
  { id: 'm-1', folderId: 'f-1', name: '温湿度传感器-正面.jpg', type: 'image', size: 2_400_000, url: '', uploadDate: '2026-03-12T10:00:00Z', width: 1920, height: 1080 },
  { id: 'm-2', folderId: 'f-1', name: '智能摄像头-安装图.jpg', type: 'image', size: 3_800_000, url: '', uploadDate: '2026-03-12T11:00:00Z', width: 2560, height: 1440 },
  { id: 'm-3', folderId: 'f-1', name: '门禁控制器-接线图.png', type: 'image', size: 1_200_000, url: '', uploadDate: '2026-03-15T09:30:00Z', width: 1200, height: 800 },
  { id: 'm-4', folderId: 'f-1', name: '环境监测仪-部署照.jpg', type: 'image', size: 5_100_000, url: '', uploadDate: '2026-04-01T14:00:00Z', width: 3840, height: 2160 },
  { id: 'm-5', folderId: 'f-1', name: '烟雾报警器-铭牌.jpg', type: 'image', size: 980_000, url: '', uploadDate: '2026-04-10T16:00:00Z', width: 800, height: 600 },
  // 固件截图 folder
  { id: 'm-6', folderId: 'f-2', name: 'MCU固件升级界面.png', type: 'image', size: 450_000, url: '', uploadDate: '2026-04-16T10:00:00Z', width: 1440, height: 900 },
  { id: 'm-7', folderId: 'f-2', name: 'FPGA配置工具截图.png', type: 'image', size: 520_000, url: '', uploadDate: '2026-04-18T11:30:00Z', width: 1920, height: 1080 },
  { id: 'm-8', folderId: 'f-2', name: 'OTA升级成功日志.png', type: 'image', size: 210_000, url: '', uploadDate: '2026-05-05T08:00:00Z', width: 1200, height: 800 },
  // 操作手册 folder
  { id: 'm-9', folderId: 'f-3', name: '设备安装指南-v3.1.pdf', type: 'document', size: 8_500_000, url: '', uploadDate: '2026-05-02T09:00:00Z' },
  { id: 'm-10', folderId: 'f-3', name: 'API接口文档-v2.0.pdf', type: 'document', size: 3_200_000, url: '', uploadDate: '2026-05-03T10:00:00Z' },
  { id: 'm-11', folderId: 'f-3', name: '系统运维手册.docx', type: 'document', size: 2_100_000, url: '', uploadDate: '2026-05-04T14:00:00Z' },
  { id: 'm-12', folderId: 'f-3', name: '固件升级操作说明.xlsx', type: 'document', size: 1_500_000, url: '', uploadDate: '2026-05-06T11:00:00Z' },
  // 告警录像 folder
  { id: 'm-13', folderId: 'f-4', name: '2026-05-12_温度异常告警.mp4', type: 'video', size: 45_000_000, url: '', uploadDate: '2026-05-12T14:23:00Z', duration: '03:25' },
  { id: 'm-14', folderId: 'f-4', name: '2026-05-15_门禁非法闯入.mp4', type: 'video', size: 28_000_000, url: '', uploadDate: '2026-05-15T02:15:00Z', duration: '01:58' },
  // 语音记录 folder
  { id: 'm-15', folderId: 'f-5', name: '2026-05-20_告警语音播报.mp3', type: 'audio', size: 320_000, url: '', uploadDate: '2026-05-20T16:30:00Z', duration: '00:25' },
  { id: 'm-16', folderId: 'f-5', name: '2026-05-21_巡检语音记录.wav', type: 'audio', size: 2_800_000, url: '', uploadDate: '2026-05-21T09:00:00Z', duration: '05:12' },
  { id: 'm-17', folderId: 'f-5', name: '2026-05-22_操作语音备忘.m4a', type: 'audio', size: 1_100_000, url: '', uploadDate: '2026-05-22T17:45:00Z', duration: '02:08' },
];

// Update file counts
folders.forEach((f) => {
  f.fileCount = files.filter((m) => m.folderId === f.id).length;
});
folders[0].fileCount = files.length;

export async function getFolders(): Promise<ApiResponse<MediaFolder[]>> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { code: 0, data: folders, message: 'ok' };
}

export async function getMediaFiles(folderId?: string): Promise<ApiResponse<MediaFile[]>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const list = folderId ? files.filter((f) => f.folderId === folderId) : files;
  return { code: 0, data: list, message: 'ok' };
}

export async function createFolder(name: string): Promise<ApiResponse<MediaFolder>> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const newFolder: MediaFolder = {
    id: `f-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    fileCount: 0,
  };
  folders.push(newFolder);
  return { code: 0, data: newFolder, message: '创建成功' };
}

export async function uploadMedia(
  file: File,
  folderId: string,
): Promise<ApiResponse<MediaFile>> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
  const audioExts = ['mp3', 'wav', 'm4a', 'ogg', 'flac'];
  let type: MediaFile['type'] = 'document';
  if (imageExts.includes(ext)) type = 'image';
  else if (videoExts.includes(ext)) type = 'video';
  else if (audioExts.includes(ext)) type = 'audio';

  const newFile: MediaFile = {
    id: `m-${Date.now()}`,
    folderId,
    name: file.name,
    type,
    size: file.size,
    url: '',
    uploadDate: new Date().toISOString(),
    width: type === 'image' ? 1920 : undefined,
    height: type === 'image' ? 1080 : undefined,
    duration: type === 'video' || type === 'audio' ? '00:00' : undefined,
  };
  files.push(newFile);

  const folder = folders.find((f) => f.id === folderId);
  if (folder) folder.fileCount++;
  folders[0].fileCount++;

  return { code: 0, data: newFile, message: '上传成功' };
}

export async function deleteMedia(id: string): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const idx = files.findIndex((f) => f.id === id);
  if (idx >= 0) {
    const file = files[idx];
    files.splice(idx, 1);
    const folder = folders.find((f) => f.id === file.folderId);
    if (folder) folder.fileCount--;
    folders[0].fileCount--;
  }
  return { code: 0, data: null, message: '删除成功' };
}

export async function deleteFolder(id: string): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const idx = folders.findIndex((f) => f.id === id);
  if (idx >= 0) {
    folders.splice(idx, 1);
    // Move files in this folder to root
    files.filter((f) => f.folderId === id).forEach((f) => {
      f.folderId = 'root';
    });
  }
  return { code: 0, data: null, message: '文件夹已删除，文件已移至根目录' };
}

export { mockColors };
