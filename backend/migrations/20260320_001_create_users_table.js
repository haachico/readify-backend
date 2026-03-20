exports.up = function (knex) {
  return knex.schema.createTable("users", function (table) {
    table.increments("id").primary();
    table.string("username", 255).unique().notNullable();
    table.string("email", 255).unique().notNullable();
    table.string("password", 255).notNullable();
    table.string("firstName", 255).nullable();
    table.string("lastName", 255).nullable();
    table.string("profileImage", 500).nullable();
    table.text("about").nullable();
    table.string("link", 500).nullable();
    table.text("refresh_token").nullable(); // Store JWT refresh tokens (long strings)
    table.timestamps(true, true); // createdAt, updatedAt
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
