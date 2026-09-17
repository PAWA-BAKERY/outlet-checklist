// /api/admin/categories
// POST: 新增分类；PUT: 编辑名称/排序；DELETE: 删除分类（连带删除其检查项）。
import { json, checkAdmin, unauthorized } from '../../_shared.js';

export async function onRequestPost({ request, env }) {
  if (!checkAdmin(request, env)) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Bad request' }, { status: 400 });
  }

  const { store_id, checklist_type, category_zh, category_en } = body;
  if (!store_id || !['opening', 'closing'].includes(checklist_type) || !category_zh || !category_en) {
    return json({ error: '参数不完整' }, { status: 400 });
  }

  const db = env.DB;
  const maxRow = await db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM categories WHERE store_id = ? AND checklist_type = ?')
    .bind(store_id, checklist_type)
    .first();
  const res = await db
    .prepare('INSERT INTO categories (store_id, checklist_type, category_zh, category_en, sort_order) VALUES (?, ?, ?, ?, ?)')
    .bind(store_id, checklist_type, category_zh, category_en, (maxRow.m || 0) + 1)
    .run();

  return json({ ok: true, id: res.meta.last_row_id });
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
  for (const f of ['category_zh', 'category_en', 'sort_order']) {
    if (body[f] !== undefined) {
      fields.push(`${f} = ?`);
      binds.push(body[f]);
    }
  }
  if (!fields.length) return json({ error: 'nothing to update' }, { status: 400 });

  binds.push(body.id);
  await env.DB.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!checkAdmin(request, env)) return unauthorized();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, { status: 400 });

  const db = env.DB;
  await db.prepare('DELETE FROM items WHERE category_id = ?').bind(id).run();
  await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

  return json({ ok: true });
}
