import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form, Input, InputNumber, Select, App, Spin, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { getSlide, saveSlide } from '../../api/slide';
import type { Slide } from '../../types';

export default function SlideEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<Partial<Slide>>({});
  const [form] = Form.useForm();

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      getSlide(id).then((res) => {
        form.setFieldsValue(res.data);
        setPreviewSlide(res.data);
      }).finally(() => setLoading(false));
    } else {
      form.resetFields();
      setPreviewSlide({});
    }
  }, [id, isNew, form]);

  const handleValuesChange = (_: unknown, allValues: Record<string, unknown>) => {
    setPreviewSlide(allValues as Partial<Slide>);
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const params = { ...values, id: isNew ? undefined : id };
      const res = await saveSlide(params as Parameters<typeof saveSlide>[0]);
      message.success(isNew ? '创建成功' : '保存成功');
      navigate(`/slide/${res.data.id}`, { replace: true });
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const bannerColors = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/slide')}>返回列表</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
          {isNew ? '创建' : '保存'}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Preview panel */}
        <Card title="预览效果" style={{ width: 420, flexShrink: 0 }}>
          <div style={{
            width: '100%', height: 220,
            background: bannerColors,
            borderRadius: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 32,
          }}>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {previewSlide.title || '标题预览'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 10, textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
              {previewSlide.subtitle || '副标题预览'}
            </div>
            {previewSlide.link && (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 16 }}>
                跳转链接: {previewSlide.link}
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, color: '#999', fontSize: 12, textAlign: 'center' }}>
            Slide 预览效果，实际显示以客户端为准
          </div>
        </Card>

        {/* Edit form */}
        <Card title={isNew ? '新建 Slide' : '编辑 Slide'} style={{ flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleValuesChange}
              initialValues={{ sortOrder: 1, status: 'draft' }}>
              <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="Slide 主标题" maxLength={30} showCount />
              </Form.Item>
              <Form.Item label="副标题" name="subtitle">
                <Input.TextArea rows={2} placeholder="Slide 副标题（可选）" maxLength={80} showCount />
              </Form.Item>
              <Form.Item label="跳转链接" name="link">
                <Input placeholder="点击 Slide 跳转的页面路径，如 /dashboard" />
              </Form.Item>
              <Space size="large">
                <Form.Item label="排序号" name="sortOrder" rules={[{ required: true, message: '请输入排序号' }]}>
                  <InputNumber min={1} max={99} placeholder="数字越小越靠前" style={{ width: 180 }} />
                </Form.Item>
                <Form.Item label="状态" name="status" rules={[{ required: true }]}>
                  <Select
                    style={{ width: 140 }}
                    options={[
                      { label: '已发布', value: 'published' },
                      { label: '草稿', value: 'draft' },
                    ]}
                  />
                </Form.Item>
              </Space>
            </Form>
          )}
        </Card>
      </div>
    </>
  );
}
