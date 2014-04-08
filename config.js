module.exports = {
  database: {
    debug: false,
    client: "sqlite3",
    connection: {
      filename: "book.db"
    }
  },
  directory: "./migrations",
  tableName: 'migrations'
};
