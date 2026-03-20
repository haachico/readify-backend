exports.up = function (knex) {
  return knex.schema.createTable("follows", function (table) {
    table.increments("id").primary();
    table.integer("followerId").unsigned().notNullable();
    table.integer("followingId").unsigned().notNullable();
    table.timestamps(true, true);

    // Foreign keys
    table.foreign("followerId").references("users.id").onDelete("CASCADE");
    table.foreign("followingId").references("users.id").onDelete("CASCADE");

    // Unique constraint - can't follow same person twice
    table.unique(["followerId", "followingId"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("follows");
};
