import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Input, Checkbox, Skeleton, App, Dropdown, Modal, Button as AntButton,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined, FilterOutlined, SortAscendingOutlined, PlusOutlined,
  FolderAddOutlined, RocketOutlined, SoundOutlined, SettingOutlined,
  EditOutlined, FileOutlined, ClockCircleOutlined, ColumnWidthOutlined,
  ExpandOutlined, PictureOutlined, CheckSquareOutlined, AppstoreOutlined,
  DeleteOutlined, CopyOutlined, PauseCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getPlaylistList } from '../../api/playlist';
import type { Playlist } from '../../types';

const CARD_HEIGHT = 160;
const THUMB_WIDTH = 220;
const THUMB_HEIGHT = 120;
const TOOLBAR_HEIGHT = 56;

const thumbnailGradients = [
  'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  'linear-gradient(135deg, #000046 0%, #1cb5e0 100%)',
  'linear-gradient(135deg, #16222a 0%, #3a6073 100%)',
  'linear-gradient(135deg, #1d2b64 0%, #f8cdda 100%)',
  'linear-gradient(135deg, #0a0a0a 0%, #434343 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
];

const animStyles = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(82, 196, 26, 0); }
}
.pl-card-enter {
  animation: fadeInUp 0.3s ease both;
}
.pl-action-btn {
  width: 44px; height: 44px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 18px; color: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.pl-action-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}
