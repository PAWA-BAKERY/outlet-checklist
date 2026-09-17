// POST /api/admin/login  { password }
// 用于管理后台登录时校验密码，成功返回 { ok: true }。
import { json, unauthorized } from '../../_shared.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Bad request' }, { status: 400 });
  }
  const expected = env.ADMIN_PASSWORD || '';
  if (!expected || body.password !== expected) {
    return unauthorized();
  }
  return json({ ok: true });
}
