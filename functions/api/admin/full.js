// GET /api/admin/full
// 管理后台专用：返回带 id 的完整数据（门店、分类、检查项），需要管理密码。
import { json, checkAdmin, unauthorized } from '../../_shared.js';

export async function onRequestGet({ request, env }) {
  if (!checkAdmin(request, env)) return unauthorized();
  const db = env.DB;

  const stores = await db.prepare('SELECT id, name, sort_order FROM stores ORDER BY sort_order, id').all();
  const categories = await db
    .prepare('SELECT id, store_id, checklist_type, category_zh, category_en, sort_order FROM categories ORDER BY store_id, checklist_type, sort_order, id')
    .all();
  const items = await db
    .prepare('SELECT id, category_id, zh, en, sort_order FROM items ORDER BY category_id, sort_order, id')
    .all();

  return json({
    stores: stores.results,
    categories: categories.results,
    items: items.results,
  });
}
