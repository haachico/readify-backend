exports.up = function (knex) {
  return knex.schema.createTable("posts", function (table) {
    table.increments("id").primary();
    table.integer("userId").unsigned().notNullable();
    table.text("content").notNullable();
    table.string("imageUrl", 500).nullable();
    table.integer("likeCount").defaultTo(0);
    table.timestamps(true, true);

    // Foreign key
    table.foreign("userId").references("users.id").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("posts");
};
