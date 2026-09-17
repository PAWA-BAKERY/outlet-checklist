// /api/admin/stores
// GET: 列出门店（无需密码，便于调试）；POST: 新增门店；PUT: 改名/排序；DELETE: 删除门店（连带删除其分类和检查项）。
import { json, checkAdmin, unauthorized } from '../../_shared.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT id, name, sort_order FROM stores ORDER BY sort_order, id').all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  if (!checkAdmin(request, env)) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Bad request' }, { status: 400 });
  }

  const id = String(body.id || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const name = String(body.name || '').trim();
  if (!id || !name) return json({ error: 'id and name required' }, { status: 400 });

  const db = env.DB;
  const existing = await db.prepare('SELECT id FROM stores WHERE id = ?').bind(id).first();
  if (existing) return json({ error: '门店代码已存在' }, { status: 409 });

  const maxRow = await db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM stores').first();
  await db
    .prepare('INSERT INTO stores (id, name, sort_order) VALUES (?, ?, ?)')
    .bind(id, name, (maxRow.m || 0) + 1)
    .run();

  return json({ ok: true, id });
}

export async function onRequestPut({ request, env }) {
  if (!checkAdmin(request, env)) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Bad request' }, { status: 400 });
  }
  if (!body.id) return json({ error: 'id required' }, { status: 400 });

  const fields = [];
  const binds = [];
  if (body.name !== undefined) {
    fields.push('name = ?');
    binds.push(String(body.name).trim());
  }
  if (body.sort_order !== undefined) {
    fields.push('sort_order = ?');
    binds.push(body.sort_order);
  }
  if (!fields.length) return json({ error: 'nothing to update' }, { status: 400 });

  binds.push(body.id);
  await env.DB.prepare(`UPDATE stores SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!checkAdmin(request, env)) return unauthorized();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, { status: 400 });

  const db = env.DB;
  const cats = await db.prepare('SELECT id FROM categories WHERE store_id = ?').bind(id).all();
  const catIds = cats.results.map((c) => c.id);
  if (catIds.length) {
    await db.batch(catIds.map((cid) => db.prepare('DELETE FROM items WHERE category_id = ?').bind(cid)));
  }
  await db.prepare('DELETE FROM categories WHERE store_id = ?').bind(id).run();
  await db.prepare('DELETE FROM stores WHERE id = ?').bind(id).run();

  return json({ ok: true });
}
