import { dd } from '../utils/dd';
import createPool from './db_connection'

async function checkDBConnection() {
  dd('Checking DB connection...')
  dd('database: ' + process.env.DB_DATABASE)
  try {
    const pool = createPool()
    const [rows] = await pool.query(`SELECT COUNT(*) AS table_count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = "${process.env.DB_DATABASE}";`);
    dd(`Database ${process.env.DB_DATABASE} with ${rows[0]?.table_count} tables is successfully connected.`);
  } catch (error) {
    dd('DB connection error: ')
    dd(error)
  }
}

export default checkDBConnection;