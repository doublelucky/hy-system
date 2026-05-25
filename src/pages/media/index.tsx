import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Button, Modal, Upload, App, Descriptions, List, Typography, Popconfirm, Tooltip, Spin, Drawer, Progress, Badge } from 'antd';
import {
  UploadOutlined, FolderAddOutlined, FolderOutlined, FileImageOutlined,
  VideoCameraOutlined, AudioOutlined, FileTextOutlined, DeleteOutlined,
  EyeOutlined, FileOutlined, PauseCircleOutlined, CaretRightOutlined,
  CloseCircleOutlined, CheckCircleOutlined, CloudUploadOutlined,
} from '@ant-design/icons';
import {
  getFolders, getMediaFiles, createFolder, deleteMedia, deleteFolder, mockColors,
  checkUploadStatus, uploadChunk, mergeChunks, abortUpload, CHUNK_SIZE,
} from '../../api/media';
import type { MediaFile, MediaFolder, MediaType } from '../../types';

const PAGE_SIZE = 8;

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

// ---------- upload task types ----------

type TaskStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'error';

interface UploadTask {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  uploadedChunks: number;
  status: TaskStatus;
  /** Chunk indices that have been confirmed uploaded by server */
  completedChunkSet: Set<number>;
  error?: string;
}

// ---------- helpers ----------

function generateFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

// ---------- component ----------