.pl-action-btn:active { transform: scale(0.95); }
.pl-card {
  background: #fff; border-radius: 8px; padding: 20px;
  display: flex; gap: 20px; align-items: center;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
  cursor: pointer; height: ${CARD_HEIGHT}px;
  margin-bottom: 16px; position: relative;
}
.pl-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  border-color: #d9d9d9;
}
.pl-card.selected {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22,119,255,0.15);
}
.pl-checkbox {
  position: absolute; top: 12px; left: 12px; z-index: 2;
}
.pl-thumb {
  width: ${THUMB_WIDTH}px; height: ${THUMB_HEIGHT}px;
  border-radius: 6px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.pl-thumb-icon { font-size: 40px; color: rgba(255,255,255,0.7); }
.pl-thumb-badge {
  position: absolute; top: 8px; left: 8px;
  background: rgba(0,0,0,0.55); color: #fff;
  font-size: 11px; padding: 2px 8px; border-radius: 3px;
  font-weight: 500;
}
.pl-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.pl-title {
  font-size: 24px; font-weight: 600; color: #b0b0b0;
  transition: color 0.2s; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.pl-card:hover .pl-title { color: #262626; }
.pl-meta-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.pl-meta-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #8c8c8c;
}
.pl-meta-icon { font-size: 13px; color: #bfbfbf; }
.pl-status { font-size: 12px; }
.pl-status .num { color: #1677ff; font-weight: 600; margin: 0 2px; }
.pl-status .num.green { color: #52c41a; }
.pl-status .num.zero { color: #8c8c8c; }
.pl-actions { display: flex; flex-direction: column; gap: 10px; align-items: center; flex-shrink: 0; }
.pl-edit-btn {
  display: flex; align-items: center; gap: 4px;
  background: #fff; border: 1px solid #d9d9d9; border-radius: 4px;
  padding: 4px 12px; font-size: 12px; color: #595959;
  cursor: pointer; transition: all 0.2s;
}
.pl-edit-btn:hover { border-color: #1677ff; color: #1677ff; }
.pl-toolbar {
  height: ${TOOLBAR_HEIGHT}px; background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; position: sticky; top: 0; z-index: 10;
}
.pl-toolbar-left { display: flex; align-items: center; gap: 12px; }
.pl-toolbar-right { display: flex; align-items: center; gap: 16px; }
.pl-action-bar {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 12px; padding: 16px 0;
}
.pl-action-card {
  height: 64px; background: #fff; border: 1px solid #f0f0f0;
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; gap: 10px; cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  font-size: 15px; font-weight: 500; color: #595959;
}
.pl-action-card:hover { background: #fafafa; }
.pl-action-card:active { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
.pl-action-card .icon { font-size: 20px; color: #1677ff; }
`;

const CONTEXT_MENU_ITEMS: MenuProps['items'] = [
  { key: 'edit', label: 'Edit', icon: <EditOutlined /> },
  { key: 'duplicate', label: 'Duplicate', icon: <CopyOutlined /> },
  { key: 'publish', label: 'Publish', icon: <RocketOutlined /> },
  { type: 'divider' },
  { key: 'pause', label: 'Pause Schedule', icon: <PauseCircleOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true },
];

export default function PlaylistManagement() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contextTarget, setContextTarget] = useState<Playlist | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlaylistList();
      setPlaylists(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return playlists;
    const q = search.toLowerCase();
    return playlists.filter((p) => p.title.toLowerCase().includes(q));
  }, [playlists, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, playlist: Playlist) => {
    e.preventDefault();
    setContextTarget(playlist);
    setContextPos({ x: e.clientX, y: e.clientY });
  };

  const handleContextAction = (key: string) => {
    if (!contextTarget) return;
    if (key === 'delete') {
      setDeleteTarget(contextTarget);
    } else if (key === 'edit') {
      navigate(`/playlist/${contextTarget.id}`);
    } else if (key === 'duplicate') {
      message.success(`Duplicated: ${contextTarget.title}`);
    } else if (key === 'publish') {
      message.success(`Published: ${contextTarget.title}`);
    } else if (key === 'pause') {
      message.info(`Paused: ${contextTarget.title}`);
    }
    setContextPos(null);
    setContextTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { deletePlaylist } = await import('../../api/playlist');
    await deletePlaylist(deleteTarget.id);
    message.success(`Deleted: ${deleteTarget.title}`);
    setDeleteTarget(null);
    setContextTarget(null);
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const { deletePlaylist } = await import('../../api/playlist');
    for (const id of selected) {
      await deletePlaylist(id);
    }
    message.success(`Deleted ${selected.size} playlists`);
    setSelected(new Set());
    fetchData();
  };

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    if (selectMode) {
      toggleSelect(id);
    }
  };

  const handleCreatePlaylist = () => {
    message.info('Create Playlist dialog would open');
  };

  const handleFromTemplate = () => {
    message.info('Template gallery would open');
  };

  const handleNewFolder = () => {
    message.info('New Folder dialog would open');
  };

  const handlePublish = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation();
    message.success(`Publishing "${playlist.title}" to screens`);
  };

  const handleMediaAction = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation();
    message.info(`Media library for "${playlist.title}"`);
  };

  const handleSettings = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation();
    message.info(`Settings for "${playlist.title}"`);
  };

  const selectedCount = selected.size;

  return (
    <div ref={containerRef} style={{ margin: -24 }}>
      <style>{animStyles}</style>

      {/* Top Toolbar */}
      <div className="pl-toolbar">
        <div className="pl-toolbar-left">
          <AntButton type="text" icon={<SortAscendingOutlined />} />
          <AntButton type="text" icon={<FilterOutlined />} />
          <Input
            placeholder="Filter"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
            size="middle"
          />
        </div>
        <div className="pl-toolbar-right">
          {selectMode && selectedCount > 0 && (
            <span style={{ fontSize: 13, color: '#1677ff', fontWeight: 500 }}>
              {selectedCount} selected
            </span>
          )}
          <AntButton
            type={selectMode ? 'primary' : 'default'}
            icon={<CheckSquareOutlined />}
            size="middle"
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
          >
            {selectMode ? 'Exit Select' : 'Select'}
          </AntButton>
          {selectMode && selectedCount > 0 && (
            <AntButton
              danger
              size="middle"
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
            >
              Delete Selected
            </AntButton>
          )}
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Action Buttons */}
        <div className="pl-action-bar">
          <div className="pl-action-card" onClick={handleCreatePlaylist}>
            <PlusOutlined className="icon" />
            <span>Create playlist</span>
          </div>
          <div className="pl-action-card" onClick={handleFromTemplate}>
            <CopyOutlined className="icon" />
            <span>From template</span>
          </div>
          <div className="pl-action-card" onClick={handleNewFolder}>
            <FolderAddOutlined className="icon" style={{ color: '#faad14' }} />
            <span>New Folder</span>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 20, padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', height: CARD_HEIGHT, marginBottom: 16, alignItems: 'center' }}>
                <Skeleton.Input active style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton.Input active style={{ width: '40%', height: 28, marginBottom: 12 }} />
                  <Skeleton.Input active style={{ width: '70%', height: 16, marginBottom: 8 }} />
                  <Skeleton.Input active style={{ width: '50%', height: 14, marginBottom: 8 }} />
                  <Skeleton.Input active style={{ width: 80, height: 28 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Skeleton.Avatar active size={44} shape="circle" />
                  <Skeleton.Avatar active size={44} shape="circle" />
                  <Skeleton.Avatar active size={44} shape="circle" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#bfbfbf' }}>
            <AppstoreOutlined style={{ fontSize: 56, marginBottom: 16, display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: '#8c8c8c', marginBottom: 8 }}>
              {search.trim() ? 'No playlists match your filter' : 'No playlists yet'}
            </div>
            <div style={{ fontSize: 13, color: '#bfbfbf' }}>
              {search.trim() ? 'Try a different search term' : 'Click "Create playlist" to get started'}
            </div>
          </div>
        )}

        {/* Playlist Cards */}
        {!loading &&
          filtered.map((pl, idx) => {
            const isSelected = selected.has(pl.id);
            return (
              <div
                key={pl.id}
                className={`pl-card pl-card-enter ${isSelected ? 'selected' : ''}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
                onClick={(e) => handleCardClick(e, pl.id)}
                onContextMenu={(e) => handleContextMenu(e, pl)}
              >
                {selectMode && (
                  <div className="pl-checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onChange={() => toggleSelect(pl.id)} />
                  </div>
                )}

                {/* Thumbnail */}
                <div className="pl-thumb" style={{ background: thumbnailGradients[idx % thumbnailGradients.length] }}>
                  <PictureOutlined className="pl-thumb-icon" />
                  <span className="pl-thumb-badge">Playlist</span>
                </div>

                {/* Info */}
                <div className="pl-info">
                  <div className="pl-title">{pl.title}</div>

                  <div className="pl-meta-row">
                    <div className="pl-meta-item">
                      <FileOutlined className="pl-meta-icon" />
                      <span>{pl.size}</span>
                    </div>
                    <div className="pl-meta-item">
                      <ClockCircleOutlined className="pl-meta-icon" />
                      <span>{pl.duration}</span>
                    </div>
                    <div className="pl-meta-item">
                      <ColumnWidthOutlined className="pl-meta-icon" />
                      <span>{pl.splitScreens}</span>
                    </div>
                    <div className="pl-meta-item">
                      <ExpandOutlined className="pl-meta-icon" />
                      <span>{pl.ratio}</span>
                    </div>
                    <div className="pl-meta-item">
                      <AppstoreOutlined className="pl-meta-icon" />
                      <span>{pl.resolution}</span>
                    </div>
                  </div>

                  <div className="pl-status">
                    {pl.screenCount > 0 ? (
                      <span style={{ color: '#8c8c8c' }}>
                        Program is being used by{' '}
                        <span className="num">{pl.screenCount}</span>
                        {' '}screen{pl.screenCount !== 1 ? 's' : ''}.
                      </span>
                    ) : (
                      <span style={{ color: '#bfbfbf' }}>
                        <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                        Not assigned to any screens.
                      </span>
                    )}
                  </div>

                  <div>
                    <button className="pl-edit-btn" onClick={(e) => { e.stopPropagation(); navigate(`/playlist/${pl.id}`); }}>
                      <EditOutlined />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="pl-actions">
                  <button
                    className="pl-action-btn"
                    style={{ background: '#52c41a' }}
                    onClick={(e) => handlePublish(e, pl)}
                    title="Publish"
                  >
                    <RocketOutlined />
                  </button>
                  <button
                    className="pl-action-btn"
                    style={{ background: '#1677ff' }}
                    onClick={(e) => handleMediaAction(e, pl)}
                    title="Media"
                  >
                    <SoundOutlined />
                  </button>
                  <button
                    className="pl-action-btn"
                    style={{ background: '#434343' }}
                    onClick={(e) => handleSettings(e, pl)}
                    title="Settings"
                  >
                    <SettingOutlined />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Context Menu */}
      {contextPos && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          }}
          onClick={() => setContextPos(null)}
        >
          <Dropdown
            menu={{ items: CONTEXT_MENU_ITEMS, onClick: ({ key }) => handleContextAction(key) }}
            open
            trigger={['contextMenu'] as any}
          >
            <div style={{ position: 'fixed', left: contextPos.x, top: contextPos.y, width: 1, height: 1 }} />
          </Dropdown>
        </div>
      )}

      {/* Delete Confirmation */}
      <Modal
        title="Delete Playlist"
        open={!!deleteTarget}
        onOk={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        width={420}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <ExclamationCircleOutlined style={{ fontSize: 20, color: '#faad14' }} />
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>
              Are you sure you want to delete "{deleteTarget?.title}"?
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#8c8c8c' }}>
              This action cannot be undone. Screens currently using this playlist will be unaffected until their next sync.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
