import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('products', (table) => {
    table.integer('producer_id').notNullable().references('producer_id').inTable('producer');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('products', (table) => {
    table.dropForeign('producer_id').dropColumn('producer_id');
  });
}
