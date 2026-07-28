import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('edit_history', (table) => {
    table.increments('edit_history_id').notNullable();
    table.integer('customer_id').notNullable().references('customer_id').inTable('customer');
    table.text('report');
    table.string('status');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('edit_history');
}
