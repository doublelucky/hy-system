import { useEffect, useState, useCallback } from 'react';
import { Card, Button, Modal, Upload, App, Descriptions, List, Typography, Popconfirm, Tooltip } from 'antd';
import {
  UploadOutlined, FolderAddOutlined, FolderOutlined, FileImageOutlined,
  VideoCameraOutlined, AudioOutlined, FileTextOutlined, DeleteOutlined,
  EyeOutlined, FileOutlined,
} from '@ant-design/icons';
import { getFolders, getMediaFiles, createFolder, uploadMedia, deleteMedia, deleteFolder, mockColors } from '../../api/media';
import type { MediaFile, MediaFolder, MediaType } from '../../types';

const typeIcons: Record<MediaType, React.ReactNode> = {
  image: <FileImageOutlined />,
  video: <VideoCameraOutlined />,
  audio: <AudioOutlined />,
  document: <FileTextOutlined />,
};

const typeLabels: Record<MediaType, string> = {
  image: '图片',
  video: '视频',
  audio: '音频',
  document: '文档',
};

const acceptAll = '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.mp4,.avi,.mov,.mkv,.mp3,.wav,.m4a,.ogg,.pdf,.doc,.docx,.xls,.xlsx,.txt';

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
}

let thumbColorIdx = 0;
function getThumbColor() {
  return mockColors[thumbColorIdx++ % mockColors.length];
}

