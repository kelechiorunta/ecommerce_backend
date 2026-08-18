import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('payment_invoice', (table) => {
    table.increments('payment_invoice_id').notNullable();
    table.integer('customer_id').notNullable().references('customer_id').inTable('customer');
    table.integer('reference_id').notNullable();
    table.float('amount').notNullable();
    table.string('channel');
    table.string('currency');
    table.string('metadata');
    table.string('ip_address');
    table.string('status');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('payment_invoice');
}
