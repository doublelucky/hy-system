import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Tag, Card, App, Modal, Form } from 'antd';
import { SearchOutlined, ReloadOutlined, ApiOutlined, SendOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getDeviceList, getDeviceLogs, pushMessageToDevices, pushUpdateToDevices } from '../../api/device';
import type { Device, DeviceLog } from '../../types';

const statusMap: Record<string, { color: string; label: string }> = {
  online: { color: 'success', label: '在线' },
  offline: { color: 'default', label: '离线' },
  warning: { color: 'warning', label: '告警' },
};

export default function DeviceList() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [currentLogs, setCurrentLogs] = useState<DeviceLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

  const pageSize = 10;

  const fetchData = useCallback(async (p?: number, kw?: string, st?: string) => {
    setLoading(true);
    try {
      const res = await getDeviceList({
        page: p ?? page,
        pageSize,
        keyword: kw ?? keyword,
        status: st ?? statusFilter,
      });
      setData(res.data.list);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, statusFilter]);

  useEffect(() => {
    fetchData(1, keyword, statusFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1);
    fetchData(1, keyword, statusFilter);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter(undefined);
    setPage(1);
    fetchData(1, '', undefined);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p, keyword, statusFilter);
  };

  const handleViewLogs = async (device: Device) => {
    setCurrentDevice(device);
    setLogModalOpen(true);
    setLogLoading(true);
    try {
      const res = await getDeviceLogs(device.id);
      setCurrentLogs(res.data);
    } finally {
      setLogLoading(false);
    }
  };

  const handlePushMessage = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择设备');
      return;
    }
    modal.confirm({
      title: '推送信息',
      content: (
        <Input.TextArea placeholder="请输入要推送的信息" rows={4} />
      ),
      onOk: async () => {
        const res = await pushMessageToDevices(selectedRowKeys as string[]);
        message.success(res.message);
        setSelectedRowKeys([]);
      },
    });
  };

  const handlePushUpdate = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择设备');
      return;
    }
    let version = '';
    modal.confirm({
      title: '推送固件更新',
      content: (
        <Form layout="vertical">
          <Form.Item label="目标版本" required>
            <Input placeholder="如 v2.1.0" onChange={(e) => { version = e.target.value; }} />
          </Form.Item>
          <Form.Item label="更新说明">
            <Input.TextArea rows={3} placeholder="请输入更新内容说明" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        if (!version.trim()) {
          message.warning('请输入目标版本号');
          return Promise.reject();
        }
        const res = await pushUpdateToDevices(selectedRowKeys as string[], version);
        message.success(res.message);
        setSelectedRowKeys([]);
      },
    });
  };

  const columns: ColumnsType<Device> = [
    { title: '设备编号', dataIndex: 'id', key: 'id', width: 140 },
    {
      title: '设备名称', dataIndex: 'name', key: 'name', width: 180,
      render: (text: string, record) => (
        <a onClick={() => navigate(`/device/${record.id}`)}>{text}</a>
      ),
    },
    { title: '设备类型', dataIndex: 'type', key: 'type', width: 120 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>,
    },
    { title: '固件版本', dataIndex: 'version', key: 'version', width: 120 },
    { title: 'IP 地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 140 },
    {
      title: '最后在线', dataIndex: 'lastOnline', key: 'lastOnline', width: 180,
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: '操作', key: 'action', width: 100, fixed: 'right',
      render: (_, record) => (
        <Button type="link" icon={<ApiOutlined />} onClick={() => handleViewLogs(record)}>
          拉取日志
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索设备编号/名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="设备状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 140 }}
            options={[
              { label: '在线', value: 'online' },
              { label: '离线', value: 'offline' },
              { label: '告警', value: 'warning' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <Card
        title="设备列表"
        extra={
          <Space>
            <Button icon={<SendOutlined />} disabled={selectedRowKeys.length === 0} onClick={handlePushMessage}>
              推送信息 ({selectedRowKeys.length})
            </Button>
            <Button icon={<CloudUploadOutlined />} type="primary" disabled={selectedRowKeys.length === 0} onClick={handlePushUpdate}>
              推送更新 ({selectedRowKeys.length})
            </Button>
          </Space>
        }>
        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 台设备`,
            onChange: handlePageChange,
            showSizeChanger: false,
          }}
        />
      </Card>

      <Modal
        title={`设备日志 - ${currentDevice?.name || ''}`}
        open={logModalOpen}
        onCancel={() => setLogModalOpen(false)}
        footer={null}
        width={700}>
        <Table
          rowKey="id"
          loading={logLoading}
          dataSource={currentLogs}
          pagination={false}
          size="small"
          columns={[
            { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180,
              render: (t: string) => new Date(t).toLocaleString(),
            },
            {
              title: '级别', dataIndex: 'level', key: 'level', width: 80,
              render: (level: string) => {
                const m: Record<string, string> = { info: 'blue', warn: 'orange', error: 'red' };
                return <Tag color={m[level]}>{level.toUpperCase()}</Tag>;
              },
            },
            { title: '日志内容', dataIndex: 'message', key: 'message' },
          ]}
        />
      </Modal>
    </>
  );
}
