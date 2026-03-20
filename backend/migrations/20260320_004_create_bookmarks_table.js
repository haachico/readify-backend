exports.up = function (knex) {
  return knex.schema.createTable("bookmarks", function (table) {
    table.increments("id").primary();
    table.integer("userId").unsigned().notNullable();
    table.integer("postId").unsigned().notNullable();
    table.timestamps(true, true);

    // Foreign keys
    table.foreign("userId").references("users.id").onDelete("CASCADE");
    table.foreign("postId").references("posts.id").onDelete("CASCADE");

    // Unique constraint - one bookmark per user per post
    table.unique(["userId", "postId"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("bookmarks");
};
