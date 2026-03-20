exports.up = function (knex) {
  return knex.schema.createTable("comments", function (table) {
    table.increments("id").primary();
    table.integer("postId").unsigned().notNullable();
    table.integer("userId").unsigned().notNullable();
    table.integer("parentCommentId").unsigned().nullable();
    table.text("content").notNullable();
    table.timestamps(true, true);

    // Foreign keys
    table.foreign("postId").references("posts.id").onDelete("CASCADE");
    table.foreign("userId").references("users.id").onDelete("CASCADE");
    table
      .foreign("parentCommentId")
      .references("comments.id")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("comments");
};
