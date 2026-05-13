import type { SQLiteDatabase } from "expo-sqlite";
import type {
  BankingCard,
  BankingInvoice,
  BankingProfile,
  BankingTransaction,
  CurrencyCode,
  EmployeeInsurance,
  SubAccount,
} from "../services/mock-data";

/* ------------------------------ Row shapes ------------------------------ */

type ProfileRow = {
  id: string;
  first_name: string;
  display_name: string;
  greeting: string | null;
  gender: string | null;
  company_name: string | null;
  company_address: string | null;
  company_ice: string | null;
  account_iban: string | null;
  role: string | null;
  email: string;
  password: string | null;
  currency: string;
  pending_balance: number;
  wallet_notes: string;
};

type SubAccountRow = {
  id: string;
  profile_id: string;
  name: string;
  balance: number;
  currency: string;
  theme: string;
  is_main: number;
  position: number;
};

type CardRow = {
  id: string;
  profile_id: string;
  name: string;
  cardholder: string;
  network: string;
  masked_pan: string;
  expiry: string;
  limit_amount: number;
  spent: number;
  status: string;
  position: number;
};

type TransactionRow = {
  id: string;
  profile_id: string;
  title: string;
  counterparty: string;
  amount: number;
  currency: string;
  kind: string;
  created_at: string;
  note: string | null;
};

type InvoiceRow = {
  id: string;
  profile_id: string;
  type: string;
  reference: string;
  client_name: string;
  invoice_object: string;
  amount_ht: number;
  vat: number;
  total_ttc: number;
  due_date: string;
  status: string;
  created_at: string;
};

type InsuranceRow = {
  id: string;
  profile_id: string;
  employee_name: string;
  role: string | null;
  coverage_type: string;
  premium: number;
  status: string;
  start_date: string;
};

/* ------------------------------ Mappers ------------------------------ */

function mapSubAccount(r: SubAccountRow): SubAccount {
  return {
    id: r.id,
    name: r.name,
    balance: r.balance,
    currency: r.currency as CurrencyCode,
    theme: r.theme as SubAccount["theme"],
    isMain: r.is_main === 1,
  };
}

function mapCard(r: CardRow): BankingCard {
  return {
    id: r.id,
    name: r.name,
    cardholder: r.cardholder,
    network: r.network,
    maskedPan: r.masked_pan,
    expiry: r.expiry,
    limit: r.limit_amount,
    spent: r.spent,
    status: r.status as BankingCard["status"],
  };
}

function mapTransaction(r: TransactionRow): BankingTransaction {
  return {
    id: r.id,
    title: r.title,
    counterparty: r.counterparty,
    amount: r.amount,
    currency: r.currency as CurrencyCode,
    kind: r.kind as BankingTransaction["kind"],
    createdAt: r.created_at,
    note: r.note ?? undefined,
  };
}

function mapInvoice(r: InvoiceRow): BankingInvoice {
  return {
    id: r.id,
    type: r.type as BankingInvoice["type"],
    reference: r.reference,
    clientName: r.client_name,
    invoiceObject: r.invoice_object,
    amountHT: r.amount_ht,
    vat: r.vat,
    totalTTC: r.total_ttc,
    dueDate: r.due_date,
    status: r.status as BankingInvoice["status"],
    createdAt: r.created_at,
  };
}

function mapInsurance(r: InsuranceRow): EmployeeInsurance {
  return {
    id: r.id,
    employeeName: r.employee_name,
    role: r.role ?? "",
    coverageType: r.coverage_type as EmployeeInsurance["coverageType"],
    premium: r.premium,
    status: r.status as EmployeeInsurance["status"],
    startDate: r.start_date,
  };
}

/* ------------------------------ Queries ------------------------------ */

export async function loadAllProfiles(db: SQLiteDatabase): Promise<BankingProfile[]> {
  const profileRows = await db.getAllAsync<ProfileRow>("SELECT * FROM profiles");
  const profiles: BankingProfile[] = [];

  for (const p of profileRows) {
    const [subAccounts, cards, transactions, invoices, insurances] = await Promise.all([
      db.getAllAsync<SubAccountRow>(
        "SELECT * FROM sub_accounts WHERE profile_id = ? ORDER BY position",
        [p.id]
      ),
      db.getAllAsync<CardRow>(
        "SELECT * FROM cards WHERE profile_id = ? ORDER BY position",
        [p.id]
      ),
      db.getAllAsync<TransactionRow>(
        "SELECT * FROM transactions WHERE profile_id = ? ORDER BY created_at DESC",
        [p.id]
      ),
      db.getAllAsync<InvoiceRow>(
        "SELECT * FROM invoices WHERE profile_id = ? ORDER BY created_at DESC",
        [p.id]
      ),
      db.getAllAsync<InsuranceRow>(
        "SELECT * FROM employee_insurances WHERE profile_id = ? ORDER BY start_date DESC",
        [p.id]
      ),
    ]);

    const mappedSub = subAccounts.map(mapSubAccount);
    const availableBalance = Number(mappedSub.reduce((s, a) => s + a.balance, 0).toFixed(2));

    profiles.push({
      id: p.id,
      firstName: p.first_name,
      displayName: p.display_name,
      greeting: p.greeting ?? "",
      gender: p.gender ?? "",
      companyName: p.company_name ?? "",
      companyAddress: p.company_address ?? "",
      companyICE: p.company_ice ?? "",
      accountIBAN: p.account_iban ?? "",
      role: p.role ?? "",
      email: p.email,
      password: p.password ?? "",
      currency: p.currency as CurrencyCode,
      availableBalance,
      pendingBalance: p.pending_balance,
      subAccounts: mappedSub,
      cards: cards.map(mapCard),
      transactions: transactions.map(mapTransaction),
      invoices: invoices.map(mapInvoice),
      documents: [],
      walletNotes: safeParseJson<string[]>(p.wallet_notes, []),
      employeeInsurances: insurances.map(mapInsurance),
    });
  }

  return profiles;
}

