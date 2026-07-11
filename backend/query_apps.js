const db = require('./config/db');

async function run() {
  try {
    const [rows] = await db.query('SELECT * FROM applications');
    console.log('Applications:', rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
