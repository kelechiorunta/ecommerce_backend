import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.string('phone', 20).notNullable().defaultTo('08000000000');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('customer', (table) => {
    table.dropColumn('phone');
  });
}
