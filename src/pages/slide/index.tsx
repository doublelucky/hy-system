import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, App, Popconfirm, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { getSlideList, deleteSlide } from '../../api/slide';
import type { Slide } from '../../types';

const bannerColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

export default function SlideList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSlideList();
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (record: Slide) => {
    await deleteSlide(record.id);
    message.success('删除成功');
    fetchData();
  };

  return (
    <>
      <Card
        title="Slide 管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/slide/new')}>
            新建 Slide
          </Button>
        }>
        <Row gutter={[16, 16]}>
          {data.map((slide, idx) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={slide.id}>
              <Card
                hoverable
                loading={loading}
                cover={
                  <div
                    style={{
                      height: 160,
                      background: bannerColors[idx % bannerColors.length],
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 24,
                      position: 'relative',
                    }}>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {slide.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 8, textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                      {slide.subtitle}
                    </div>
                    <Tag
                      color={slide.status === 'published' ? 'success' : 'default'}
                      style={{ position: 'absolute', top: 8, right: 8 }}>
                      {slide.status === 'published' ? <><EyeOutlined /> 已发布</> : <><EyeInvisibleOutlined /> 草稿</>}
                    </Tag>
                    {slide.link && (
                      <span style={{ position: 'absolute', bottom: 8, left: 12, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                        链接: {slide.link}
                      </span>
                    )}
                  </div>
                }
                actions={[
                  <Tooltip title="编辑" key="edit">
                    <EditOutlined onClick={() => navigate(`/slide/${slide.id}`)} />
                  </Tooltip>,
                  <Tooltip title="删除" key="delete">
                    <Popconfirm
                      title={`确定删除「${slide.title}」？`}
                      onConfirm={() => handleDelete(slide)}
                      okText="删除"
                      cancelText="取消">
                      <DeleteOutlined style={{ color: '#f5222d' }} onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  </Tooltip>,
                ]}>
                <Card.Meta
                  title={slide.title}
                  description={
                    <div style={{ fontSize: 12, color: '#999' }}>
                      <span>排序: {slide.sortOrder}</span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>更新: {new Date(slide.updatedAt).toLocaleDateString()}</span>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
        {!loading && data.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>暂无 Slide，点击「新建 Slide」创建</div>
        )}
      </Card>
    </>
  );
}