export default function MediaManagement() {
  const { message } = App.useApp();
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('root');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const taskControlRefs = useRef<Map<string, { paused: boolean; aborted: boolean }>>(new Map());

  // ---------- folder & file fetching ----------

  const fetchFolders = useCallback(async () => {
    const res = await getFolders();
    setFolders(res.data);
  }, []);

  const fetchFiles = useCallback(async (folderId?: string, p = 1, append = false) => {
    if (p === 1) { setLoading(true); } else { setLoadingMore(true); }
    try {
      const res = await getMediaFiles(folderId === 'root' ? undefined : folderId, p, PAGE_SIZE);
      const { list, hasMore: more } = res.data;
      setFiles((prev) => append ? [...prev, ...list] : list);
      setHasMore(more);
      setPage(p);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchFiles(activeFolder, page + 1, true);
  }, [activeFolder, page, hasMore, loadingMore, fetchFiles]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);
  useEffect(() => { fetchFiles(activeFolder, 1, false); }, [activeFolder, fetchFiles]);

  // ---------- folder actions ----------

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { message.warning('请输入文件夹名称'); return; }
    await createFolder(newFolderName.trim());
    message.success(`文件夹「${newFolderName.trim()}」创建成功`);
    setNewFolderName('');
    setFolderModalOpen(false);
    fetchFolders();
  };

  const handleDeleteFile = async (id: string) => {
    await deleteMedia(id);
    message.success('删除成功');
    fetchFiles(activeFolder, 1, false);
    fetchFolders();
    if (detailFile?.id === id) setDetailFile(null);
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
    message.success('文件夹已删除');
    setActiveFolder('root');
    fetchFolders();
    fetchFiles('root', 1, false);
  };

  // ---------- chunked upload ----------

  const updateTask = (id: string, patch: Partial<UploadTask>) => {
    setUploadTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const startChunkedUpload = async (task: UploadTask, file: File) => {
    const { id, fileId, totalChunks } = task;
    const control = taskControlRefs.current.get(id)!;

    // Load persisted chunk progress from localStorage
    const storageKey = `upload-${fileId}`;
    const saved = localStorage.getItem(storageKey);
    let completedChunks = new Set<number>();
    if (saved) {
      try { completedChunks = new Set(JSON.parse(saved)); } catch { /* ignore */ }
    }

    // Check server-side uploaded chunks (for resume after page refresh / network loss)
    try {
      const res = await checkUploadStatus(fileId, totalChunks);
      res.data.uploadedChunks.forEach((c) => completedChunks.add(c));
    } catch { /* proceed without resume */ }

    if (control.aborted) return;

    updateTask(id, { status: 'uploading', uploadedChunks: 0, completedChunkSet: completedChunks });

    for (let i = 0; i < totalChunks; i++) {
      // Check pause/abort before each chunk
      while (control.paused && !control.aborted) {
        await new Promise((r) => setTimeout(r, 300));
      }
      if (control.aborted) {
        updateTask(id, { status: 'paused' });
        return;
      }

      if (completedChunks.has(i)) {
        // Already uploaded — skip
        updateTask(id, { uploadedChunks: i + 1 });
        continue;
      }

      try {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(fileId, i, totalChunks, chunk, file.name);

        completedChunks.add(i);
        // Persist to localStorage for resume
        localStorage.setItem(storageKey, JSON.stringify([...completedChunks]));
        updateTask(id, { uploadedChunks: i + 1, completedChunkSet: new Set(completedChunks) });
      } catch {
        updateTask(id, { status: 'error', error: `分片 ${i + 1} 上传失败，可恢复上传` });
        return;
      }
    }

    // All chunks done — merge
    updateTask(id, { status: 'uploading' });
    try {
      await mergeChunks(fileId, file.name, activeFolder === 'root' ? 'root' : activeFolder, totalChunks);
      localStorage.removeItem(storageKey);
      updateTask(id, { status: 'completed' });
      message.success(`「${file.name}」上传完成`);
      fetchFiles(activeFolder, 1, false);
      fetchFolders();
    } catch {
      updateTask(id, { status: 'error', error: '合并失败，请重新上传' });
    }
  };

  const handleFileSelect = (file: File) => {
    const fileId = generateFileId(file);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const id = `task-${Date.now()}`;

    const task: UploadTask = {
      id, fileId, fileName: file.name, fileSize: file.size,
      totalChunks, uploadedChunks: 0, status: 'pending', completedChunkSet: new Set(),
    };

    taskControlRefs.current.set(id, { paused: false, aborted: false });
    setUploadTasks((prev) => [...prev, task]);
    setUploadDrawerOpen(true);

    // Start upload in background
    setTimeout(() => startChunkedUpload(task, file), 100);
    return false; // prevent default upload
  };

  const handlePauseTask = (task: UploadTask) => {
    const control = taskControlRefs.current.get(task.id);
    if (!control) return;
    if (control.paused) {
      control.paused = false;
      updateTask(task.id, { status: 'uploading' });
    } else {
      control.paused = true;
      updateTask(task.id, { status: 'paused' });
    }
  };

  const handleRemoveTask = async (task: UploadTask) => {
    const control = taskControlRefs.current.get(task.id);
    if (control) control.aborted = true;
    taskControlRefs.current.delete(task.id);
    await abortUpload(task.fileId);
    localStorage.removeItem(`upload-${task.fileId}`);
    setUploadTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  // ---------- derived ----------

  const activeFolderName = folders.find((f) => f.id === activeFolder)?.name || '全部文件';
  const activeTasks = uploadTasks.filter((t) => t.status === 'uploading');
  const completedTasks = uploadTasks.filter((t) => t.status === 'completed');

  // ---------- thumbnails ----------

  const renderThumbnail = (file: MediaFile) => {
    if (file.type === 'image') {
      const bg = getThumbColor();
      return (
        <div style={{ width: '100%', height: 160, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
          <FileImageOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.7)' }} />
        </div>
      );
    }
    if (file.type === 'video') {
      return (
        <div style={{ width: '100%', height: 160, background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px 8px 0 0', position: 'relative' }}>
          <VideoCameraOutlined style={{ fontSize: 36, color: 'rgba(255,255,255,0.6)' }} />
          {file.duration && <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{file.duration}</span>}
        </div>
      );
    }
    if (file.type === 'audio') {
      return (
        <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '8px 8px 0 0' }}>
          <AudioOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.8)' }} />
          {file.duration && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>{file.duration}</span>}
        </div>
      );
    }
    return (
      <div style={{ width: '100%', height: 160, background: '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px 8px 0 0' }}>
        <FileTextOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.6)' }} />
      </div>
    );
  };

  // ---------- UI ----------

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 600 }}>
      {/* Folder sidebar */}
      <Card title="文件夹" size="small" style={{ width: 260, flexShrink: 0 }}
        extra={<Button type="text" size="small" icon={<FolderAddOutlined />} onClick={() => setFolderModalOpen(true)} />}>
        <List size="small" dataSource={folders}
          renderItem={(folder) => (
            <List.Item key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 6, background: activeFolder === folder.id ? '#e6f4ff' : 'transparent', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <FolderOutlined style={{ color: '#faad14' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                <span style={{ color: '#999', fontSize: 12, flexShrink: 0 }}>{folder.fileCount}</span>
              </div>
              {folder.id !== 'root' && (
                <Popconfirm title={`确定删除文件夹「${folder.name}」？文件将移至根目录。`} onConfirm={() => handleDeleteFolder(folder.id)} placement="right">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                </Popconfirm>
              )}
            </List.Item>
          )}
          style={{ maxHeight: 480, overflowY: 'auto' }}
        />
      </Card>

      {/* Main content */}
      <Card title={activeFolderName} style={{ flex: 1 }}
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Upload.Dragger accept={acceptAll} maxCount={1} showUploadList={false} beforeUpload={handleFileSelect} style={{ display: 'inline-block' }}>
              <Button type="primary" icon={<UploadOutlined />}>上传文件</Button>
            </Upload.Dragger>
            {uploadTasks.length > 0 && (
              <Badge count={activeTasks.length} offset={[-4, 4]}>
                <Button icon={<CloudUploadOutlined />} onClick={() => setUploadDrawerOpen(true)}>
                  上传进度
                </Button>
              </Badge>
            )}
          </div>
        }>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
            <Spin size="large" /><p style={{ marginTop: 12 }}>加载中...</p>
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
            <FileOutlined style={{ fontSize: 48, marginBottom: 12 }} />
            <p>此文件夹为空</p>
            <p style={{ fontSize: 12 }}>拖拽文件或点击「上传文件」按钮添加资源</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {files.map((file) => (
                <Card key={file.id} hoverable size="small" cover={renderThumbnail(file)}
                  onClick={() => setDetailFile(file)}
                  actions={[
                    <Tooltip title="查看详情" key="view"><EyeOutlined /></Tooltip>,
                    <Tooltip title="删除" key="delete">
                      <DeleteOutlined style={{ color: '#f5222d' }} onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} />
                    </Tooltip>,
                  ]}
                  styles={{ body: { padding: '10px 12px' } }}>
                  <Card.Meta
                    title={<Typography.Text ellipsis style={{ fontSize: 13, maxWidth: '100%' }}>{typeIcons[file.type]} {file.name}</Typography.Text>}
                    description={
                      <div style={{ fontSize: 11, color: '#999' }}>
                        <span>{formatSize(file.size)}</span><span style={{ margin: '0 6px' }}>|</span><span>{typeLabels[file.type]}</span>
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
            <div ref={sentinelRef} style={{ textAlign: 'center', padding: '24px 0 8px' }}>
              {loadingMore ? <span style={{ color: '#999' }}><Spin size="small" /> 加载更多...</span>
                : hasMore ? <span style={{ color: '#bbb', fontSize: 12 }}>滚动加载更多</span>
                  : <span style={{ color: '#bbb', fontSize: 12 }}>已加载全部 {files.length} 个文件</span>}
            </div>
          </>
        )}
      </Card>

      {/* Detail modal */}
      <Modal title={detailFile?.name} open={!!detailFile} onCancel={() => setDetailFile(null)}
        footer={<Button danger icon={<DeleteOutlined />} onClick={() => detailFile && handleDeleteFile(detailFile.id)}>删除文件</Button>}
        width={640}>
        {detailFile && (
          <>
            <div style={{ width: '100%', height: 300, background: detailFile.type === 'image' ? getThumbColor() : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 16 }}>
              {detailFile.type === 'image' && <FileImageOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.6)' }} />}
              {detailFile.type === 'video' && <VideoCameraOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
              {detailFile.type === 'audio' && <AudioOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />}
              {detailFile.type === 'document' && <FileTextOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />}
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="文件名" span={2}>{detailFile.name}</Descriptions.Item>
              <Descriptions.Item label="文件类型">{typeLabels[detailFile.type]}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{formatSize(detailFile.size)}</Descriptions.Item>
              {detailFile.width && detailFile.height && <Descriptions.Item label="尺寸">{detailFile.width} x {detailFile.height}</Descriptions.Item>}
              {detailFile.duration && <Descriptions.Item label="时长">{detailFile.duration}</Descriptions.Item>}
              {detailFile.type === 'document' && <Descriptions.Item label="尺寸">-</Descriptions.Item>}
              <Descriptions.Item label="上传时间" span={2}>{new Date(detailFile.uploadDate).toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* New folder modal */}
      <Modal title="新建文件夹" open={folderModalOpen} onOk={handleCreateFolder}
        onCancel={() => { setFolderModalOpen(false); setNewFolderName(''); }} okText="创建" cancelText="取消">
        <input type="text" placeholder="请输入文件夹名称" value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, outline: 'none' }}
          autoFocus
        />
      </Modal>

      {/* Upload progress drawer */}
      <Drawer
        title="上传任务"
        open={uploadDrawerOpen}
        onClose={() => setUploadDrawerOpen(false)}
        size="medium"
        extra={
          uploadTasks.some((t) => t.status === 'completed') && (
            <Button size="small" onClick={() => setUploadTasks((prev) => prev.filter((t) => t.status !== 'completed'))}>清除已完成</Button>
          )
        }>
        {uploadTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无上传任务</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Active & pending tasks */}
            {uploadTasks.filter((t) => t.status !== 'completed').map((task) => {
              const percent = task.totalChunks > 0 ? Math.round((task.uploadedChunks / task.totalChunks) * 100) : 0;
              return (
                <Card key={task.id} size="small" styles={{ body: { padding: 12 } }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text ellipsis style={{ fontWeight: 500, fontSize: 13 }}>{task.fileName}</Typography.Text>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        {formatSize(task.fileSize)} · {task.totalChunks} 个分片 ({formatSize(CHUNK_SIZE)}/片)
                      </div>
                      <Progress
                        percent={percent}
                        status={task.status === 'error' ? 'exception' : task.status === 'uploading' ? 'active' : 'normal'}
                        size="small"
                        style={{ marginTop: 6, marginBottom: 0 }}
                      />
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {task.status === 'pending' && '等待上传...'}
                        {task.status === 'uploading' && `正在上传 ${task.uploadedChunks}/${task.totalChunks} (${percent}%)`}
                        {task.status === 'paused' && '已暂停'}
                        {task.status === 'error' && <span style={{ color: '#f5222d' }}>{task.error || '上传失败'}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {(task.status === 'uploading' || task.status === 'paused') && (
                        <Button type="text" size="small"
                          icon={task.status === 'paused' ? <CaretRightOutlined style={{ color: '#52c41a' }} /> : <PauseCircleOutlined />}
                          onClick={() => handlePauseTask(task)} />
                      )}
                      <Button type="text" size="small" danger icon={<CloseCircleOutlined />}
                        onClick={() => handleRemoveTask(task)} />
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>已完成 ({completedTasks.length})</Typography.Text>
                {completedTasks.slice(0, 10).map((task) => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                    <span style={{ fontSize: 12, flex: 1 }}>{task.fileName}</span>
                    <span style={{ fontSize: 11, color: '#999' }}>{formatSize(task.fileSize)}</span>
                    <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveTask(task)} />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
