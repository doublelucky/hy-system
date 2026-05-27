import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Button, Select, InputNumber, App, Skeleton, Tooltip, Empty } from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, EyeOutlined, PlusOutlined,
  DeleteOutlined, DragOutlined, PictureOutlined, VideoCameraOutlined,
  FileImageOutlined, ClockCircleOutlined, SwapOutlined,
  ExpandOutlined, AudioOutlined, FileTextOutlined, HolderOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  getPlaylist, getPlaylistItems, updatePlaylistItem,
  reorderPlaylistItems, addPlaylistItem, deletePlaylistItem,
} from '../../api/playlist';
import { getMediaFiles } from '../../api/media';
import type { Playlist, PlaylistItem, MediaFile, TransitionType, FitMode } from '../../types';
import { transitionLabels, fitModeLabels } from '../../types';

const TOOLBAR_H = 56;
const LEFT_PANEL_W = 260;
const RIGHT_PANEL_W = 300;

const typeIcons: Record<string, React.ReactNode> = {
  image: <FileImageOutlined />,
  video: <VideoCameraOutlined />,
  audio: <AudioOutlined />,
  document: <FileTextOutlined />,
};

const thumbnailGradients = [
  'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  'linear-gradient(135deg, #141e30, #243b55)',
  'linear-gradient(135deg, #232526, #414345)',
  'linear-gradient(135deg, #1f1c2c, #928dab)',
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #2c3e50, #3498db)',
  'linear-gradient(135deg, #000046, #1cb5e0)',
];

const animStyles = `
.pl-editor { height: calc(100vh - 64px - 48px - 24px); display: flex; flex-direction: column; }
.pl-editor-toolbar {
  height: ${TOOLBAR_H}px; background: #fff; border-bottom: 1px solid #f0f0f0;
  display: flex; align-items: center; padding: 0 20px; gap: 16px;
  flex-shrink: 0;
}
.pl-editor-body { flex: 1; display: flex; overflow: hidden; }
.pl-editor-left {
  width: ${LEFT_PANEL_W}px; flex-shrink: 0; border-right: 1px solid #f0f0f0;
  display: flex; flex-direction: column; background: #fafafa;
}
.pl-editor-left-header {
  padding: 12px 16px; font-size: 13px; font-weight: 600; color: #595959;
  border-bottom: 1px solid #f0f0f0; display: flex; align-items: center;
  justify-content: space-between;
}
.pl-editor-left-body { flex: 1; overflow-y: auto; padding: 8px; }
.pl-media-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border-radius: 6px; cursor: grab; transition: background 0.15s;
  margin-bottom: 4px; border: 1px solid transparent;
}
.pl-media-item:hover { background: #e6f4ff; border-color: #bae0ff; }
.pl-media-item .thumb {
  width: 48px; height: 36px; border-radius: 3px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.pl-media-item .info { flex: 1; min-width: 0; font-size: 12px; }
.pl-media-item .info .name {
  color: #262626; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 2px;
}
.pl-media-item .info .meta { color: #8c8c8c; }
.pl-editor-center {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  background: #f5f5f5;
}
.pl-timeline {
  flex-shrink: 0; background: #fff; border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px; overflow-x: auto; white-space: nowrap;
  min-height: 160px; display: flex; align-items: center; gap: 0;
}
.pl-timeline-empty {
  width: 100%; display: flex; align-items: center; justify-content: center;
  color: #bfbfbf; font-size: 13px;
}
.pl-timeline-track { display: flex; align-items: center; gap: 0; }
.pl-timeline-slot {
  display: flex; align-items: center; gap: 0; flex-shrink: 0;
}
.pl-timeline-card {
  width: 150px; flex-shrink: 0; background: #fff;
  border: 2px solid #e8e8e8; border-radius: 8px; overflow: hidden;
  cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s;
}
.pl-timeline-card:hover { border-color: #bae0ff; }
.pl-timeline-card.selected { border-color: #1677ff; box-shadow: 0 0 0 3px rgba(22,119,255,0.12); }
.pl-timeline-card .card-thumb {
  height: 90px; display: flex; align-items: center; justify-content: center;
  position: relative;
}
.pl-timeline-card .card-thumb .order-badge {
  position: absolute; top: 4px; left: 4px;
  background: rgba(0,0,0,0.6); color: #fff; font-size: 10px;
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600;
}
.pl-timeline-card .card-thumb .delete-badge {
  position: absolute; top: 4px; right: 4px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(255,255,255,0.9); color: #f5222d;
  display: none; align-items: center; justify-content: center;
  cursor: pointer; font-size: 12px; border: none;
}
.pl-timeline-card:hover .card-thumb .delete-badge { display: flex; }
.pl-timeline-card .card-info {
  padding: 8px 10px;
}
.pl-timeline-card .card-info .name {
  font-size: 12px; font-weight: 500; color: #262626;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pl-timeline-card .card-info .dur {
  font-size: 11px; color: #8c8c8c; display: flex; align-items: center;
  gap: 4px; margin-top: 2px;
}
.pl-timeline-arrow {
  flex-shrink: 0; width: 40px; display: flex; align-items: center;
  justify-content: center; color: #d9d9d9; font-size: 16px;
}
.pl-preview-area {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 24px; position: relative;
}
.pl-preview-frame {
  background: #000; border-radius: 4px; box-shadow: 0 8px 40px rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; max-width: 100%; max-height: 100%;
}
.pl-preview-frame .preview-badge {
  position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.65);
  color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 3px;
}
.pl-preview-empty {
  color: #bfbfbf; text-align: center;
}
.pl-preview-empty .icon { font-size: 48px; margin-bottom: 12px; display: block; }
.pl-editor-right {
  width: ${RIGHT_PANEL_W}px; flex-shrink: 0; border-left: 1px solid #f0f0f0;
  background: #fff; display: flex; flex-direction: column;
}
.pl-editor-right-header {
  padding: 12px 16px; font-size: 13px; font-weight: 600; color: #595959;
  border-bottom: 1px solid #f0f0f0;
}
.pl-editor-right-body { flex: 1; overflow-y: auto; padding: 16px; }
.pl-prop-group { margin-bottom: 20px; }
.pl-prop-group .label {
  font-size: 11px; font-weight: 600; color: #8c8c8c; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 8px;
}
.pl-drop-zone {
  border: 2px dashed #d9d9d9; border-radius: 8px;
  padding: 16px; text-align: center; color: #bfbfbf; font-size: 12px;
  transition: border-color 0.2s, background 0.2s; margin-bottom: 12px;
}
.pl-drop-zone.dragover { border-color: #1677ff; background: #e6f4ff; color: #1677ff; }
.pl-empty-right {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: #bfbfbf; padding: 24px;
}
.pl-empty-right .icon { font-size: 36px; margin-bottom: 8px; }
`;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PlaylistEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const selected = items.find((p) => p.id === selectedId) || null;

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [plRes, itemsRes, mediaRes] = await Promise.all([
        getPlaylist(id),
        getPlaylistItems(id),
        getMediaFiles(),
      ]);
      setPlaylist(plRes.data);
      setTitle(plRes.data.title);
      setItems(itemsRes.data);
      setMediaFiles(mediaRes.data.list);
      if (itemsRes.data.length > 0 && !selectedId) {
        setSelectedId(itemsRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [id, selectedId]);

  useEffect(() => { fetchAll(); }, []);

  const handleSelect = (item: PlaylistItem) => {
    setSelectedId(item.id);
  };

  const handleUpdate = async (patch: Partial<PlaylistItem>) => {
    if (!selected) return;
    setItems((prev) => prev.map((p) => (p.id === selected.id ? { ...p, ...patch } : p)));
    await updatePlaylistItem(selected.id, patch);
  };

  const handleDeleteItem = async (itemId: string) => {
    await deletePlaylistItem(itemId);
    message.success('Item removed from playlist');
    const next = items.filter((p) => p.id !== itemId);
    setItems(next);
    if (selectedId === itemId) {
      setSelectedId(next.length > 0 ? next[0].id : null);
    }
  };

  const handleAddMedia = async (media: MediaFile) => {
    await addPlaylistItem(id!, {
      mediaId: media.id,
      mediaName: media.name,
      mediaType: media.type,
      duration: 10,
      transition: 'fade',
      transitionDuration: 500,
      fitMode: 'cover',
      width: media.width,
      height: media.height,
    });
    message.success(`Added "${media.name}" to playlist`);
    const res = await getPlaylistItems(id!);
    setItems(res.data);
    const added = res.data[res.data.length - 1];
    if (added) setSelectedId(added.id);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    message.success('Playlist saved');
  };

  const handlePreview = () => {
    message.info('Preview mode would open in a new window');
  };

  const handleDragStart = (e: React.DragEvent, media: MediaFile) => {
    e.dataTransfer.setData('application/json', JSON.stringify(media));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnTimeline = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const media: MediaFile = JSON.parse(e.dataTransfer.getData('application/json'));
      await handleAddMedia(media);
    } catch { /* ignore */ }
  };

  const handleMoveItem = async (itemId: string, direction: -1 | 1) => {
    const idx = items.findIndex((p) => p.id === itemId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= items.length) return;
    const reordered = [...items];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const updatedIds = reordered.map((p) => p.id);
    setItems(reordered.map((p, i) => ({ ...p, sortOrder: i })));
    await reorderPlaylistItems(id!, updatedIds);
  };

  const totalDuration = items.reduce((sum, p) => sum + p.duration, 0);

  if (loading) {
    return (
      <div style={{ margin: -24 }}>
        <div style={{ height: TOOLBAR_H, background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <Skeleton.Button active size="small" style={{ width: 120 }} />
        </div>
        <div style={{ display: 'flex', height: 400 }}>
          <div style={{ width: LEFT_PANEL_W, padding: 16, borderRight: '1px solid #f0f0f0' }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
          <div style={{ flex: 1, padding: 20 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
          <div style={{ width: RIGHT_PANEL_W, padding: 16, borderLeft: '1px solid #f0f0f0' }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: -24 }}>
      <style>{animStyles}</style>
      <div className="pl-editor">
        {/* Toolbar */}
        <div className="pl-editor-toolbar">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/playlist')}
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: 320, fontWeight: 600, fontSize: 15, border: 'none', background: 'transparent' }}
            variant="borderless"
          />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {items.length} slide{items.length !== 1 ? 's' : ''} · {formatDuration(totalDuration)} total
          </span>
          <Button icon={<EyeOutlined />} onClick={handlePreview}>Preview</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>

        {/* Body */}
        <div className="pl-editor-body">
          {/* Left Panel - Media Library */}
          <div className="pl-editor-left">
            <div className="pl-editor-left-header">
              <span><PictureOutlined style={{ marginRight: 6 }} />Media Library</span>
              <span style={{ fontSize: 11, color: '#bfbfbf' }}>{mediaFiles.length} files</span>
            </div>
            <div className="pl-editor-left-body">
              {mediaFiles.map((media) => (
                <div
                  key={media.id}
                  className="pl-media-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, media)}
                  onClick={() => handleAddMedia(media)}
                >
                  <div className="thumb" style={{ background: thumbnailGradients[parseInt(media.id.split('-')[1] || '1', 10) % thumbnailGradients.length] }}>
                    {typeIcons[media.type] || <FileImageOutlined />}
                    <style>{`.thumb { color: rgba(255,255,255,0.7); font-size: 16px; }`}</style>
                  </div>
                  <div className="info">
                    <div className="name">{media.name}</div>
                    <div className="meta">
                      {media.type} · {media.duration || '--'}
                    </div>
                  </div>
                  <PlusOutlined style={{ fontSize: 12, color: '#1677ff', flexShrink: 0 }} />
                </div>
              ))}
              {mediaFiles.length === 0 && (
                <Empty description="No media" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>

          {/* Center - Timeline & Preview */}
          <div className="pl-editor-center">
            {/* Timeline */}
            <div
              className="pl-timeline"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropOnTimeline}
            >
              {items.length === 0 ? (
                <div className="pl-timeline-empty">
                  <div style={{ textAlign: 'center' }}>
                    <HolderOutlined style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
                    <div>Drag media here to build your playlist</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>or click media from the library panel</div>
                  </div>
                </div>
              ) : (
                <div className="pl-timeline-track">
                  {items.map((item, idx) => (
                    <div key={item.id} className="pl-timeline-slot">
                      <div
                        className={`pl-timeline-card ${selectedId === item.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(item)}
                      >
                        <div
                          className="card-thumb"
                          style={{ background: thumbnailGradients[idx % thumbnailGradients.length] }}
                        >
                          <span className="order-badge">{idx + 1}</span>
                          <button
                            className="delete-badge"
                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                          >
                            <DeleteOutlined />
                          </button>
                          {typeIcons[item.mediaType] || <FileImageOutlined />}
                          <style>{`.card-thumb { color: rgba(255,255,255,0.6); font-size: 28px; }`}</style>
                        </div>
                        <div className="card-info">
                          <div className="name">{item.mediaName}</div>
                          <div className="dur">
                            <ClockCircleOutlined style={{ fontSize: 10 }} />
                            {formatDuration(item.duration)}
                          </div>
                        </div>
                      </div>
                      {idx < items.length - 1 && (
                        <div className="pl-timeline-arrow">
                          <Tooltip title="Transition">
                            <SwapOutlined style={{ transform: 'rotate(90deg)', fontSize: 12 }} />
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="pl-preview-area">
              {selected ? (
                <div
                  className="pl-preview-frame"
                  style={{
                    aspectRatio: selected.width && selected.height
                      ? `${selected.width}/${selected.height}`
                      : '16/9',
                    width: selected.width && selected.height && selected.width > selected.height
                      ? '70%'
                      : 'auto',
                    height: selected.width && selected.height && selected.height > selected.width
                      ? '70%'
                      : 'auto',
                  }}
                >
                  <div
                    style={{
                      width: '100%', height: '100%',
                      background: thumbnailGradients[items.findIndex((p) => p.id === selected.id) % thumbnailGradients.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 64 }}>
                      {typeIcons[selected.mediaType] || <FileImageOutlined />}
                    </span>
                  </div>
                  <span className="preview-badge">
                    {selected.mediaName} · {formatDuration(selected.duration)}
                  </span>
                </div>
              ) : (
                <div className="pl-preview-empty">
                  <EyeOutlined className="icon" />
                  <div>Select a slide to preview</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Properties */}
          <div className="pl-editor-right">
            <div className="pl-editor-right-header">
              <SettingOutlined style={{ marginRight: 6 }} />Properties
            </div>
            {selected ? (
              <div className="pl-editor-right-body">
                <div className="pl-prop-group">
                  <div className="label">Media</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#262626', marginBottom: 4 }}>
                    {selected.mediaName}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {selected.mediaType}
                    {selected.width && selected.height && ` · ${selected.width}×${selected.height}`}
                  </div>
                </div>

                <div className="pl-prop-group">
                  <div className="label"><ClockCircleOutlined style={{ marginRight: 4 }} />Duration (seconds)</div>
                  <InputNumber
                    min={1}
                    max={3600}
                    value={selected.duration}
                    onChange={(v) => v && handleUpdate({ duration: v })}
                    style={{ width: '100%' }}
                    addonAfter="sec"
                  />
                </div>

                <div className="pl-prop-group">
                  <div className="label"><SwapOutlined style={{ marginRight: 4 }} />Transition</div>
                  <Select
                    value={selected.transition}
                    onChange={(v) => handleUpdate({ transition: v })}
                    style={{ width: '100%' }}
                    options={Object.entries(transitionLabels).map(([value, label]) => ({
                      value, label,
                    }))}
                  />
                </div>

                {selected.transition !== 'none' && (
                  <div className="pl-prop-group">
                    <div className="label">Transition Duration (ms)</div>
                    <Select
                      value={selected.transitionDuration}
                      onChange={(v) => handleUpdate({ transitionDuration: v })}
                      style={{ width: '100%' }}
                      options={[
                        { value: 200, label: '200ms' },
                        { value: 400, label: '400ms' },
                        { value: 500, label: '500ms' },
                        { value: 700, label: '700ms' },
                        { value: 1000, label: '1000ms' },
                        { value: 1500, label: '1500ms' },
                      ]}
                    />
                  </div>
                )}

                <div className="pl-prop-group">
                  <div className="label"><ExpandOutlined style={{ marginRight: 4 }} />Fit Mode</div>
                  <Select
                    value={selected.fitMode}
                    onChange={(v) => handleUpdate({ fitMode: v })}
                    style={{ width: '100%' }}
                    options={Object.entries(fitModeLabels).map(([value, label]) => ({
                      value, label,
                    }))}
                  />
                </div>

                <div className="pl-prop-group">
                  <div className="label">Order</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="small"
                      disabled={items.findIndex((p) => p.id === selected.id) <= 0}
                      onClick={() => handleMoveItem(selected.id, -1)}
                    >
                      Move Left
                    </Button>
                    <Button
                      size="small"
                      disabled={items.findIndex((p) => p.id === selected.id) >= items.length - 1}
                      onClick={() => handleMoveItem(selected.id, 1)}
                    >
                      Move Right
                    </Button>
                  </div>
                </div>

                <div className="pl-prop-group">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    block
                    onClick={() => handleDeleteItem(selected.id)}
                  >
                    Remove from Playlist
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pl-empty-right">
                <DragOutlined className="icon" />
                <div style={{ fontSize: 13, textAlign: 'center' }}>
                  Select a slide to edit its properties
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
