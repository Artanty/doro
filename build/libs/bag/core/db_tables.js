const TABLES_CONFIG = {
  builds: `CREATE TABLE builds (
    id SERIAL PRIMARY KEY, 
    discId VARCHAR(255), 
    project VARCHAR(255)
  );`
}

module.exports = TABLES_CONFIG