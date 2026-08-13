import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('customer_delivery_details', (table) => {
    table.increments('customer_delivery_details_id').notNullable();
    table.string('full_name');
    table.string('email').notNullable().references('email').inTable('customer');
    table.text('first_address');
    table.text('second_address');
    table.string('city');
    table.string('postal_code');
    table.string('country');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('customer_delivery_details');
}
