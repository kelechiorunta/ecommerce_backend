import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('product_history', (table) => {
    table.increments('product_history_id').notNullable();
    table.integer('producer_id').notNullable().references('producer_id').inTable('producer');
    table.integer('category_id').notNullable().references('category_id').inTable('category');
    table.text('report');
    table.string('status');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('product_history');
}
