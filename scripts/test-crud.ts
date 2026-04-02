import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const timestamp = Date.now();
const TEST_EMAIL = `test-crud-${timestamp}@spliteasy-test.local`;
const TEST_EMAIL_2 = `test-crud-${timestamp}-2@spliteasy-test.local`;
const TEST_NAME = 'Test CRUD User';
const TEST_NAME_2 = 'Test CRUD User 2';

// Track created IDs for cleanup
let testUserId: string;
let testUserId2: string;
let testGroupId: string;
let testMemberId: string;
let testExpenseId: string;
let testPaymentId: string;
let testActivityLogId: string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(table: string, op: string) {
  console.log(`  ✓ ${table} — ${op}`);
}

function fail(table: string, op: string, error: unknown) {
  console.error(`  ✗ ${table} — ${op}:`, (error as Error).message ?? error);
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function testUsers() {
  // Read (created by trigger via admin API)
  const { data: user, error: readErr } = await db.from('users').select('*').eq('id', testUserId).single();
  if (readErr) throw readErr;
  assert(user.email === TEST_EMAIL, 'user email mismatch');
  ok('users', 'read');

  // Update
  const { error: updateErr } = await db.from('users').update({ name: 'Updated Name' }).eq('id', testUserId);
  if (updateErr) throw updateErr;
  const { data: updated } = await db.from('users').select('name').eq('id', testUserId).single();
  assert(updated!.name === 'Updated Name', 'user name not updated');
  ok('users', 'update');

  // Revert
  const { error: revertErr } = await db.from('users').update({ name: TEST_NAME }).eq('id', testUserId);
  if (revertErr) throw revertErr;
  ok('users', 'revert');
}

async function testGroups() {
  // Create
  const { data: group, error: createErr } = await db
    .from('groups')
    .insert({ name: 'Test Group', description: 'CRUD test', created_by: testUserId })
    .select()
    .single();
  if (createErr) throw createErr;
  testGroupId = group.id;
  ok('groups', 'create');

  // Read
  const { data: read, error: readErr } = await db.from('groups').select('*').eq('id', testGroupId).single();
  if (readErr) throw readErr;
  assert(read.name === 'Test Group', 'group name mismatch');
  ok('groups', 'read');

  // Update
  const { error: updateErr } = await db.from('groups').update({ name: 'Updated Group' }).eq('id', testGroupId);
  if (updateErr) throw updateErr;
  const { data: updated } = await db.from('groups').select('name').eq('id', testGroupId).single();
  assert(updated!.name === 'Updated Group', 'group name not updated');
  ok('groups', 'update');
}

async function testGroupMembers() {
  // Create
  const { data: member, error: createErr } = await db
    .from('group_members')
    .insert({ group_id: testGroupId, user_id: testUserId, role: 'admin' })
    .select()
    .single();
  if (createErr) throw createErr;
  testMemberId = member.id;
  ok('group_members', 'create');

  // Read
  const { data: members, error: readErr } = await db.from('group_members').select('*').eq('group_id', testGroupId);
  if (readErr) throw readErr;
  assert(members!.length === 1, 'expected 1 group member');
  ok('group_members', 'read');
}

async function testExpenses() {
  // Create
  const { data: expense, error: createErr } = await db
    .from('expenses')
    .insert({
      group_id: testGroupId,
      description: 'Test Expense',
      amount: 100.50,
      currency: 'ARS',
      paid_by: testUserId,
      split_type: 'equal',
      created_by: testUserId,
    })
    .select()
    .single();
  if (createErr) throw createErr;
  testExpenseId = expense.id;
  ok('expenses', 'create');

  // Read
  const { data: read, error: readErr } = await db.from('expenses').select('*').eq('id', testExpenseId).single();
  if (readErr) throw readErr;
  assert(read.description === 'Test Expense', 'expense description mismatch');
  ok('expenses', 'read');

  // Update
  const { error: updateErr } = await db.from('expenses').update({ description: 'Updated Expense' }).eq('id', testExpenseId);
  if (updateErr) throw updateErr;
  const { data: updated } = await db.from('expenses').select('description').eq('id', testExpenseId).single();
  assert(updated!.description === 'Updated Expense', 'expense description not updated');
  ok('expenses', 'update');
}

async function testExpenseParticipants() {
  // Create
  const { data: participants, error: createErr } = await db
    .from('expense_participants')
    .insert({ expense_id: testExpenseId, user_id: testUserId, amount_owed: 50.25 })
    .select();
  if (createErr) throw createErr;
  assert(participants!.length === 1, 'expected 1 participant');
  ok('expense_participants', 'create');

  // Read
  const { data: read, error: readErr } = await db.from('expense_participants').select('*').eq('expense_id', testExpenseId);
  if (readErr) throw readErr;
  assert(read!.length === 1, 'expected 1 participant on read');
  ok('expense_participants', 'read');
}

async function testPayments() {
  // Create
  const { data: payment, error: createErr } = await db
    .from('payments')
    .insert({
      group_id: testGroupId,
      paid_by: testUserId,
      paid_to: testUserId,
      amount: 25.00,
      note: 'Test payment',
    })
    .select()
    .single();
  if (createErr) throw createErr;
  testPaymentId = payment.id;
  ok('payments', 'create');

  // Read
  const { data: read, error: readErr } = await db.from('payments').select('*').eq('group_id', testGroupId);
  if (readErr) throw readErr;
  assert(read!.length === 1, 'expected 1 payment');
  ok('payments', 'read');
}

async function testBalances() {
  // Create (upsert) — needs two distinct users due to CHECK (from_user <> to_user)
  const { data: balance, error: createErr } = await db
    .from('balances')
    .upsert(
      { group_id: testGroupId, from_user: testUserId, to_user: testUserId2, amount: 50.00 },
      { onConflict: 'group_id,from_user,to_user' }
    )
    .select()
    .single();
  if (createErr) throw createErr;
  ok('balances', 'create (upsert)');

  // Read
  const { data: read, error: readErr } = await db.from('balances').select('*').eq('group_id', testGroupId);
  if (readErr) throw readErr;
  assert(read!.length === 1, 'expected 1 balance');
  ok('balances', 'read');

  // Update (upsert with new amount)
  const { error: updateErr } = await db
    .from('balances')
    .upsert(
      { group_id: testGroupId, from_user: testUserId, to_user: testUserId2, amount: 75.00 },
      { onConflict: 'group_id,from_user,to_user' }
    )
    .select()
    .single();
  if (updateErr) throw updateErr;
  const { data: updated } = await db.from('balances').select('amount').eq('group_id', testGroupId).single();
  assert(Number(updated!.amount) === 75.00, 'balance amount not updated');
  ok('balances', 'update (upsert)');

  // Delete
  const { error: delErr } = await db.from('balances').delete().eq('group_id', testGroupId);
  if (delErr) throw delErr;
  ok('balances', 'delete');
}

async function testActivityLog() {
  // Create
  const { data: log, error: createErr } = await db
    .from('activity_log')
    .insert({
      group_id: testGroupId,
      user_id: testUserId,
      action: 'member_joined',
      entity_type: 'group_member',
      entity_id: testMemberId,
      metadata: { test: true },
    })
    .select()
    .single();
  if (createErr) throw createErr;
  testActivityLogId = log.id;
  ok('activity_log', 'create');

  // Read
  const { data: read, error: readErr } = await db.from('activity_log').select('*').eq('group_id', testGroupId);
  if (readErr) throw readErr;
  assert(read!.length === 1, 'expected 1 activity log');
  ok('activity_log', 'read');
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanup() {
  console.log('\nCleaning up...');

  // Delete in reverse dependency order
  if (testActivityLogId) {
    await db.from('activity_log').delete().eq('id', testActivityLogId);
  }
  // Balances by group (if any survived)
  if (testGroupId) {
    await db.from('balances').delete().eq('group_id', testGroupId);
  }
  if (testPaymentId) {
    await db.from('payments').delete().eq('id', testPaymentId);
  }
  // Expense participants cascade from expense delete
  if (testExpenseId) {
    await db.from('expenses').delete().eq('id', testExpenseId);
  }
  if (testMemberId) {
    await db.from('group_members').delete().eq('id', testMemberId);
  }
  if (testGroupId) {
    await db.from('groups').delete().eq('id', testGroupId);
  }
  // Delete test users via admin API (cascades public.users via FK)
  if (testUserId2) {
    await db.auth.admin.deleteUser(testUserId2);
  }
  if (testUserId) {
    await db.auth.admin.deleteUser(testUserId);
  }

  console.log('Cleanup complete.\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== CRUD Test Script ===\n');

  // Create test users via admin API
  console.log('Creating test users...');
  const { data: authUser, error: userErr } = await db.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
    user_metadata: { name: TEST_NAME },
  });
  if (userErr) {
    console.error('Failed to create test user 1:', userErr.message);
    process.exit(1);
  }
  testUserId = authUser.user.id;

  const { data: authUser2, error: userErr2 } = await db.auth.admin.createUser({
    email: TEST_EMAIL_2,
    email_confirm: true,
    user_metadata: { name: TEST_NAME_2 },
  });
  if (userErr2) {
    console.error('Failed to create test user 2:', userErr2.message);
    await db.auth.admin.deleteUser(testUserId);
    process.exit(1);
  }
  testUserId2 = authUser2.user.id;
  console.log(`Test users created: ${testUserId}, ${testUserId2}\n`);

  try {
    console.log('Testing users...');
    await testUsers();

    console.log('Testing groups...');
    await testGroups();

    console.log('Testing group_members...');
    await testGroupMembers();

    console.log('Testing expenses...');
    await testExpenses();

    console.log('Testing expense_participants...');
    await testExpenseParticipants();

    console.log('Testing payments...');
    await testPayments();

    console.log('Testing balances...');
    await testBalances();

    console.log('Testing activity_log...');
    await testActivityLog();

    console.log('\n=== All tests passed ===');
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error((error as Error).message ?? error);
  } finally {
    await cleanup();
  }
}

main();