export async function loadProfileById(
  db: SQLiteDatabase,
  profileId: string
): Promise<BankingProfile | null> {
  const all = await loadAllProfiles(db);
  return all.find((p) => p.id === profileId) ?? null;
}

/* ----------------------------- Mutations ----------------------------- */

export async function insertTransaction(
  db: SQLiteDatabase,
  profileId: string,
  tx: BankingTransaction
) {
  await db.runAsync(
    `INSERT INTO transactions (id, profile_id, title, counterparty, amount, currency, kind, created_at, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      profileId,
      tx.title,
      tx.counterparty,
      tx.amount,
      tx.currency,
      tx.kind,
      tx.createdAt,
      tx.note ?? null,
    ]
  );
}

export async function updateCardSpent(db: SQLiteDatabase, cardId: string, spent: number) {
  await db.runAsync(`UPDATE cards SET spent = ? WHERE id = ?`, [Number(spent.toFixed(2)), cardId]);
}

export async function updateCardStatus(
  db: SQLiteDatabase,
  cardId: string,
  status: BankingCard["status"]
) {
  await db.runAsync(`UPDATE cards SET status = ? WHERE id = ?`, [status, cardId]);
}

export async function updateCardLimit(db: SQLiteDatabase, cardId: string, limit: number) {
  await db.runAsync(`UPDATE cards SET limit_amount = ? WHERE id = ?`, [
    Number(limit.toFixed(2)),
    cardId,
  ]);
}

export async function insertCard(db: SQLiteDatabase, profileId: string, card: BankingCard) {
  const max = await db.getFirstAsync<{ max: number | null }>(
    `SELECT MAX(position) as max FROM cards WHERE profile_id = ?`,
    [profileId]
  );
  const nextPos = (max?.max ?? 0) + 1;
  await db.runAsync(
    `INSERT INTO cards (id, profile_id, name, cardholder, network, masked_pan, expiry, limit_amount, spent, status, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      card.id,
      profileId,
      card.name,
      card.cardholder,
      card.network,
      card.maskedPan,
      card.expiry,
      card.limit,
      card.spent,
      card.status,
      nextPos,
    ]
  );
}

export async function updateSubAccountBalance(
  db: SQLiteDatabase,
  subAccountId: string,
  balance: number
) {
  await db.runAsync(`UPDATE sub_accounts SET balance = ? WHERE id = ?`, [
    Number(balance.toFixed(2)),
    subAccountId,
  ]);
}

export async function insertSubAccount(
  db: SQLiteDatabase,
  profileId: string,
  sub: SubAccount
) {
  const max = await db.getFirstAsync<{ max: number | null }>(
    `SELECT MAX(position) as max FROM sub_accounts WHERE profile_id = ?`,
    [profileId]
  );
  const nextPos = (max?.max ?? 0) + 1;
  await db.runAsync(
    `INSERT INTO sub_accounts (id, profile_id, name, balance, currency, theme, is_main, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sub.id, profileId, sub.name, sub.balance, sub.currency, sub.theme, sub.isMain ? 1 : 0, nextPos]
  );
}

export async function insertInvoice(db: SQLiteDatabase, profileId: string, inv: BankingInvoice) {
  await db.runAsync(
    `INSERT INTO invoices (id, profile_id, type, reference, client_name, invoice_object, amount_ht, vat, total_ttc, due_date, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      inv.id,
      profileId,
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

export async function markInvoicePaidDb(db: SQLiteDatabase, invoiceId: string) {
  await db.runAsync(`UPDATE invoices SET status = 'paid' WHERE id = ?`, [invoiceId]);
}

export async function insertInsurance(
  db: SQLiteDatabase,
  profileId: string,
  ins: EmployeeInsurance
) {
  await db.runAsync(
    `INSERT INTO employee_insurances (id, profile_id, employee_name, role, coverage_type, premium, status, start_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ins.id,
      profileId,
      ins.employeeName,
      ins.role,
      ins.coverageType,
      ins.premium,
      ins.status,
      ins.startDate,
    ]
  );
}

export async function updateInsuranceStatus(
  db: SQLiteDatabase,
  insuranceId: string,
  status: EmployeeInsurance["status"]
) {
  await db.runAsync(`UPDATE employee_insurances SET status = ? WHERE id = ?`, [
    status,
    insuranceId,
  ]);
}

export async function updatePendingBalance(
  db: SQLiteDatabase,
  profileId: string,
  pendingBalance: number
) {
  await db.runAsync(`UPDATE profiles SET pending_balance = ? WHERE id = ?`, [
    Number(pendingBalance.toFixed(2)),
    profileId,
  ]);
}

/* ----------------------------- Lookups ----------------------------- */

export async function findProfileByEmailDb(db: SQLiteDatabase, email: string) {
  return db.getFirstAsync<ProfileRow>(
    `SELECT * FROM profiles WHERE LOWER(email) = LOWER(?)`,
    [email]
  );
}

export async function countProfiles(db: SQLiteDatabase): Promise<number> {
  const r = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM profiles`);
  return r?.count ?? 0;
}

/* ----------------------------- Helpers ----------------------------- */

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
