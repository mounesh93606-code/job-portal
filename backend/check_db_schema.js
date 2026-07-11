const db = require('./config/db');

async function check() {
  try {
    const [columns] = await db.query('DESCRIBE applications');
    console.log('Applications table columns:', columns);
  } catch (err) {
    console.error('Error describing applications table:', err);
  } finally {
    process.exit(0);
  }
}

check();
