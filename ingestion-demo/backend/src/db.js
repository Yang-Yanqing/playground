import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// NOTE: Use a pool for performance and stability under multiple requests.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});



// Why it exists：集中管理连接池；避免每个文件手写连接逻辑；便于测试/扩展。