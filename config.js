module.exports = {
  database: {
    debug: true,
    client: "sqlite3",
    connection: {
      filename: "book.db"
    }
  },
  directory: "./migrations",
  tableName: 'migrations'
};
