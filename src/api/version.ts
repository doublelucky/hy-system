import type { ApiResponse, AppVersion, AppType } from '../types';

const versionHistory: Record<AppType, AppVersion[]> = {
  android: [
    { id: 'v-android-3', appType: 'android', version: 'v2.3.0', fileName: 'heyiot-v2.3.0.apk', fileSize: 47_800_000, downloadCount: 3256, releaseDate: '2026-05-20T10:00:00Z', changelog: '新增设备分组功能；优化蓝牙连接稳定性；修复离线通知延迟问题', status: 'latest', minOsVersion: 'Android 8.0', md5: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6' },
    { id: 'v-android-2', appType: 'android', version: 'v2.2.1', fileName: 'heyiot-v2.2.1.apk', fileSize: 45_200_000, downloadCount: 12890, releaseDate: '2026-04-15T08:30:00Z', changelog: '修复推送通知权限问题；优化大屏适配', status: 'stable', minOsVersion: 'Android 8.0', md5: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7' },
    { id: 'v-android-1', appType: 'android', version: 'v2.1.0', fileName: 'heyiot-v2.1.0.apk', fileSize: 42_500_000, downloadCount: 25600, releaseDate: '2026-03-01T09:00:00Z', changelog: '全新 UI 改版；支持多设备同时管理', status: 'archived', minOsVersion: 'Android 7.0', md5: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8' },
  ],
  windows: [
    { id: 'v-windows-2', appType: 'windows', version: 'v3.1.0', fileName: 'HeyIoT-Setup-v3.1.0.exe', fileSize: 86_500_000, downloadCount: 4520, releaseDate: '2026-05-18T14:00:00Z', changelog: '新增批量设备导入导出；优化大屏数据可视化性能；修复 Win11 兼容性问题', status: 'latest', minOsVersion: 'Windows 10 64-bit', md5: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9' },
    { id: 'v-windows-1', appType: 'windows', version: 'v3.0.2', fileName: 'HeyIoT-Setup-v3.0.2.exe', fileSize: 82_100_000, downloadCount: 18900, releaseDate: '2026-04-10T11:00:00Z', changelog: '修复串口通信异常；新增数据导出为 Excel 功能', status: 'stable', minOsVersion: 'Windows 10 64-bit', md5: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0' },
  ],
  linux: [
    { id: 'v-linux-2', appType: 'linux', version: 'v3.1.0', fileName: 'heyiot_3.1.0_amd64.deb', fileSize: 52_300_000, downloadCount: 1890, releaseDate: '2026-05-18T14:30:00Z', changelog: '同步 Windows v3.1.0 功能；新增 systemd 服务管理', status: 'latest', minOsVersion: 'Ubuntu 20.04+', md5: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1' },
    { id: 'v-linux-1', appType: 'linux', version: 'v3.0.2', fileName: 'heyiot_3.0.2_amd64.deb', fileSize: 48_900_000, downloadCount: 5600, releaseDate: '2026-04-10T11:30:00Z', changelog: '修复 ARM64 平台兼容问题；新增命令行安装支持', status: 'stable', minOsVersion: 'Ubuntu 20.04+', md5: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2' },
  ],
};

export async function getVersionList(appType: AppType): Promise<ApiResponse<AppVersion[]>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { code: 0, data: versionHistory[appType] || [], message: 'ok' };
}

export async function uploadVersion(
  appType: AppType,
  file: File,
  changelog: string,
): Promise<ApiResponse<AppVersion>> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const ext = appType === 'android' ? 'apk' : appType === 'windows' ? 'exe' : 'deb';
  const version = `v${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
  const newVersion: AppVersion = {
    id: `v-${appType}-${Date.now()}`,
    appType,
    version,
    fileName: file.name || `heyiot-${version}.${ext}`,
    fileSize: file.size,
    downloadCount: 0,
    releaseDate: new Date().toISOString(),
    changelog,
    status: 'latest',
    minOsVersion: appType === 'android' ? 'Android 8.0' : appType === 'windows' ? 'Windows 10 64-bit' : 'Ubuntu 20.04+',
    md5: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  };

  // 将之前的 latest 降为 stable
  const list = versionHistory[appType];
  const prev = list.find((v) => v.status === 'latest');
  if (prev) prev.status = 'stable';
  list.unshift(newVersion);

  return { code: 0, data: newVersion, message: '上传成功' };
}

export async function deleteVersion(id: string, appType: AppType): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const list = versionHistory[appType];
  const idx = list.findIndex((v) => v.id === id);
  if (idx >= 0) list.splice(idx, 1);
  return { code: 0, data: null, message: '删除成功' };
}
