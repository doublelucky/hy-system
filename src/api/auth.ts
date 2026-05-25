/*
 * @Author: chenhanping97@gmail.com
 * @Date: 2026-05-23 09:42:16
 * @LastEditors: chenhanping97@gmail.com
 * @LastEditTime: 2026-05-23 12:00:07
 * @FilePath: \heyiot-system\src\api\auth.ts
 */
import type { ApiResponse, LoginParams, UserInfo } from '../types';

export async function loginApi(params: LoginParams): Promise<ApiResponse<{ token: string; userInfo: UserInfo }>> {
  // 模拟登录，实际项目替换为真实 API 调用
  // const res = await client.post<ApiResponse<{ token: string; userInfo: UserInfo }>>('/auth/login', params);
  // return res.data;
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    code: 0,
    data: {
      token: 'mock-jwt-token-' + Date.now(),
      userInfo: {
        id: '1',
        username: params.username,
        role: 'admin',
      },
    },
    message: '登录成功',
  };
}