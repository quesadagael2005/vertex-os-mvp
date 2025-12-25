# ADR 003: Snapshot vs Reference Architecture for Jobs

**Date:** 2024-12-23  
**Status:** Accepted  
**Deciders:** Team

## Context

When a job is created, we need to decide: should we link to master data (references) or copy data at booking time (snapshots)?

**Example Scenario:**
1. Customer completes assessment → Checklist generated with 47 tasks
2. Customer books cleaner ($30/hr) → Job created
3. NEXT DAY: Customer edits checklist, removes 5 tasks
4. NEXT DAY: Cleaner raises rate to $35/hr
5. JOB DAY: What checklist should cleaner complete? What rate should customer pay?

## Decision

Jobs will use **SNAPSHOT ARCHITECTURE** - copy all relevant data at booking time.

## What Gets Snapshotted

```typescript
{
  // Checklist snapshot (tasks at booking time)
  checklist_snapshot: Task[],
  task_count: number,
  effort_hours: number,
  
  // Pricing snapshot (rates/fees at booking time)
  cleaner_rate_snapshot: number,      // Cleaner's rate when booked
  platform_fee_snapshot: number,      // Platform fee % when booked
  
  // Calculated prices (locked in)
  subtotal: number,
  platform_fee_amount: number,
  total_price: number,
  cleaner_payout: number
}
```

## Rationale

### Why Snapshots?

**1. Legal Contract Integrity**
- A booking is a legal agreement
- Terms cannot change after agreement
- Customer agreed to specific scope and price
- Cleaner accepted specific tasks and payment

**2. Financial Certainty**
- Customer knows exact charge upfront
- Cleaner knows exact payout upfront
- Platform knows exact fees upfront
- No surprise price changes

**3. Operational Clarity**
- Cleaner sees exact checklist to complete
- No confusion about "which version" of checklist
- Historical jobs remain accurate in reports

**4. Audit Trail**
- Can see exactly what was agreed to
- Can resolve disputes definitively
- Financial reports remain accurate over time

### Why NOT References?

**Reference Model Problems:**
```typescript
// BAD: Reference model
{
  member_id: "123",
  checklist_id: "456",  // ❌ Points to checklist
  cleaner_id: "789"
}

// Problems:
// 1. Customer edits checklist → affects scheduled jobs
// 2. Cleaner changes rate → affects booked jobs
// 3. Platform changes fees → affects existing bookings
// 4. Historical data becomes inaccurate
```

## Implementation Pattern

```typescript
// At booking time
async function createBooking(memberId, cleanerId, date, time) {
  // Fetch current data
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { checklist: true }
  });
  
  const cleaner = await prisma.cleaner.findUnique({
    where: { id: cleanerId }
  });
  
  const platformFee = await settings.get(
    member.tier === 'elite' ? 'platform_fee_elite' : 'platform_fee_free'
  );
  
  // Calculate pricing with current values
  const pricing = pricingService.calculate(
    member.checklist.effort_hours,
    cleaner.hourly_rate,
    platformFee
  );
  
  // CREATE JOB WITH SNAPSHOTS (copies, not links)
  const job = await prisma.job.create({
    data: {
      member_id: memberId,
      cleaner_id: cleanerId,
      
      // Snapshot the checklist
      checklist_snapshot: member.checklist.tasks,  // ✅ COPY
      effort_hours: member.checklist.effort_hours, // ✅ COPY
      
      // Snapshot the rates and fees
      cleaner_rate_snapshot: cleaner.hourly_rate,  // ✅ COPY
      platform_fee_snapshot: platformFee,          // ✅ COPY
      
      // Lock in calculated prices
      subtotal: pricing.subtotal,
      platform_fee_amount: pricing.platformFeeAmount,
      total_price: pricing.totalPrice,
      cleaner_payout: pricing.cleanerPayout,
      
      // ... other fields
    }
  });
  
  return job;
}
```

## Exceptions

**Where we DO use references:**
- `member_id` and `cleaner_id` (people don't change)
- Notes (annotations added after job creation)
- Ratings (created after job completion)

**Why these are safe:**
- Identity references (members, cleaners) are stable
- Post-creation data (notes, ratings) doesn't affect contract

## Trade-offs

**Advantages:**
- ✅ Contract integrity
- ✅ Financial certainty
- ✅ Historical accuracy
- ✅ Dispute resolution clarity

**Disadvantages:**
- ❌ More database storage (JSON fields)
- ❌ Cannot "update all past jobs" if needed
- ❌ Must manage snapshot creation carefully

**Decision:** The disadvantages are acceptable given legal/financial requirements.

## Monitoring

Track snapshot accuracy:
```sql
-- Verify snapshots were created
SELECT COUNT(*) 
FROM jobs 
WHERE checklist_snapshot IS NULL 
  OR cleaner_rate_snapshot IS NULL;

-- Should always be 0
```

## Future Considerations

If we need "bulk update all future jobs" feature:
- Query jobs with `scheduled_date >= TODAY`
- Update snapshots for unstarted jobs only
- Requires admin approval
- Notify affected parties

## Related ADRs
- ADR 004: Job Status State Machine
- ADR 005: Pricing Calculation Engine

