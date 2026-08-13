import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('details_history', (table) => {
    table.increments('details_history_id').notNullable();
    table.integer('customer_id').notNullable().references('customer_id').inTable('customer');
    table.text('email').notNullable().references('email').inTable('customer');
    table.text('report');
    table.string('status');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('details_history');
}
