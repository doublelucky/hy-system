import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Tabs, Tag, Card, Modal, Form, Input, Upload, App, Select, Space, AutoComplete } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getFirmwareList, uploadFirmware, deleteFirmware } from '../../api/firmware';
import type { Firmware, FirmwareType } from '../../types';
import { firmwareTypeLabels } from '../../types';

const firmwareTypes: FirmwareType[] = ['mcu', 'fpga'];

const statusConfig: Record<string, { color: string; label: string }> = {
  latest: { color: 'blue', label: '最新版' },
  stable: { color: 'green', label: '稳定版' },
  archived: { color: 'default', label: '已归档' },
};

const modelOptions: Record<FirmwareType, string[]> = {
  mcu: ['STM32F407', 'STM32F103', 'ESP32-S3', 'ESP32-C3', 'GD32F303'],
  fpga: ['XC7Z020', 'XC7Z010', 'XADC-1', 'XA7A35T'],
};

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function FirmwareManagement() {
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState<FirmwareType>('mcu');
  const [data, setData] = useState<Firmware[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelFilter, setModelFilter] = useState<string | undefined>();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [form] = Form.useForm();

  const fetchData = useCallback(async (type: FirmwareType, m?: string) => {
    setLoading(true);
    try {
      const res = await getFirmwareList(type, m);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab, modelFilter);
  }, [activeTab, modelFilter, fetchData]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as FirmwareType);
    setModelFilter(undefined);
  };

  const handleUpload = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    if (fileList.length === 0) {
      message.warning('请选择固件文件');
      return;
    }
    setUploading(true);
    try {
      const values = form.getFieldsValue();
      const res = await uploadFirmware(
        activeTab,
        fileList[0],
        values.name,
        values.model,
        values.version,
        values.compatibleDevices || '',
        values.changelog || '',
      );
      message.success(`固件 ${res.data.version} 上传成功`);
      setUploadOpen(false);
      form.resetFields();
      setFileList([]);
      fetchData(activeTab, modelFilter);
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (record: Firmware) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${record.name} (${record.model}) ${record.version} 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteFirmware(record.id, record.firmwareType);
        message.success('删除成功');
        fetchData(activeTab, modelFilter);
      },
    });
  };

  const handleNameChange = () => {
    // Reset model when name changes since different names have different models
    form.setFieldValue('model', undefined);
  };

  const columns: ColumnsType<Firmware> = [
    {
      title: '版本号', dataIndex: 'version', key: 'version', width: 110,
      render: (v: string, r) => (
        <span>
          <Tag color={statusConfig[r.status]?.color} style={{ marginRight: 6 }}>{statusConfig[r.status]?.label}</Tag>
          {v}
        </span>
      ),
    },
    { title: '固件名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '型号', dataIndex: 'model', key: 'model', width: 120 },
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', width: 220, ellipsis: true },
    {
      title: '大小', dataIndex: 'fileSize', key: 'fileSize', width: 100,
      render: (s: number) => formatSize(s),
    },
    { title: '兼容设备', dataIndex: 'compatibleDevices', key: 'compatibleDevices', width: 240, ellipsis: true },
    {
      title: '发布日期', dataIndex: 'releaseDate', key: 'releaseDate', width: 160,
      render: (d: string) => new Date(d).toLocaleString(),
    },
    {
      title: 'MD5', dataIndex: 'md5', key: 'md5', width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.slice(0, 12)}...</span>,
    },
    {
      title: '更新日志', dataIndex: 'changelog', key: 'changelog', width: 280, ellipsis: true,
    },
    {
      title: '操作', key: 'action', width: 80, fixed: 'right',
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
      ),
    },
  ];

  const nameOptions = activeTab === 'mcu'
    ? [{ label: 'STM32 主控固件', value: 'STM32 主控固件' }, { label: 'ESP32 通信模组固件', value: 'ESP32 通信模组固件' }]
    : [{ label: 'Xilinx 数据处理固件', value: 'Xilinx 数据处理固件' }, { label: '信号采集固件', value: '信号采集固件' }];

  return (
    <>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          tabBarExtraContent={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
              上传固件
            </Button>
          }
          items={firmwareTypes.map((type) => ({
            key: type,
            label: firmwareTypeLabels[type],
          }))}
        />
        <Space style={{ marginBottom: 12 }}>
          <Select
            placeholder="按型号筛选"
            value={modelFilter}
            onChange={setModelFilter}
            allowClear
            style={{ width: 180 }}
            options={modelOptions[activeTab].map((m) => ({ label: m, value: m }))}
          />
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={false}
        />
      </Card>

      <Modal
        title={`上传固件 - ${firmwareTypeLabels[activeTab]}`}
        open={uploadOpen}
        onOk={handleUpload}
        onCancel={() => {
          setUploadOpen(false);
          form.resetFields();
          setFileList([]);
        }}
        confirmLoading={uploading}
        okText="上传"
        cancelText="取消"
        destroyOnClose
        width={560}>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="固件名称" name="name" rules={[{ required: true, message: '请选择固件名称' }]}>
            <Select placeholder="选择固件名称" options={nameOptions} onChange={handleNameChange} />
          </Form.Item>
          <Form.Item label="型号" name="model" rules={[{ required: true, message: '请选择或输入型号' }]}>
            <AutoComplete
              placeholder="选择已有型号或输入新型号"
              options={modelOptions[activeTab].map((m) => ({ label: m, value: m }))}
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>
          <Form.Item label="版本号" name="version" rules={[{ required: true, message: '请输入版本号' }]}>
            <Input placeholder="如 v4.3.0" />
          </Form.Item>
          <Form.Item label="固件文件" required>
            <Upload.Dragger
              accept={activeTab === 'mcu' ? '.bin,.hex' : '.bit,.bin'}
              maxCount={1}
              beforeUpload={(file) => {
                setFileList([file]);
                return false;
              }}
              onRemove={() => setFileList([])}
              fileList={fileList.map((f: File) => ({
                uid: f.name,
                name: f.name,
                size: f.size,
                type: f.type,
              } as any))}>
              <p><UploadOutlined style={{ fontSize: 24 }} /></p>
              <p>点击或拖拽固件文件到此区域上传</p>
              <p style={{ color: '#999', fontSize: 12 }}>
                {activeTab === 'mcu' ? '支持 .bin / .hex 格式' : '支持 .bit / .bin 格式'}
              </p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item label="兼容设备" name="compatibleDevices">
            <Input placeholder="如：温湿度传感器 / 智能摄像头" />
          </Form.Item>
          <Form.Item label="更新日志" name="changelog" rules={[{ required: true, message: '请输入更新日志' }]}>
            <Input.TextArea rows={4} placeholder="请输入本次固件的更新内容" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
