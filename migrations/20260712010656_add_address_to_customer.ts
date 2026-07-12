import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.text('address').notNullable().defaultTo('Please provide an address');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.dropColumn('address');
  });
}
