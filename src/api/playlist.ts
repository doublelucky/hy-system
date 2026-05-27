import type { ApiResponse, Playlist, PlaylistItem, TransitionType, FitMode } from '../types';

const playlistData: Playlist[] = [
  {
    id: 'pl-1',
    title: 'Morning Lobby Display',
    thumbnail: '',
    size: '10.0 MB',
    duration: '00:00:10',
    splitScreens: 1,
    ratio: '16:9',
    resolution: '1920×1080',
    screenCount: 3,
  },
  {
    id: 'pl-2',
    title: 'Cafeteria Menu Board',
    thumbnail: '',
    size: '24.5 MB',
    duration: '00:00:30',
    splitScreens: 2,
    ratio: '16:9',
    resolution: '3840×2160',
    screenCount: 5,
  },
  {
    id: 'pl-3',
    title: 'Meeting Room Schedule',
    thumbnail: '',
    size: '8.2 MB',
    duration: '00:00:15',
    splitScreens: 1,
    ratio: '4:3',
    resolution: '1024×768',
    screenCount: 2,
  },
  {
    id: 'pl-4',
    title: 'Corporate Branding Loop',
    thumbnail: '',
    size: '45.1 MB',
    duration: '00:01:00',
    splitScreens: 1,
    ratio: '16:9',
    resolution: '1920×1080',
    screenCount: 12,
  },
  {
    id: 'pl-5',
    title: 'Emergency Alert Template',
    thumbnail: '',
    size: '3.4 MB',
    duration: '00:00:05',
    splitScreens: 1,
    ratio: '16:9',
    resolution: '1920×1080',
    screenCount: 0,
  },
  {
    id: 'pl-6',
    title: 'Product Showcase Wall',
    thumbnail: '',
    size: '67.8 MB',
    duration: '00:02:30',
    splitScreens: 4,
    ratio: '32:9',
    resolution: '7680×2160',
    screenCount: 8,
  },
  {
    id: 'pl-7',
    title: 'Wayfinding Directory',
    thumbnail: '',
    size: '12.3 MB',
    duration: '00:00:20',
    splitScreens: 1,
    ratio: '9:16',
    resolution: '1080×1920',
    screenCount: 4,
  },
  {
    id: 'pl-8',
    title: 'News & Weather Ticker',
    thumbnail: '',
    size: '5.7 MB',
    duration: '00:00:45',
    splitScreens: 1,
    ratio: '16:9',
    resolution: '1920×1080',
    screenCount: 0,
  },
  {
    id: 'pl-9',
    title: 'Retail Promotion Loop',
    thumbnail: '',
    size: '32.1 MB',
    duration: '00:01:15',
    splitScreens: 2,
    ratio: '16:9',
    resolution: '3840×1080',
    screenCount: 15,
  },
  {
    id: 'pl-10',
    title: 'Lobby Welcome Screen',
    thumbnail: '',
    size: '18.9 MB',
    duration: '00:00:25',
    splitScreens: 1,
    ratio: '16:9',
    resolution: '1920×1080',
    screenCount: 1,
  },
  {
    id: 'pl-11',
    title: 'Conference Room Info Panel',
    thumbnail: '',
    size: '7.6 MB',
    duration: '00:00:12',
    splitScreens: 1,
    ratio: '16:10',
    resolution: '2560×1600',
    screenCount: 6,
  },
  {
    id: 'pl-12',
    title: 'Social Media Feed Wall',
    thumbnail: '',
    size: '15.3 MB',
    duration: '00:00:35',
    splitScreens: 3,
    ratio: '16:9',
    resolution: '5760×1080',
    screenCount: 3,
  },
];

export async function getPlaylistList(): Promise<ApiResponse<Playlist[]>> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { code: 0, data: [...playlistData], message: 'ok' };
}

export async function deletePlaylist(id: string): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const idx = playlistData.findIndex((p) => p.id === id);
  if (idx >= 0) playlistData.splice(idx, 1);
  return { code: 0, data: null, message: '删除成功' };
}

export async function createPlaylist(params: Omit<Playlist, 'id'>): Promise<ApiResponse<Playlist>> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newItem: Playlist = { id: `pl-${Date.now()}`, ...params };
  playlistData.unshift(newItem);
  return { code: 0, data: newItem, message: '创建成功' };
}

