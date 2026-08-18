import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.text('status_info').notNullable().defaultTo('Customer Status Info');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.dropColumn('status_info');
  });
}
