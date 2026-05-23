import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, App } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getDeviceDetail, getDeviceLogs } from '../../api/device';
import type { Device, DeviceLog } from '../../types';

const statusMap: Record<string, { color: string; label: string }> = {
  online: { color: 'success', label: '在线' },
  offline: { color: 'default', label: '离线' },
  warning: { color: 'warning', label: '告警' },
};

const typeMap: Record<string, string> = {
  sensor: '传感器',
  camera: '智能摄像头',
  monitor: '环境监测仪',
  controller: '门禁控制器',
  alarm: '烟雾报警器',
};

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [device, setDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getDeviceDetail(id);
      setDevice(res.data);
    } catch {
      message.error('获取设备详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!id) return;
    setLogLoading(true);
    try {
      const res = await getDeviceLogs(id);
      setLogs(res.data);
    } catch {
      message.error('获取日志失败');
    } finally {
      setLogLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchLogs();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/device')}>返回列表</Button>
      </div>

      <Card title="设备基本信息" loading={loading} style={{ marginBottom: 16 }}>
        {device && (
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="设备编号">{device.id}</Descriptions.Item>
            <Descriptions.Item label="设备名称">{device.name}</Descriptions.Item>
            <Descriptions.Item label="设备类型">{typeMap[device.type] || device.type}</Descriptions.Item>
            <Descriptions.Item label="运行状态">
              <Tag color={statusMap[device.status]?.color}>{statusMap[device.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="固件版本">{device.version}</Descriptions.Item>
            <Descriptions.Item label="IP 地址">{device.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="最后在线">{new Date(device.lastOnline).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="设备描述" span={2}>{device.description || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card
        title="设备日志"
        extra={<Button onClick={fetchLogs} loading={logLoading}>刷新日志</Button>}>
        <Table
          rowKey="id"
          loading={logLoading}
          dataSource={logs}
          size="small"
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          columns={[
            {
              title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180,
              render: (t: string) => new Date(t).toLocaleString(),
            },
            {
              title: '级别', dataIndex: 'level', key: 'level', width: 100,
              render: (level: string) => {
                const m: Record<string, string> = { info: 'blue', warn: 'orange', error: 'red' };
                return <Tag color={m[level]}>{level.toUpperCase()}</Tag>;
              },
            },
            { title: '日志内容', dataIndex: 'message', key: 'message' },
          ]}
        />
      </Card>
    </>
  );
}
