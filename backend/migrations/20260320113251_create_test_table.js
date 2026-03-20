exports.up = function (knex) {
  return knex.schema.createTable("dummy", function (table) {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.integer("value").defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("dummy");
};
