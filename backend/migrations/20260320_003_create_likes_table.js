exports.up = function (knex) {
  return knex.schema.createTable("likes", function (table) {
    table.increments("id").primary();
    table.integer("postId").unsigned().notNullable();
    table.integer("userId").unsigned().notNullable();
    table.timestamps(true, true);

    // Foreign keys
    table.foreign("postId").references("posts.id").onDelete("CASCADE");
    table.foreign("userId").references("users.id").onDelete("CASCADE");

    // Unique constraint - one like per user per post
    table.unique(["postId", "userId"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("likes");
};