// ---------- Playlist Items ----------

const playlistItems: Record<string, PlaylistItem[]> = {
  'pl-1': [
    { id: 'pli-1', playlistId: 'pl-1', mediaId: 'm-1', mediaName: 'Company Logo', mediaType: 'image', duration: 8, transition: 'fade', transitionDuration: 500, fitMode: 'contain', sortOrder: 0, width: 1920, height: 1080 },
    { id: 'pli-2', playlistId: 'pl-1', mediaId: 'm-2', mediaName: 'Welcome Video', mediaType: 'video', duration: 15, transition: 'slide_left', transitionDuration: 700, fitMode: 'cover', sortOrder: 1, width: 1920, height: 1080 },
    { id: 'pli-3', playlistId: 'pl-1', mediaId: 'm-3', mediaName: 'Lobby Schedule', mediaType: 'image', duration: 10, transition: 'fade', transitionDuration: 500, fitMode: 'cover', sortOrder: 2, width: 1920, height: 1080 },
  ],
  'pl-2': [
    { id: 'pli-4', playlistId: 'pl-2', mediaId: 'm-4', mediaName: 'Breakfast Menu', mediaType: 'image', duration: 12, transition: 'wipe', transitionDuration: 600, fitMode: 'cover', sortOrder: 0, width: 1920, height: 1080 },
    { id: 'pli-5', playlistId: 'pl-2', mediaId: 'm-5', mediaName: 'Lunch Menu', mediaType: 'image', duration: 12, transition: 'wipe', transitionDuration: 600, fitMode: 'cover', sortOrder: 1, width: 1920, height: 1080 },
    { id: 'pli-6', playlistId: 'pl-2', mediaId: 'm-6', mediaName: 'Daily Specials', mediaType: 'video', duration: 20, transition: 'fade', transitionDuration: 800, fitMode: 'cover', sortOrder: 2, width: 1920, height: 1080 },
  ],
  'pl-3': [
    { id: 'pli-7', playlistId: 'pl-3', mediaId: 'm-7', mediaName: 'Room A Schedule', mediaType: 'image', duration: 10, transition: 'none', transitionDuration: 0, fitMode: 'contain', sortOrder: 0, width: 1024, height: 768 },
    { id: 'pli-8', playlistId: 'pl-3', mediaId: 'm-8', mediaName: 'Room B Schedule', mediaType: 'image', duration: 10, transition: 'fade', transitionDuration: 400, fitMode: 'contain', sortOrder: 1, width: 1024, height: 768 },
  ],
  'pl-4': [
    { id: 'pli-9', playlistId: 'pl-4', mediaId: 'm-9', mediaName: 'Brand Intro', mediaType: 'video', duration: 30, transition: 'fade', transitionDuration: 1000, fitMode: 'cover', sortOrder: 0, width: 1920, height: 1080 },
    { id: 'pli-10', playlistId: 'pl-4', mediaId: 'm-10', mediaName: 'Values', mediaType: 'image', duration: 12, transition: 'slide_right', transitionDuration: 700, fitMode: 'cover', sortOrder: 1, width: 1920, height: 1080 },
    { id: 'pli-11', playlistId: 'pl-4', mediaId: 'm-11', mediaName: 'Team Photos', mediaType: 'image', duration: 15, transition: 'zoom', transitionDuration: 900, fitMode: 'cover', sortOrder: 2, width: 1920, height: 1080 },
    { id: 'pli-12', playlistId: 'pl-4', mediaId: 'm-12', mediaName: 'Contact Info', mediaType: 'image', duration: 8, transition: 'fade', transitionDuration: 500, fitMode: 'contain', sortOrder: 3, width: 1920, height: 1080 },
  ],
  'pl-5': [
    { id: 'pli-13', playlistId: 'pl-5', mediaId: 'm-13', mediaName: 'Alert Background', mediaType: 'image', duration: 5, transition: 'none', transitionDuration: 0, fitMode: 'stretch', sortOrder: 0, width: 1920, height: 1080 },
  ],
  'pl-6': [
    { id: 'pli-14', playlistId: 'pl-6', mediaId: 'm-14', mediaName: 'Product A Feature', mediaType: 'video', duration: 25, transition: 'slide_left', transitionDuration: 800, fitMode: 'cover', sortOrder: 0, width: 3840, height: 2160 },
    { id: 'pli-15', playlistId: 'pl-6', mediaId: 'm-15', mediaName: 'Product B Feature', mediaType: 'video', duration: 25, transition: 'slide_left', transitionDuration: 800, fitMode: 'cover', sortOrder: 1, width: 3840, height: 2160 },
    { id: 'pli-16', playlistId: 'pl-6', mediaId: 'm-16', mediaName: 'Product Comparison', mediaType: 'image', duration: 20, transition: 'zoom', transitionDuration: 1000, fitMode: 'cover', sortOrder: 2, width: 3840, height: 2160 },
    { id: 'pli-17', playlistId: 'pl-6', mediaId: 'm-17', mediaName: 'Pricing Chart', mediaType: 'image', duration: 15, transition: 'fade', transitionDuration: 600, fitMode: 'contain', sortOrder: 3, width: 3840, height: 2160 },
  ],
  'pl-10': [
    { id: 'pli-18', playlistId: 'pl-10', mediaId: 'm-1', mediaName: 'Welcome Slide', mediaType: 'image', duration: 10, transition: 'fade', transitionDuration: 500, fitMode: 'cover', sortOrder: 0, width: 1920, height: 1080 },
    { id: 'pli-19', playlistId: 'pl-10', mediaId: 'm-2', mediaName: 'Directory Map', mediaType: 'image', duration: 15, transition: 'fade', transitionDuration: 500, fitMode: 'contain', sortOrder: 1, width: 1920, height: 1080 },
  ],
};