export default function MediaManagement() {
  const { message } = App.useApp();
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('root');
  const [, setLoading] = useState(false);
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  const fetchFolders = useCallback(async () => {
    const res = await getFolders();
    setFolders(res.data);
  }, []);

  const fetchFiles = useCallback(async (folderId?: string) => {
    setLoading(true);
    try {
      const res = await getMediaFiles(folderId === 'root' ? undefined : folderId);
      setFiles(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchFiles(activeFolder);
  }, [activeFolder, fetchFiles]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.warning('请输入文件夹名称');
      return;
    }
    await createFolder(newFolderName.trim());
    message.success(`文件夹「${newFolderName.trim()}」创建成功`);
    setNewFolderName('');
    setFolderModalOpen(false);
    fetchFolders();
  };

  const handleUpload = async (file: File) => {
    await uploadMedia(file, activeFolder === 'root' ? 'root' : activeFolder);
    message.success(`文件「${file.name}」上传成功`);
    fetchFiles(activeFolder);
    fetchFolders();
    return false; // Prevent default upload
  };

  const handleDeleteFile = async (id: string) => {
    await deleteMedia(id);
    message.success('删除成功');
    fetchFiles(activeFolder);
    fetchFolders();
    if (detailFile?.id === id) setDetailFile(null);
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
    message.success('文件夹已删除');
    setActiveFolder('root');
    fetchFolders();
    fetchFiles('root');
  };

  const activeFolderName = folders.find((f) => f.id === activeFolder)?.name || '全部文件';

  const renderThumbnail = (file: MediaFile) => {
    if (file.type === 'image') {
      const bg = getThumbColor();
      return (
        <div
          style={{
            width: '100%', height: 160, background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '8px 8px 0 0', overflow: 'hidden',
          }}>
          <FileImageOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.7)' }} />
        </div>
      );
    }
    if (file.type === 'video') {
      return (
        <div style={{
          width: '100%', height: 160, background: '#1a1a2e',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRadius: '8px 8px 0 0', position: 'relative',
        }}>
          <VideoCameraOutlined style={{ fontSize: 36, color: 'rgba(255,255,255,0.6)' }} />
          {file.duration && (
            <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{file.duration}</span>
          )}
        </div>
      );
    }
    if (file.type === 'audio') {
      return (
        <div style={{
          width: '100%', height: 160, background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRadius: '8px 8px 0 0',
        }}>
          <AudioOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.8)' }} />
          {file.duration && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>{file.duration}</span>}
        </div>
      );
    }
    return (
      <div style={{
        width: '100%', height: 160, background: '#595959',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '8px 8px 0 0',
      }}>
        <FileTextOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.6)' }} />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 600 }}>
      {/* Folder sidebar */}
      <Card
        title="文件夹"
        size="small"
        style={{ width: 260, flexShrink: 0 }}
        extra={
          <Button type="text" size="small" icon={<FolderAddOutlined />} onClick={() => setFolderModalOpen(true)} />
        }>
        <List
          size="small"
          dataSource={folders}
          renderItem={(folder) => (
            <List.Item
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              style={{
                cursor: 'pointer', padding: '8px 12px', borderRadius: 6,
                background: activeFolder === folder.id ? '#e6f4ff' : 'transparent',
                marginBottom: 2,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <FolderOutlined style={{ color: '#faad14' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                <span style={{ color: '#999', fontSize: 12, flexShrink: 0 }}>{folder.fileCount}</span>
              </div>
              {folder.id !== 'root' && (
                <Popconfirm
                  title={`确定删除文件夹「${folder.name}」？文件将移至根目录。`}
                  onConfirm={() => handleDeleteFolder(folder.id)}
                  placement="right">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                </Popconfirm>
              )}
            </List.Item>
          )}
          style={{ maxHeight: 480, overflowY: 'auto' }}
        />
      </Card>

      {/* Main content */}
      <Card
        title={activeFolderName}
        style={{ flex: 1 }}
        extra={
          <Upload.Dragger
            accept={acceptAll}
            maxCount={1}
            showUploadList={false}
            beforeUpload={handleUpload}
            style={{ display: 'inline-block' }}>
            <Button type="primary" icon={<UploadOutlined />}>上传文件</Button>
          </Upload.Dragger>
        }>
        {files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
            <FileOutlined style={{ fontSize: 48, marginBottom: 12 }} />
            <p>此文件夹为空</p>
            <p style={{ fontSize: 12 }}>拖拽文件或点击「上传文件」按钮添加资源</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {files.map((file) => (
              <Card
                key={file.id}
                hoverable
                size="small"
                cover={renderThumbnail(file)}
                onClick={() => setDetailFile(file)}
                actions={[
                  <Tooltip title="查看详情" key="view"><EyeOutlined /></Tooltip>,
                  <Tooltip title="删除" key="delete">
                    <DeleteOutlined
                      style={{ color: '#f5222d' }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                    />
                  </Tooltip>,
                ]}
                bodyStyle={{ padding: '10px 12px' }}>
                <Card.Meta
                  title={
                    <Typography.Text ellipsis style={{ fontSize: 13, maxWidth: '100%' }}>
                      {typeIcons[file.type]} {file.name}
                    </Typography.Text>
                  }
                  description={
                    <div style={{ fontSize: 11, color: '#999' }}>
                      <span>{formatSize(file.size)}</span>
                      <span style={{ margin: '0 6px' }}>|</span>
                      <span>{typeLabels[file.type]}</span>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Modal
        title={detailFile?.name}
        open={!!detailFile}
        onCancel={() => setDetailFile(null)}
        footer={
          <Button danger icon={<DeleteOutlined />} onClick={() => detailFile && handleDeleteFile(detailFile.id)}>
            删除文件
          </Button>
        }
        width={640}>
        {detailFile && (
          <>
            <div style={{
              width: '100%', height: 300, background: detailFile.type === 'image' ? getThumbColor() : '#f5f5f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 16,
            }}>
              {detailFile.type === 'image' && <FileImageOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.6)' }} />}
              {detailFile.type === 'video' && <VideoCameraOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
              {detailFile.type === 'audio' && <AudioOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />}
              {detailFile.type === 'document' && <FileTextOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />}
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="文件名" span={2}>{detailFile.name}</Descriptions.Item>
              <Descriptions.Item label="文件类型">{typeLabels[detailFile.type]}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{formatSize(detailFile.size)}</Descriptions.Item>
              {detailFile.width && detailFile.height && (
                <Descriptions.Item label="尺寸">{detailFile.width} x {detailFile.height}</Descriptions.Item>
              )}
              {detailFile.duration && (
                <Descriptions.Item label="时长">{detailFile.duration}</Descriptions.Item>
              )}
              {detailFile.type === 'document' && <Descriptions.Item label="尺寸">-</Descriptions.Item>}
              <Descriptions.Item label="上传时间" span={2}>{new Date(detailFile.uploadDate).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* New folder modal */}
      <Modal
        title="新建文件夹"
        open={folderModalOpen}
        onOk={handleCreateFolder}
        onCancel={() => { setFolderModalOpen(false); setNewFolderName(''); }}
        okText="创建"
        cancelText="取消">
        <input
          type="text"
          placeholder="请输入文件夹名称"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          style={{
            width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6,
            fontSize: 14, outline: 'none',
          }}
          autoFocus
        />
      </Modal>
    </div>
  );
}
