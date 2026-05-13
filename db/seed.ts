import type { SQLiteDatabase } from "expo-sqlite";
import { mockProfiles } from "../services/mock-data";

/**
 * Inserts the fixture profiles + their nested entities into the SQLite DB.
 * Idempotent against re-runs as long as the caller checks for an existing
 * `profiles` row count before calling.
 */
export async function seedDatabase(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const profile of mockProfiles) {
      await db.runAsync(
        `INSERT OR REPLACE INTO profiles
         (id, first_name, display_name, greeting, gender, company_name, company_address, company_ice,
          account_iban, role, email, password, currency, pending_balance, wallet_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.id,
          profile.firstName,
          profile.displayName,
          profile.greeting,
          profile.gender,
          profile.companyName,
          profile.companyAddress,
          profile.companyICE,
          profile.accountIBAN,
          profile.role,
          profile.email,
          profile.password,
          profile.currency,
          profile.pendingBalance,
          JSON.stringify(profile.walletNotes ?? []),
        ]
      );

      for (let i = 0; i < profile.subAccounts.length; i++) {
        const acc = profile.subAccounts[i];
        await db.runAsync(
          `INSERT OR REPLACE INTO sub_accounts (id, profile_id, name, balance, currency, theme, is_main, position)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [acc.id, profile.id, acc.name, acc.balance, acc.currency, acc.theme, acc.isMain ? 1 : 0, i]
        );
      }

      for (let i = 0; i < profile.cards.length; i++) {
        const c = profile.cards[i];
        await db.runAsync(
          `INSERT OR REPLACE INTO cards (id, profile_id, name, cardholder, network, masked_pan, expiry, limit_amount, spent, status, position)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, profile.id, c.name, c.cardholder, c.network, c.maskedPan, c.expiry, c.limit, c.spent, c.status, i]
        );
      }

      for (const t of profile.transactions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions (id, profile_id, title, counterparty, amount, currency, kind, created_at, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, profile.id, t.title, t.counterparty, t.amount, t.currency, t.kind, t.createdAt, t.note ?? null]
        );
      }

      for (const inv of profile.invoices) {
        await db.runAsync(
          `INSERT OR REPLACE INTO invoices (id, profile_id, type, reference, client_name, invoice_object, amount_ht, vat, total_ttc, due_date, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inv.id,
            profile.id,
            inv.type,
            inv.reference,
            inv.clientName,
            inv.invoiceObject,
            inv.amountHT,
            inv.vat,
            inv.totalTTC,
            inv.dueDate,
            inv.status,
            inv.createdAt,
          ]
        );
      }

      for (const ins of profile.employeeInsurances ?? []) {
        await db.runAsync(
          `INSERT OR REPLACE INTO employee_insurances (id, profile_id, employee_name, role, coverage_type, premium, status, start_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ins.id, profile.id, ins.employeeName, ins.role, ins.coverageType, ins.premium, ins.status, ins.startDate]
        );
      }
    }
  });
}
