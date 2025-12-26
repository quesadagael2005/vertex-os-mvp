// VERTEX OS - Database Seed Script
// Seeds settings, tasks, zones, and test data

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.rating.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.payoutBatch.deleteMany();
    await prisma.job.deleteMany();
    await prisma.cleanerBlockedDate.deleteMany();
    await prisma.cleanerSchedule.deleteMany();
    await prisma.cleanerZone.deleteMany();
    await prisma.cleaner.deleteMany();
    await prisma.checklist.deleteMany();
    await prisma.member.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.application.deleteMany();
    await prisma.note.deleteMany();
    await prisma.waitlist.deleteMany();
    await prisma.task.deleteMany();
    await prisma.zone.deleteMany();
    await prisma.setting.deleteMany();
    console.log('✅ Cleaned\n');
  }

  // ============================================================================
  // SETTINGS - Configurable Business Rules
  // ============================================================================
  console.log('📊 Seeding settings...');
  
  await prisma.setting.createMany({
    data: [
      // Pricing
      { key: 'platform_fee_free', value: '0.18', category: 'pricing', description: 'Platform fee for Free tier members', valueType: 'number' },
      { key: 'platform_fee_elite', value: '0.13', category: 'pricing', description: 'Platform fee for Elite tier members', valueType: 'number' },
      { key: 'elite_monthly_price', value: '149', category: 'pricing', description: 'Monthly price for Elite membership', valueType: 'number' },
      { key: 'certification_fee', value: '150', category: 'pricing', description: 'Annual cleaner certification fee', valueType: 'number' },
      
      // Effort Modifiers
      { key: 'modifier_priority', value: '1.5', category: 'effort', description: 'Multiplier for priority rooms', valueType: 'number' },
      { key: 'modifier_condition_well_maintained', value: '1.0', category: 'effort', description: 'Multiplier for well-maintained homes', valueType: 'number' },
      { key: 'modifier_condition_needs_attention', value: '1.2', category: 'effort', description: 'Multiplier for needs-attention homes', valueType: 'number' },
      { key: 'modifier_condition_needs_reset', value: '1.4', category: 'effort', description: 'Multiplier for needs-reset homes', valueType: 'number' },
      { key: 'modifier_service_maintenance', value: '0.8', category: 'effort', description: 'Multiplier for maintenance service level', valueType: 'number' },
      { key: 'modifier_service_refresh', value: '1.0', category: 'effort', description: 'Multiplier for refresh service level', valueType: 'number' },
      { key: 'modifier_service_detailed', value: '1.3', category: 'effort', description: 'Multiplier for detailed service level', valueType: 'number' },
      { key: 'modifier_sqft_base', value: '1500', category: 'effort', description: 'Base sqft (1.0x modifier)', valueType: 'number' },
      { key: 'modifier_sqft_per_500', value: '0.1', category: 'effort', description: 'Additional modifier per 500 sqft over base', valueType: 'number' },
      
      // Guarantees
      { key: 'guarantee_window_free', value: '72', category: 'guarantee', description: 'Re-clean window hours for Free tier', valueType: 'number' },
      { key: 'guarantee_window_elite', value: '24', category: 'guarantee', description: 'Re-clean window hours for Elite tier', valueType: 'number' },
      
      // Tier Thresholds
      { key: 'tier_established_jobs', value: '25', category: 'tier', description: 'Jobs required for Established tier', valueType: 'number' },
      { key: 'tier_established_rating', value: '4.5', category: 'tier', description: 'Rating required for Established tier', valueType: 'number' },
      { key: 'tier_top_jobs', value: '75', category: 'tier', description: 'Jobs required for Top Performer tier', valueType: 'number' },
      { key: 'tier_top_rating', value: '4.8', category: 'tier', description: 'Rating required for Top Performer tier', valueType: 'number' },
      
      // Match Score Weights
      { key: 'match_weight_distance', value: '30', category: 'matching', description: 'Weight for distance in match score', valueType: 'number' },
      { key: 'match_weight_rating', value: '25', category: 'matching', description: 'Weight for rating in match score', valueType: 'number' },
      { key: 'match_weight_tier', value: '20', category: 'matching', description: 'Weight for tier in match score', valueType: 'number' },
      { key: 'match_weight_availability', value: '15', category: 'matching', description: 'Weight for availability in match score', valueType: 'number' },
      { key: 'match_weight_history', value: '10', category: 'matching', description: 'Weight for customer history in match score', valueType: 'number' },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ Settings seeded (25 settings)\n');

  // ============================================================================
  // TASKS - Task Library for Checklist Generation
  // ============================================================================
  console.log('📋 Seeding tasks...');
  
  const tasks = [
    // KITCHEN
    { roomType: 'kitchen', name: 'Counters wiped and sanitized', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'kitchen', name: 'Stovetop cleaned', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 8, sortOrder: 2 },
    { roomType: 'kitchen', name: 'Stovetop detailed (drip pans, knobs)', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 12, sortOrder: 3 },
    { roomType: 'kitchen', name: 'Sink scrubbed and sanitized', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 4 },
    { roomType: 'kitchen', name: 'Sink fixtures polished', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 5 },
    { roomType: 'kitchen', name: 'Appliance exteriors wiped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 6, sortOrder: 6 },
    { roomType: 'kitchen', name: 'Inside microwave cleaned', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 7 },
    { roomType: 'kitchen', name: 'Cabinet fronts wiped', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 8, sortOrder: 8 },
    { roomType: 'kitchen', name: 'Backsplash wiped', isBase: false, isPriority: true, isDetailed: false, timeMinutes: 5, sortOrder: 9 },
    { roomType: 'kitchen', name: 'Floor swept and mopped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 10, sortOrder: 10 },
    { roomType: 'kitchen', name: 'Floor edges and corners detailed', isBase: false, isPriority: false, isDetailed: true, timeMinutes: 5, sortOrder: 11 },
    { roomType: 'kitchen', name: 'Trash emptied', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 2, sortOrder: 12 },
    
    // BATHROOM
    { roomType: 'bathroom', name: 'Toilet cleaned and sanitized', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'bathroom', name: 'Toilet exterior wiped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 2 },
    { roomType: 'bathroom', name: 'Sink cleaned and sanitized', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 3 },
    { roomType: 'bathroom', name: 'Sink fixtures polished', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 4 },
    { roomType: 'bathroom', name: 'Mirror cleaned', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 5 },
    { roomType: 'bathroom', name: 'Counters wiped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 6 },
    { roomType: 'bathroom', name: 'Shower/tub scrubbed', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 10, sortOrder: 7 },
    { roomType: 'bathroom', name: 'Shower doors/curtain cleaned', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 8 },
    { roomType: 'bathroom', name: 'Shower grout detailed', isBase: false, isPriority: false, isDetailed: true, timeMinutes: 10, sortOrder: 9 },
    { roomType: 'bathroom', name: 'Floor swept and mopped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 10 },
    { roomType: 'bathroom', name: 'Trash emptied', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 2, sortOrder: 11 },
    { roomType: 'bathroom', name: 'Towels folded/arranged', isBase: false, isPriority: true, isDetailed: false, timeMinutes: 3, sortOrder: 12 },
    
    // BEDROOM
    { roomType: 'bedroom', name: 'Bed made', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'bedroom', name: 'Bed linens changed', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 10, sortOrder: 2 },
    { roomType: 'bedroom', name: 'Nightstands dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 3 },
    { roomType: 'bedroom', name: 'Dresser tops dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 4 },
    { roomType: 'bedroom', name: 'Floor vacuumed', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 8, sortOrder: 5 },
    { roomType: 'bedroom', name: 'Floor edges vacuumed', isBase: false, isPriority: false, isDetailed: true, timeMinutes: 4, sortOrder: 6 },
    { roomType: 'bedroom', name: 'Under bed vacuumed', isBase: false, isPriority: false, isDetailed: true, timeMinutes: 5, sortOrder: 7 },
    { roomType: 'bedroom', name: 'Mirrors cleaned', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 8 },
    { roomType: 'bedroom', name: 'Trash emptied', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 2, sortOrder: 9 },
    
    // LIVING ROOM
    { roomType: 'living_room', name: 'Surfaces dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 8, sortOrder: 1 },
    { roomType: 'living_room', name: 'Coffee table cleaned', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 2 },
    { roomType: 'living_room', name: 'TV and electronics dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 3 },
    { roomType: 'living_room', name: 'Couch cushions straightened', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 4 },
    { roomType: 'living_room', name: 'Couch vacuumed', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 8, sortOrder: 5 },
    { roomType: 'living_room', name: 'Floor vacuumed', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 10, sortOrder: 6 },
    { roomType: 'living_room', name: 'Floor edges vacuumed', isBase: false, isPriority: false, isDetailed: true, timeMinutes: 5, sortOrder: 7 },
    { roomType: 'living_room', name: 'Throw pillows arranged', isBase: false, isPriority: true, isDetailed: false, timeMinutes: 2, sortOrder: 8 },
    { roomType: 'living_room', name: 'Trash emptied', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 2, sortOrder: 9 },
    
    // DINING ROOM
    { roomType: 'dining_room', name: 'Table wiped and polished', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'dining_room', name: 'Chairs wiped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 2 },
    { roomType: 'dining_room', name: 'Surfaces dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 3 },
    { roomType: 'dining_room', name: 'Floor vacuumed/swept', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 8, sortOrder: 4 },
    { roomType: 'dining_room', name: 'Floor mopped', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 5 },
    
    // OFFICE
    { roomType: 'office', name: 'Desk surface cleared and wiped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'office', name: 'Desk items arranged', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 2 },
    { roomType: 'office', name: 'Shelves dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 3 },
    { roomType: 'office', name: 'Electronics dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 4 },
    { roomType: 'office', name: 'Floor vacuumed', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 8, sortOrder: 5 },
    { roomType: 'office', name: 'Trash emptied', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 2, sortOrder: 6 },
    
    // LAUNDRY
    { roomType: 'laundry', name: 'Appliance exteriors wiped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'laundry', name: 'Counters/surfaces wiped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 2 },
    { roomType: 'laundry', name: 'Floor swept and mopped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 3 },
    { roomType: 'laundry', name: 'Lint trap cleaned', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 2, sortOrder: 4 },
    
    // ENTRYWAY
    { roomType: 'entryway', name: 'Floor swept/vacuumed', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'entryway', name: 'Floor mopped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 2 },
    { roomType: 'entryway', name: 'Surfaces dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 3 },
    { roomType: 'entryway', name: 'Door and handle wiped', isBase: false, isPriority: true, isDetailed: true, timeMinutes: 2, sortOrder: 4 },
    { roomType: 'entryway', name: 'Shoe area organized', isBase: false, isPriority: true, isDetailed: false, timeMinutes: 3, sortOrder: 5 },
    
    // HALLWAY
    { roomType: 'hallway', name: 'Floor vacuumed/swept', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 5, sortOrder: 1 },
    { roomType: 'hallway', name: 'Floor mopped', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 2 },
    { roomType: 'hallway', name: 'Surfaces dusted', isBase: true, isPriority: true, isDetailed: true, timeMinutes: 3, sortOrder: 3 },
    { roomType: 'hallway', name: 'Light switches wiped', isBase: false, isPriority: false, isDetailed: true, timeMinutes: 2, sortOrder: 4 },
  ];
  
  await prisma.task.createMany({
    data: tasks,
    skipDuplicates: true,
  });
  
  console.log(`✅ Tasks seeded (${tasks.length} tasks across 9 room types)\n`);

  // ============================================================================
  // ZONES - Service Areas
  // ============================================================================
  console.log('🗺️  Seeding zones...');
  
  await prisma.zone.createMany({
    data: [
      { 
        name: 'North Scottsdale', 
        description: 'Premium residential area',
        zipCodes: ['85255', '85260', '85262', '85266'],
        status: 'ACTIVE'
      },
      { 
        name: 'Central Scottsdale', 
        description: 'Downtown and Old Town',
        zipCodes: ['85251', '85254', '85257', '85258'],
        status: 'ACTIVE'
      },
      { 
        name: 'South Scottsdale', 
        description: 'Growing area',
        zipCodes: ['85250', '85256', '85259'],
        status: 'WAITLIST'
      },
      { 
        name: 'Paradise Valley', 
        description: 'Luxury homes',
        zipCodes: ['85253'],
        status: 'WAITLIST'
      },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ Zones seeded (4 zones)\n');

  // ============================================================================
  // TEST DATA (Development Only)
  // ============================================================================
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Seeding test data...\n');
    
    // Test Member
    console.log('  Creating test member...');
    const testMember = await prisma.member.create({
      data: {
        email: 'sarah@example.com',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYRMYX3tQPi', // "password123"
        phone: '+14805551234',
        addressFull: '12345 N Scottsdale Rd, Scottsdale, AZ 85255',
        addressZip: '85255',
        tier: 'FREE',
        sqft: 2200,
        bedrooms: 3,
        bathrooms: 2.5,
        status: 'ACTIVE',
      },
    });
    console.log('  ✅ Test member created');
    
    // Test Cleaner
    console.log('  Creating test cleaner...');
    const testCleaner = await prisma.cleaner.create({
      data: {
        email: 'maria@example.com',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYRMYX3tQPi', // "password123"
        firstName: 'Maria',
        lastName: 'Garcia',
        phone: '+14805555678',
        addressZip: '85255',
        addressLat: 33.6119,
        addressLng: -111.8906,
        hourlyRate: 30,
        maxTravelMinutes: 45,
        tier: 'ESTABLISHED',
        ratingAverage: 4.8,
        ratingCount: 47,
        jobsCompleted: 52,
        status: 'ACTIVE',
      },
    });
    console.log('  ✅ Test cleaner created');
    
    // Link cleaner to zones
    const zones = await prisma.zone.findMany({ where: { status: 'ACTIVE' } });
    await prisma.cleanerZone.createMany({
      data: zones.map(zone => ({
        cleanerId: testCleaner.id,
        zoneId: zone.id,
      })),
    });
    console.log('  ✅ Cleaner linked to zones');
    
    // Cleaner schedule
    await prisma.cleanerSchedule.createMany({
      data: [
        { cleanerId: testCleaner.id, dayOfWeek: 1, startTime: '08:00', endTime: '17:00' }, // Monday
        { cleanerId: testCleaner.id, dayOfWeek: 2, startTime: '08:00', endTime: '17:00' }, // Tuesday
        { cleanerId: testCleaner.id, dayOfWeek: 3, startTime: '08:00', endTime: '17:00' }, // Wednesday
        { cleanerId: testCleaner.id, dayOfWeek: 4, startTime: '08:00', endTime: '17:00' }, // Thursday
        { cleanerId: testCleaner.id, dayOfWeek: 5, startTime: '08:00', endTime: '15:00' }, // Friday
      ],
    });
    console.log('  ✅ Cleaner schedule created');
    
    // Test checklist
    console.log('  Creating test checklist...');
    const testChecklist = await prisma.checklist.create({
      data: {
        memberId: testMember.id,
        tasks: [
          { room: 'kitchen', taskName: 'Counters wiped and sanitized', timeMinutes: 5, isPriority: true },
          { room: 'kitchen', taskName: 'Stovetop cleaned', timeMinutes: 8, isPriority: true },
          { room: 'kitchen', taskName: 'Floor swept and mopped', timeMinutes: 10, isPriority: true },
          { room: 'bathroom_1', taskName: 'Toilet cleaned and sanitized', timeMinutes: 5, isPriority: false },
          { room: 'bathroom_1', taskName: 'Shower/tub scrubbed', timeMinutes: 10, isPriority: false },
          { room: 'bedroom_1', taskName: 'Bed made', timeMinutes: 5, isPriority: false },
          { room: 'bedroom_1', taskName: 'Floor vacuumed', timeMinutes: 8, isPriority: false },
          { room: 'living_room', taskName: 'Surfaces dusted', timeMinutes: 8, isPriority: false },
          { room: 'living_room', taskName: 'Floor vacuumed', timeMinutes: 10, isPriority: false },
        ],
        totalTasks: 9,
        totalTimeMinutes: 69,
        effortHours: 1.15,
        rooms: [
          { type: 'kitchen', qty: 1 },
          { type: 'bathroom', qty: 2 },
          { type: 'bedroom', qty: 3 },
          { type: 'living_room', qty: 1 },
        ],
        priorityZones: ['kitchen'],
        serviceLevel: 'refresh',
        condition: 'well-maintained',
        sqft: 2200,
      },
    });
    
    // Update member with checklist
    await prisma.member.update({
      where: { id: testMember.id },
      data: { checklistId: testChecklist.id },
    });
    console.log('  ✅ Test checklist created\n');
    
    console.log('✅ Test data seeded!\n');
  }

  console.log('🎉 Database seeding complete!\n');
  console.log('Summary:');
  console.log('  • 25 settings configured');
  console.log('  • 71 tasks across 9 room types');
  console.log('  • 4 service zones');
  if (process.env.NODE_ENV === 'development') {
    console.log('  • Test member (sarah@example.com)');
    console.log('  • Test cleaner (maria@example.com)');
    console.log('  • Test checklist');
  }
  console.log('\n✨ Ready to build VERTEX OS!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



