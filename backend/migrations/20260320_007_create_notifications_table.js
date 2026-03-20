exports.up = function (knex) {
  return knex.schema.createTable("notifications", function (table) {
    table.increments("id").primary();
    table.integer("userId").unsigned().notNullable();
    table.string("type", 32).notNullable(); // 'like', 'comment', 'follow', 'bookmark'
    table.integer("sourceUserId").unsigned().nullable();
    table.integer("postId").unsigned().nullable();
    table.integer("commentId").unsigned().nullable();
    table.string("message", 255).notNullable();
    table.tinyint("isRead").defaultTo(0);
    table.datetime("createdAt").defaultTo(knex.raw("CURRENT_TIMESTAMP"));

    // Foreign keys
    table.foreign("userId").references("users.id").onDelete("CASCADE");
    table.foreign("sourceUserId").references("users.id").onDelete("CASCADE");
    table.foreign("postId").references("posts.id").onDelete("CASCADE");
    table.foreign("commentId").references("comments.id").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("notifications");
};
