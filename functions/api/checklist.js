// GET /api/checklist
// 公开接口：给员工使用的检查表页面读取门店 + 检查项目数据。
import { json } from '../_shared.js';

export async function onRequestGet({ env }) {
  const db = env.DB;

  const stores = await db.prepare('SELECT id, name FROM stores ORDER BY sort_order, id').all();
  const categories = await db
    .prepare('SELECT id, store_id, checklist_type, category_zh, category_en FROM categories ORDER BY store_id, checklist_type, sort_order, id')
    .all();
  const items = await db
    .prepare('SELECT id, category_id, zh, en FROM items ORDER BY category_id, sort_order, id')
    .all();

  const itemsByCategory = {};
  for (const it of items.results) {
    (itemsByCategory[it.category_id] ||= []).push({ zh: it.zh, en: it.en });
  }

  const result = {};
  const storeOrder = [];
  for (const s of stores.results) {
    result[s.id] = { name: s.name, opening: [], closing: [] };
    storeOrder.push(s.id);
  }
  for (const c of categories.results) {
    if (!result[c.store_id]) continue;
    result[c.store_id][c.checklist_type].push({
      category_zh: c.category_zh,
      category_en: c.category_en,
      items: itemsByCategory[c.id] || [],
    });
  }

  return json({ storeOrder, stores: result });
}
