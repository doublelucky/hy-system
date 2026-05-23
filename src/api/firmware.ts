import type { ApiResponse, Firmware, FirmwareType } from '../types';

const firmwareData: Record<FirmwareType, Firmware[]> = {
  mcu: [
    {
      id: 'fw-mcu-4', firmwareType: 'mcu', name: 'STM32 主控固件', model: 'STM32F407',
      version: 'v4.2.1', fileName: 'stm32-main-v4.2.1.bin', fileSize: 512_000,
      compatibleDevices: '温湿度传感器 / 环境监测仪 / 烟雾报警器',
      releaseDate: '2026-05-22T09:00:00Z',
      changelog: '修复 SPI 通信偶发超时问题；优化低功耗模式功耗降低 15%；新增传感器自校准流程',
      status: 'latest', md5: '1a2b3c4d5e6f7890abcdef1234567890',
    },
    {
      id: 'fw-mcu-3', firmwareType: 'mcu', name: 'STM32 主控固件', model: 'STM32F407',
      version: 'v4.1.0', fileName: 'stm32-main-v4.1.0.bin', fileSize: 498_000,
      compatibleDevices: '温湿度传感器 / 环境监测仪 / 烟雾报警器',
      releaseDate: '2026-04-20T10:30:00Z',
      changelog: '新增 OTA 差分升级支持；优化 ADC 采样精度；修复看门狗复位后状态丢失',
      status: 'stable', md5: '2b3c4d5e6f7890abcdef12345678901a',
    },
    {
      id: 'fw-mcu-2', firmwareType: 'mcu', name: 'ESP32 通信模组固件', model: 'ESP32-S3',
      version: 'v3.0.0', fileName: 'esp32-comm-v3.0.0.bin', fileSize: 1_280_000,
      compatibleDevices: '智能摄像头 / 门禁控制器',
      releaseDate: '2026-05-15T08:00:00Z',
      changelog: '升级 Wi-Fi 协议栈至最新版；新增 Mesh 组网功能；优化 TLS 握手速度',
      status: 'latest', md5: '3c4d5e6f7890abcdef123456789012ab',
    },
    {
      id: 'fw-mcu-1', firmwareType: 'mcu', name: 'ESP32 通信模组固件', model: 'ESP32-S3',
      version: 'v2.8.1', fileName: 'esp32-comm-v2.8.1.bin', fileSize: 1_100_000,
      compatibleDevices: '智能摄像头 / 门禁控制器',
      releaseDate: '2026-03-10T14:00:00Z',
      changelog: '修复长时间运行内存泄漏；优化 MQTT 重连机制',
      status: 'stable', md5: '4d5e6f7890abcdef1234567890123abc',
    },
  ],
  fpga: [
    {
      id: 'fw-fpga-3', firmwareType: 'fpga', name: 'Xilinx 数据处理固件', model: 'XC7Z020',
      version: 'v2.3.0', fileName: 'xilinx-datapath-v2.3.0.bit', fileSize: 8_500_000,
      compatibleDevices: '智能摄像头 / 环境监测仪',
      releaseDate: '2026-05-20T11:00:00Z',
      changelog: '优化图像处理流水线吞吐量提升 30%；新增 H.265 硬编码支持；修复 HDR 模式色偏',
      status: 'latest', md5: '5e6f7890abcdef12345678901234abcd',
    },
    {
      id: 'fw-fpga-2', firmwareType: 'fpga', name: 'Xilinx 数据处理固件', model: 'XC7Z020',
      version: 'v2.2.0', fileName: 'xilinx-datapath-v2.2.0.bit', fileSize: 8_200_000,
      compatibleDevices: '智能摄像头 / 环境监测仪',
      releaseDate: '2026-04-05T09:30:00Z',
      changelog: '新增神经网络推理加速引擎；优化 DMA 传输效率',
      status: 'stable', md5: '6f7890abcdef123456789012345abcde',
    },
    {
      id: 'fw-fpga-1', firmwareType: 'fpga', name: '信号采集固件', model: 'XADC-1',
      version: 'v1.5.1', fileName: 'adc-fpga-v1.5.1.bit', fileSize: 3_200_000,
      compatibleDevices: '温湿度传感器 / 烟雾报警器',
      releaseDate: '2026-05-18T16:00:00Z',
      changelog: '提升 ADC 采样率至 1MSPS；优化数字滤波算法；修复高温环境下时序违规',
      status: 'latest', md5: '7890abcdef1234567890123456abcdef',
    },
  ],
};

export async function getFirmwareList(
  firmwareType: FirmwareType,
  model?: string,
): Promise<ApiResponse<Firmware[]>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  let list = firmwareData[firmwareType] || [];
  if (model) {
    list = list.filter((f) => f.model === model);
  }
  return { code: 0, data: list, message: 'ok' };
}

export async function uploadFirmware(
  firmwareType: FirmwareType,
  file: File,
  name: string,
  model: string,
  version: string,
  compatibleDevices: string,
  changelog: string,
): Promise<ApiResponse<Firmware>> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const newFirmware: Firmware = {
    id: `fw-${firmwareType}-${Date.now()}`,
    firmwareType,
    name,
    model,
    version,
    fileName: file.name,
    fileSize: file.size,
    compatibleDevices: compatibleDevices || '-',
    releaseDate: new Date().toISOString(),
    changelog,
    status: 'latest',
    md5: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  };

  const list = firmwareData[firmwareType];
  const prev = list.find((f) => f.status === 'latest' && f.name === name && f.model === model);
  if (prev) prev.status = 'stable';
  list.unshift(newFirmware);

  return { code: 0, data: newFirmware, message: '上传成功' };
}

export async function deleteFirmware(id: string, firmwareType: FirmwareType): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const list = firmwareData[firmwareType];
  const idx = list.findIndex((f) => f.id === id);
  if (idx >= 0) list.splice(idx, 1);
  return { code: 0, data: null, message: '删除成功' };
}