export async function getPlaylist(id: string): Promise<ApiResponse<Playlist>> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const pl = playlistData.find((p) => p.id === id);
  if (!pl) return { code: 404, data: null as unknown as Playlist, message: 'Playlist not found' };
  return { code: 0, data: { ...pl }, message: 'ok' };
}

export async function getPlaylistItems(playlistId: string): Promise<ApiResponse<PlaylistItem[]>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const items = playlistItems[playlistId] || [];
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  return { code: 0, data: sorted, message: 'ok' };
}

export async function updatePlaylistItem(
  id: string,
  patch: Partial<Pick<PlaylistItem, 'duration' | 'transition' | 'transitionDuration' | 'fitMode' | 'sortOrder'>>,
): Promise<ApiResponse<PlaylistItem>> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  for (const items of Object.values(playlistItems)) {
    const found = items.find((p) => p.id === id);
    if (found) {
      Object.assign(found, patch);
      return { code: 0, data: found, message: '更新成功' };
    }
  }
  return { code: 404, data: null as unknown as PlaylistItem, message: 'Item not found' };
}

export async function reorderPlaylistItems(playlistId: string, itemIds: string[]): Promise<ApiResponse<PlaylistItem[]>> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const items = playlistItems[playlistId];
  if (!items) return { code: 404, data: [], message: 'Playlist not found' };
  itemIds.forEach((id, idx) => {
    const item = items.find((p) => p.id === id);
    if (item) item.sortOrder = idx;
  });
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  return { code: 0, data: sorted, message: 'ok' };
}

export async function addPlaylistItem(
  playlistId: string,
  params: Omit<PlaylistItem, 'id' | 'playlistId' | 'sortOrder'>,
): Promise<ApiResponse<PlaylistItem>> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const items = playlistItems[playlistId] || [];
  const maxOrder = items.reduce((max, p) => Math.max(max, p.sortOrder), -1);
  const newItem: PlaylistItem = {
    id: `pli-${Date.now()}`,
    playlistId,
    ...params,
    sortOrder: maxOrder + 1,
  };
  if (!playlistItems[playlistId]) playlistItems[playlistId] = [];
  playlistItems[playlistId].push(newItem);
  return { code: 0, data: newItem, message: '添加成功' };
}

export async function deletePlaylistItem(id: string): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  for (const [, items] of Object.entries(playlistItems)) {
    const idx = items.findIndex((p) => p.id === id);
    if (idx >= 0) {
      items.splice(idx, 1);
      break;
    }
  }
  return { code: 0, data: null, message: '删除成功' };
}
