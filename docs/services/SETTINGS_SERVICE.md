# SettingsService

**Config-Driven Business Logic** - All business rules (fees, modifiers, thresholds) come from the database.

## Overview

The SettingsService provides a type-safe interface to read and write configurable business rules stored in the `settings` table. This allows administrators to modify business logic without code changes.

## Architecture

- **Single Source of Truth**: All settings live in the database
- **Type-Safe Parsing**: Automatic type conversion based on `value_type`
- **Category Grouping**: Settings organized by category (pricing, tiers, general, etc.)
- **Admin Configurable**: Settings can be updated at runtime

## Supported Value Types

- `string`: Text values (default)
- `number`: Numeric values (automatically parsed)
- `boolean`: true/false values
- `json`: Complex objects (automatically parsed)

## Usage Examples

### Get a Single Setting

```typescript
import { settingsService } from '@/lib/services';

// Get base fee (returns number)
const baseFee = await settingsService.get('base_fee_cents');
// => 2500

// Get company name (returns string)
const companyName = await settingsService.get('company_name');
// => "Red Shirt Club"

// Get booking status (returns boolean)
const isAccepting = await settingsService.get('is_accepting_bookings');
// => true

// Get tier features (returns object)
const tierFeatures = await settingsService.get('tier_features');
// => { silver: [...], gold: [...] }
```

### Get All Settings in a Category

```typescript
// Get all pricing settings
const pricingSettings = await settingsService.getCategory('pricing');
// => {
//   base_fee_cents: 2500,
//   per_minute_cents: 50,
//   platform_fee_percent: 15,
//   ...
// }
```

### Get All Settings (Grouped by Category)

```typescript
const allSettings = await settingsService.getAll();
// => {
//   general: { company_name: "Red Shirt Club", ... },
//   pricing: { base_fee_cents: 2500, ... },
//   tiers: { ... },
//   ...
// }
```

### Update a Setting (Admin Only)

```typescript
// Update base fee to $30.00
await settingsService.update('base_fee_cents', '3000');

// Update booking status
await settingsService.update('is_accepting_bookings', 'false');
```

### Create a New Setting (Admin Only)

```typescript
await settingsService.create({
  key: 'new_feature_enabled',
  value: 'true',
  category: 'features',
  description: 'Enable new feature',
  valueType: 'boolean',
});
```

## Seeded Settings

The database comes pre-seeded with 25 essential settings:

### General
- `company_name`: "Red Shirt Club"
- `is_accepting_bookings`: true
- `min_booking_notice_hours`: 24
- `max_booking_advance_days`: 90

### Pricing
- `base_fee_cents`: 2500
- `per_minute_cents`: 50
- `platform_fee_percent`: 15
- `stripe_fee_percent`: 2.9
- `stripe_fee_fixed_cents`: 30

### Tiers (Silver, Gold, Diamond)
- `tier_silver_monthly_cents`: 2900
- `tier_gold_monthly_cents`: 4900
- `tier_diamond_monthly_cents`: 9900
- `tier_silver_discount_percent`: 0
- `tier_gold_discount_percent`: 15
- `tier_diamond_discount_percent`: 25

### Modifiers
- `modifier_weekend_percent`: 20
- `modifier_rush_percent`: 30
- `modifier_eco_percent`: 10
- `modifier_pet_friendly_percent`: 15

### Thresholds
- `min_job_value_cents`: 5000
- `max_job_hours`: 8
- `application_approval_threshold_days`: 7

## Error Handling

```typescript
try {
  const value = await settingsService.get('nonexistent_key');
} catch (error) {
  // => Error: Setting not found: nonexistent_key
}

try {
  await settingsService.update('base_fee_cents', 'not a number');
} catch (error) {
  // => Error: Value must be a number: not a number
}
```

## Testing

Comprehensive test coverage (17 tests):
- ✅ Type parsing (string, number, boolean, json)
- ✅ Category queries
- ✅ Get all settings
- ✅ Update with validation
- ✅ Create with validation
- ✅ Error handling
- ✅ Edge cases

Run tests:
```bash
pnpm test tests/services/settings.test.ts
```

## API Integration

Use with API routes:

```typescript
// GET /api/admin/settings
export async function GET() {
  const settings = await settingsService.getAll();
  return Response.json(settings);
}

// PATCH /api/admin/settings/:key
export async function PATCH(
  req: Request,
  { params }: { params: { key: string } }
) {
  const { value } = await req.json();
  await settingsService.update(params.key, value);
  return Response.json({ success: true });
}
```

## Best Practices

1. **Never hardcode business rules** - Always use settings
2. **Cache frequently used settings** - Implement caching layer for high-traffic
3. **Validate admin updates** - Always validate before updating
4. **Audit changes** - Log all setting changes for compliance
5. **Use categories** - Group related settings for easier management

## Related Services

- **PricingService**: Uses pricing settings for calculations
- **TierService**: Uses tier settings for feature checks
- **BookingService**: Uses general and threshold settings



