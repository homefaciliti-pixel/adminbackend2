const db = require('../db');

async function main() {
  try {
    console.log('检查 orders 表中是否已存在 paymentMethod 列...');
    const [columns] = await db.query('DESCRIBE orders');
    const hasColumn = columns.some(col => col.Field === 'paymentMethod');

    if (hasColumn) {
      console.log('✅ 列 paymentMethod 已存在。');
    } else {
      console.log('➕ 正在向 orders 表中添加 paymentMethod 列...');
      await db.query("ALTER TABLE orders ADD COLUMN paymentMethod VARCHAR(100) NOT NULL DEFAULT 'UPI'");
      console.log('✅ 列 paymentMethod 添加成功！');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行迁移时出错:', error);
    process.exit(1);
  }
}

main();
