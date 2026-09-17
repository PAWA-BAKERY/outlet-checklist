// 共享工具函数，供 functions/ 目录下的接口调用
// 文件名以下划线开头，Cloudflare Pages 不会把它当作路由，只作为普通模块导入。

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    ...init,
  });
}

// 校验管理员密码：客户端在请求头 X-Admin-Password 中携带密码，
// 与 Cloudflare Pages 项目的环境变量 ADMIN_PASSWORD 比对。
export function checkAdmin(request, env) {
  const provided = request.headers.get('X-Admin-Password') || '';
  const expected = env.ADMIN_PASSWORD || '';
  return expected.length > 0 && provided === expected;
}

export function unauthorized() {
  return json({ error: 'Unauthorized' }, { status: 401 });
}
