import { Card, Col, Row, Statistic } from 'antd';
import { TeamOutlined, ApiOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

export default function Dashboard() {
  const userInfo = useAuthStore((s) => s.userInfo);

  const stats = [
    { title: '用户总数', value: 1286, icon: <TeamOutlined />, color: '#1677ff' },
    { title: 'API 调用次数', value: 456789, icon: <ApiOutlined />, color: '#52c41a' },
    { title: '平均响应时间', value: 234, suffix: 'ms', icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: '在线设备', value: 856, icon: <CheckCircleOutlined />, color: '#722ed1' },
  ];

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>
          欢迎回来，{userInfo?.username || '管理员'}
        </h2>
        <p style={{ color: '#999', marginBottom: 0 }}>以下是系统运行概况</p>
      </div>
      <Row gutter={[16, 16]}>
        {stats.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <Card>
              <Statistic
                title={item.title}
                value={item.value}
                suffix={item.suffix}
                prefix={<span style={{ color: item.color, marginRight: 8 }}>{item.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
