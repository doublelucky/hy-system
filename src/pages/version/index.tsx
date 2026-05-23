import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Tabs, Tag, Card, Modal, Form, Input, Upload, App } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getVersionList, uploadVersion, deleteVersion } from '../../api/version';
import type { AppVersion, AppType } from '../../types';
import { appTypeLabels } from '../../types';

const appTypes: AppType[] = ['android', 'windows', 'linux'];

const statusConfig: Record<string, { color: string; label: string }> = {
  latest: { color: 'blue', label: '最新版' },
  stable: { color: 'green', label: '稳定版' },
  archived: { color: 'default', label: '已归档' },
};

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function VersionManagement() {
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState<AppType>('android');
  const [data, setData] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [changelog, setChangelog] = useState('');
  const [form] = Form.useForm();

  const fetchData = useCallback(async (type: AppType) => {
    setLoading(true);
    try {
      const res = await getVersionList(type);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as AppType);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择文件');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadVersion(activeTab, fileList[0], changelog);
      message.success(`版本 ${res.data.version} 上传成功`);
      setUploadOpen(false);
      form.resetFields();
      setFileList([]);
      setChangelog('');
      fetchData(activeTab);
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (record: AppVersion) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${record.version} (${record.fileName}) 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteVersion(record.id, record.appType);
        message.success('删除成功');
        fetchData(activeTab);
      },
    });
  };

  const columns: ColumnsType<AppVersion> = [
    {
      title: '版本号', dataIndex: 'version', key: 'version', width: 100,
      render: (v: string, r) => (
        <span>
          <Tag color={statusConfig[r.status]?.color} style={{ marginRight: 6 }}>{statusConfig[r.status]?.label}</Tag>
          {v}
        </span>
      ),
    },
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', width: 240, ellipsis: true },
    {
      title: '大小', dataIndex: 'fileSize', key: 'fileSize', width: 100,
      render: (s: number) => formatSize(s),
    },
    {
      title: '下载量', dataIndex: 'downloadCount', key: 'downloadCount', width: 100,
      render: (n: number) => n.toLocaleString(),
    },
    {
      title: '发布日期', dataIndex: 'releaseDate', key: 'releaseDate', width: 160,
      render: (d: string) => new Date(d).toLocaleString(),
    },
    { title: '最低系统', dataIndex: 'minOsVersion', key: 'minOsVersion', width: 150 },
    {
      title: 'MD5', dataIndex: 'md5', key: 'md5', width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.slice(0, 12)}...</span>,
    },
    {
      title: '更新日志', dataIndex: 'changelog', key: 'changelog', width: 260, ellipsis: true,
    },
    {
      title: '操作', key: 'action', width: 80, fixed: 'right',
      render: (_, record) => (
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
      ),
    },
  ];

  const acceptMap: Record<AppType, string> = {
    android: '.apk',
    windows: '.exe',
    linux: '.deb',
  };

  return (
    <>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          tabBarExtraContent={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
              上传版本
            </Button>
          }
          items={appTypes.map((type) => ({
            key: type,
            label: appTypeLabels[type],
          }))}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={false}
        />
      </Card>

      <Modal
        title={`上传版本 - ${appTypeLabels[activeTab]}`}
        open={uploadOpen}
        onOk={handleUpload}
        onCancel={() => {
          setUploadOpen(false);
          form.resetFields();
          setFileList([]);
          setChangelog('');
        }}
        confirmLoading={uploading}
        okText="上传"
        cancelText="取消"
        destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item label="版本包文件" required>
            <Upload.Dragger
              accept={acceptMap[activeTab]}
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
              <p>点击或拖拽文件到此区域上传</p>
              <p style={{ color: '#999', fontSize: 12 }}>
                仅支持 {acceptMap[activeTab]} 格式
              </p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item label="更新日志" required>
            <Input.TextArea
              rows={4}
              placeholder="请输入本次版本的更新内容"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
