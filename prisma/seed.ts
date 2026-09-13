/**
 * CivicResolve — Database Seed
 *
 * Creates realistic demo data so the app looks populated on first run.
 * Run with: npx prisma db seed
 *
 * Credentials are documented in README.md only — never in source comments.
 */

import { PrismaClient, Priority, ComplaintStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function hoursFromNow(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

function generateComplaintNumber(seq: number, year: number = 2026): string {
  return `CMP-${year}-${String(seq).padStart(6, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  // Production safety guard
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    console.error("❌ ERROR: Database seed execution blocked in production environment.");
    console.error("Set ALLOW_PRODUCTION_SEED=true in environment variables if seeding is explicitly required.");
    process.exit(1);
  }

  console.log("🌱 Starting database seed...\n");

  const SEED_ADMIN_PASS = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
  const SEED_MANAGER_PASS = process.env.SEED_MANAGER_PASSWORD || "Manager@123456";
  const SEED_OFFICER_PASS = process.env.SEED_OFFICER_PASSWORD || "Officer@123456";
  const SEED_CITIZEN_PASS = process.env.SEED_CITIZEN_PASSWORD || "Citizen@123456";

  // ── SLA Rules ─────────────────────────────────────────────
  console.log("→ Seeding SLA rules...");
  const slaRules = await Promise.all([
    prisma.sLARule.upsert({
      where: { priority: "LOW" },
      update: {},
      create: { priority: "LOW", resolutionHours: 240, warningThresholdPercent: 80 },
    }),
    prisma.sLARule.upsert({
      where: { priority: "MEDIUM" },
      update: {},
      create: { priority: "MEDIUM", resolutionHours: 120, warningThresholdPercent: 80 },
    }),
    prisma.sLARule.upsert({
      where: { priority: "HIGH" },
      update: {},
      create: { priority: "HIGH", resolutionHours: 48, warningThresholdPercent: 75 },
    }),
    prisma.sLARule.upsert({
      where: { priority: "CRITICAL" },
      update: {},
      create: { priority: "CRITICAL", resolutionHours: 24, warningThresholdPercent: 70 },
    }),
  ]);

  // Map for quick lookup
  const slaMap: Record<Priority, number> = {
    LOW: 240,
    MEDIUM: 120,
    HIGH: 48,
    CRITICAL: 24,
  };

  function getSLADeadline(priority: Priority, from: Date): Date {
    const d = new Date(from);
    d.setTime(d.getTime() + slaMap[priority] * 60 * 60 * 1000);
    return d;
  }

  // ── Departments ───────────────────────────────────────────
  console.log("→ Seeding departments...");
  const deptData = [
    { name: "Municipal Services", code: "MUN", description: "General municipal services and public affairs" },
    { name: "Water & Sanitation", code: "WAS", description: "Water supply, drainage, and sanitation services" },
    { name: "Traffic Management", code: "TRF", description: "Traffic control, signals, and road safety" },
    { name: "Public Works", code: "PWK", description: "Roads, bridges, and infrastructure maintenance" },
    { name: "Parks & Recreation", code: "PAR", description: "Parks, gardens, and recreational facilities" },
    { name: "Public Health", code: "PHC", description: "Health services, waste management, and hygiene" },
    { name: "Education Services", code: "EDU", description: "Public schools, libraries, and education facilities" },
  ];

  const departments: Record<string, { id: string; name: string }> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
    departments[d.code] = dept;
  }

  // ── Categories ────────────────────────────────────────────
  console.log("→ Seeding categories...");
  const categoryData = [
    { name: "Roads & Infrastructure", description: "Potholes, road damage, and infrastructure issues", deptCode: "PWK" },
    { name: "Street Lighting", description: "Broken or missing street lights", deptCode: "MUN" },
    { name: "Water & Sanitation", description: "Water supply interruptions, leaks, and sanitation", deptCode: "WAS" },
    { name: "Waste Management", description: "Garbage collection and waste disposal", deptCode: "PHC" },
    { name: "Electricity", description: "Power outages, illegal connections, and electrical hazards", deptCode: "MUN" },
    { name: "Traffic", description: "Traffic congestion, signal faults, and road markings", deptCode: "TRF" },
    { name: "Public Safety", description: "Safety hazards, illegal activities, and emergency responses", deptCode: "MUN" },
    { name: "Parks & Recreation", description: "Park maintenance, facilities, and recreational areas", deptCode: "PAR" },
    { name: "Healthcare", description: "Public health facilities and medical service issues", deptCode: "PHC" },
    { name: "Education", description: "School infrastructure and public education services", deptCode: "EDU" },
    { name: "Other", description: "Other public service complaints", deptCode: "MUN" },
  ];

  const categories: Record<string, { id: string; name: string }> = {};
  for (const c of categoryData) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: {
        name: c.name,
        description: c.description,
        departmentId: departments[c.deptCode].id,
      },
    });
    categories[c.name] = cat;
  }

  // ── Users ─────────────────────────────────────────────────
  console.log("→ Seeding users...");

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@civicresolve.gov" },
    update: {},
    create: {
      email: "admin@civicresolve.gov",
      name: "System Administrator",
      firstName: "System",
      lastName: "Administrator",
      passwordHash: await hash(SEED_ADMIN_PASS),
      role: "ADMIN",
      isActive: true,
    },
  });

  // Department Managers
  const mgr1 = await prisma.user.upsert({
    where: { email: "manager.works@civicresolve.gov" },
    update: {},
    create: {
      email: "manager.works@civicresolve.gov",
      name: "James Okafor",
      firstName: "James",
      lastName: "Okafor",
      passwordHash: await hash(SEED_MANAGER_PASS),
      role: "DEPARTMENT_MANAGER",
      departmentId: departments["PWK"].id,
      isActive: true,
    },
  });

  const mgr2 = await prisma.user.upsert({
    where: { email: "manager.water@civicresolve.gov" },
    update: {},
    create: {
      email: "manager.water@civicresolve.gov",
      name: "Amina Hassan",
      firstName: "Amina",
      lastName: "Hassan",
      passwordHash: await hash(SEED_MANAGER_PASS),
      role: "DEPARTMENT_MANAGER",
      departmentId: departments["WAS"].id,
      isActive: true,
    },
  });

  const mgr3 = await prisma.user.upsert({
    where: { email: "manager.traffic@civicresolve.gov" },
    update: {},
    create: {
      email: "manager.traffic@civicresolve.gov",
      name: "David Mensah",
      firstName: "David",
      lastName: "Mensah",
      passwordHash: await hash(SEED_MANAGER_PASS),
      role: "DEPARTMENT_MANAGER",
      departmentId: departments["TRF"].id,
      isActive: true,
    },
  });

  // Assign managers to departments
  await prisma.department.update({
    where: { id: departments["PWK"].id },
    data: { managerId: mgr1.id },
  });
  await prisma.department.update({
    where: { id: departments["WAS"].id },
    data: { managerId: mgr2.id },
  });
  await prisma.department.update({
    where: { id: departments["TRF"].id },
    data: { managerId: mgr3.id },
  });

  // Officers
  const officerData = [
    { email: "officer.kwame@civicresolve.gov", name: "Kwame Asante", firstName: "Kwame", lastName: "Asante", deptCode: "PWK" },
    { email: "officer.fatima@civicresolve.gov", name: "Fatima Al-Rashid", firstName: "Fatima", lastName: "Al-Rashid", deptCode: "PWK" },
    { email: "officer.samuel@civicresolve.gov", name: "Samuel Nkrumah", firstName: "Samuel", lastName: "Nkrumah", deptCode: "WAS" },
    { email: "officer.grace@civicresolve.gov", name: "Grace Owusu", firstName: "Grace", lastName: "Owusu", deptCode: "TRF" },
    { email: "officer.emmanuel@civicresolve.gov", name: "Emmanuel Adeyemi", firstName: "Emmanuel", lastName: "Adeyemi", deptCode: "MUN" },
  ];

  const officers: Record<string, { id: string }> = {};
  for (const o of officerData) {
    const officer = await prisma.user.upsert({
      where: { email: o.email },
      update: {},
      create: {
        email: o.email,
        name: o.name,
        firstName: o.firstName,
        lastName: o.lastName,
        passwordHash: await hash(SEED_OFFICER_PASS),
        role: "OFFICER",
        departmentId: departments[o.deptCode].id,
        isActive: true,
      },
    });
    officers[o.email] = officer;
  }

  // Citizens
  const citizenData = [
    { email: "citizen.alice@example.com", name: "Alice Boateng", firstName: "Alice", lastName: "Boateng" },
    { email: "citizen.bob@example.com", name: "Bob Adjei", firstName: "Bob", lastName: "Adjei" },
    { email: "citizen.carol@example.com", name: "Carol Mensah", firstName: "Carol", lastName: "Mensah" },
    { email: "citizen.dan@example.com", name: "Daniel Ofori", firstName: "Daniel", lastName: "Ofori" },
    { email: "citizen.eve@example.com", name: "Eve Acheampong", firstName: "Eve", lastName: "Acheampong" },
    { email: "citizen.frank@example.com", name: "Frank Asiedu", firstName: "Frank", lastName: "Asiedu" },
    { email: "citizen.grace@example.com", name: "Grace Tetteh", firstName: "Grace", lastName: "Tetteh" },
    { email: "citizen.henry@example.com", name: "Henry Agyeman", firstName: "Henry", lastName: "Agyeman" },
    { email: "citizen.irene@example.com", name: "Irene Darko", firstName: "Irene", lastName: "Darko" },
    { email: "citizen.james@example.com", name: "James Opoku", firstName: "James", lastName: "Opoku" },
  ];

  const citizens: { id: string; email: string }[] = [];
  for (const c of citizenData) {
    const citizen = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        firstName: c.firstName,
        lastName: c.lastName,
        passwordHash: await hash(SEED_CITIZEN_PASS),
        role: "CITIZEN",
        isActive: true,
      },
    });
    citizens.push(citizen);
  }

  // ── Complaints ─────────────────────────────────────────────
  console.log("→ Seeding complaints...");

  type ComplaintSeed = {
    seq: number;
    title: string;
    description: string;
    priority: Priority;
    status: ComplaintStatus;
    categoryName: string;
    deptCode: string;
    citizenIndex: number;
    officerEmail?: string;
    location: string;
    latitude?: number;
    longitude?: number;
    createdDaysAgo: number;
    resolvedDaysAgo?: number;
    closedDaysAgo?: number;
  };

  const complaintSeeds: ComplaintSeed[] = [
    {
      seq: 1, title: "Large pothole on Main Street causing vehicle damage",
      description: "There is a very large pothole approximately 60cm wide and 15cm deep on Main Street near the junction with Oak Avenue. Multiple vehicles have been damaged. It has been present for over 3 weeks and is getting worse with each rainfall.",
      priority: "HIGH", status: "IN_PROGRESS", categoryName: "Roads & Infrastructure", deptCode: "PWK",
      citizenIndex: 0, officerEmail: "officer.kwame@civicresolve.gov",
      location: "Main Street, near Oak Avenue junction", latitude: 5.6037, longitude: -0.1870,
      createdDaysAgo: 12,
    },
    {
      seq: 2, title: "Street lights out along Market Road for two weeks",
      description: "Seven consecutive street lights on Market Road between Broad Street and Chapel Square have been non-functional for approximately two weeks. The area is very dark at night creating safety concerns for pedestrians and motorists.",
      priority: "MEDIUM", status: "ASSIGNED", categoryName: "Street Lighting", deptCode: "MUN",
      citizenIndex: 1, officerEmail: "officer.emmanuel@civicresolve.gov",
      location: "Market Road, between Broad Street and Chapel Square",
      createdDaysAgo: 15,
    },
    {
      seq: 3, title: "Water pipe burst flooding residential area",
      description: "A major water pipe has burst on Elm Street, flooding three residential properties and the adjacent road. Water has been flowing uncontrolled for 6 hours. Several families cannot access their homes safely.",
      priority: "CRITICAL", status: "RESOLVED", categoryName: "Water & Sanitation", deptCode: "WAS",
      citizenIndex: 2, officerEmail: "officer.samuel@civicresolve.gov",
      location: "Elm Street, residential block 4", latitude: 5.6142, longitude: -0.2075,
      createdDaysAgo: 20, resolvedDaysAgo: 15,
    },
    {
      seq: 4, title: "Overflowing rubbish bins near Central Market",
      description: "The rubbish collection bins at the Central Market area have been overflowing for 5 days. Waste is spilling onto the pavement and road. The smell is affecting nearby businesses and there are concerns about rats and insects.",
      priority: "HIGH", status: "CLOSED", categoryName: "Waste Management", deptCode: "PHC",
      citizenIndex: 3, officerEmail: "officer.emmanuel@civicresolve.gov",
      location: "Central Market, North entrance",
      createdDaysAgo: 30, resolvedDaysAgo: 24, closedDaysAgo: 20,
    },
    {
      seq: 5, title: "Traffic signals at City Cross malfunctioning",
      description: "The traffic signals at the City Cross intersection have been cycling incorrectly since Monday morning. The signals are out of sync causing significant congestion during peak hours. Three minor accidents have occurred in the past two days.",
      priority: "CRITICAL", status: "IN_PROGRESS", categoryName: "Traffic", deptCode: "TRF",
      citizenIndex: 4, officerEmail: "officer.grace@civicresolve.gov",
      location: "City Cross intersection, Central District", latitude: 5.5502, longitude: -0.2174,
      createdDaysAgo: 3,
    },
    {
      seq: 6, title: "Broken playground equipment at Riverside Park",
      description: "The climbing frame at Riverside Park children's playground has a broken support bar that poses a serious injury risk to children. The equipment has been damaged for at least one week. I have seen children playing on it despite the risk.",
      priority: "HIGH", status: "UNDER_REVIEW", categoryName: "Parks & Recreation", deptCode: "PAR",
      citizenIndex: 5,
      location: "Riverside Park, children's playground area",
      createdDaysAgo: 5,
    },
    {
      seq: 7, title: "Raw sewage overflow in North Quarter residential street",
      description: "A sewage overflow is occurring from a manhole on Pine Street in the North Quarter. Raw sewage is flowing down the street and into the storm drain. The smell is overpowering and there are obvious health risks for residents.",
      priority: "CRITICAL", status: "ASSIGNED", categoryName: "Water & Sanitation", deptCode: "WAS",
      citizenIndex: 6, officerEmail: "officer.samuel@civicresolve.gov",
      location: "Pine Street, North Quarter", latitude: 5.6284, longitude: -0.1678,
      createdDaysAgo: 2,
    },
    {
      seq: 8, title: "Illegal dumping site behind Community Centre",
      description: "People have been illegally dumping construction waste, old furniture, and household rubbish behind the Community Centre on Bridge Road. The dump has grown significantly over the past month and is now blocking the emergency access lane.",
      priority: "MEDIUM", status: "SUBMITTED", categoryName: "Waste Management", deptCode: "PHC",
      citizenIndex: 7,
      location: "Behind Community Centre, Bridge Road",
      createdDaysAgo: 1,
    },
    {
      seq: 9, title: "Abandoned vehicle blocking access to public car park",
      description: "A silver Toyota Corolla (no licence plates) has been abandoned at the entrance of the West Street public car park for 11 days. It is blocking one of the two entry lanes and causing significant queuing during peak hours.",
      priority: "LOW", status: "CLOSED", categoryName: "Traffic", deptCode: "TRF",
      citizenIndex: 8, officerEmail: "officer.grace@civicresolve.gov",
      location: "West Street Public Car Park, entrance",
      createdDaysAgo: 25, resolvedDaysAgo: 20, closedDaysAgo: 18,
    },
    {
      seq: 10, title: "Exposed electrical wiring near primary school",
      description: "There is exposed electrical wiring hanging from a utility pole directly outside Sunshine Primary School on School Lane. The wiring appears to have been damaged and is hanging low enough for tall adults to potentially make contact. This is extremely dangerous given the school's location.",
      priority: "CRITICAL", status: "IN_PROGRESS", categoryName: "Electricity", deptCode: "MUN",
      citizenIndex: 9, officerEmail: "officer.emmanuel@civicresolve.gov",
      location: "School Lane, outside Sunshine Primary School",
      createdDaysAgo: 1,
    },
    {
      seq: 11, title: "Road markings on hospital approach completely faded",
      description: "The road markings, pedestrian crossings, and lane indicators on the hospital approach road are completely faded and invisible in wet conditions. This is particularly dangerous as ambulances use this road regularly and pedestrians frequently cross here.",
      priority: "HIGH", status: "RESOLVED", categoryName: "Roads & Infrastructure", deptCode: "PWK",
      citizenIndex: 0, officerEmail: "officer.fatima@civicresolve.gov",
      location: "Hospital Approach Road, City General Hospital",
      createdDaysAgo: 35, resolvedDaysAgo: 10,
    },
    {
      seq: 12, title: "Water pressure extremely low in South Estate",
      description: "Residents in the South Estate have been experiencing very low water pressure for the past week. Water barely reaches the upper floors of multi-story buildings. The issue seems to affect the entire estate (approximately 200 households).",
      priority: "MEDIUM", status: "UNDER_REVIEW", categoryName: "Water & Sanitation", deptCode: "WAS",
      citizenIndex: 1,
      location: "South Estate, all blocks",
      createdDaysAgo: 7,
    },
    {
      seq: 13, title: "Overgrown trees blocking footpath and road visibility",
      description: "Several trees along the footpath on Garden Avenue have grown to the point where they are blocking the pavement and significantly obscuring road signs and visibility at the junction with Park Road. Pedestrians are forced into the road.",
      priority: "LOW", status: "SUBMITTED", categoryName: "Parks & Recreation", deptCode: "PAR",
      citizenIndex: 2,
      location: "Garden Avenue, near junction with Park Road",
      createdDaysAgo: 0,
    },
    {
      seq: 14, title: "Healthcare clinic closed without notice for three days",
      description: "The East District Community Clinic has been closed without any public notice for three days. There is no sign on the door explaining the closure or directing patients elsewhere. Elderly residents and those with chronic conditions are severely affected.",
      priority: "HIGH", status: "REJECTED", categoryName: "Healthcare", deptCode: "PHC",
      citizenIndex: 3,
      location: "East District Community Clinic, Constitution Road",
      createdDaysAgo: 10,
    },
    {
      seq: 15, title: "Bridge railings damaged and missing sections",
      description: "The pedestrian railings on the footbridge over Canal Street are damaged with two sections completely missing. This bridge is used by hundreds of school children and commuters daily. The drop from the bridge to the canal below is approximately 4 metres.",
      priority: "CRITICAL", status: "IN_PROGRESS", categoryName: "Roads & Infrastructure", deptCode: "PWK",
      citizenIndex: 4, officerEmail: "officer.kwame@civicresolve.gov",
      location: "Footbridge over Canal Street, near bus station",
      createdDaysAgo: 4,
    },
    {
      seq: 16, title: "School building roof leaking during rainfall",
      description: "The roof of the main hall at Northgate Secondary School has been leaking severely during rainfall events. Students cannot safely use the hall. Several computers and other equipment have already been damaged by water. The issue has been ongoing for two months.",
      priority: "HIGH", status: "ASSIGNED", categoryName: "Education", deptCode: "EDU",
      citizenIndex: 5,
      location: "Northgate Secondary School, main hall",
      createdDaysAgo: 8,
    },
    {
      seq: 17, title: "Persistent flooding at bus terminal after rain",
      description: "The central bus terminal floods to ankle depth within 30 minutes of any significant rainfall. The drainage system is clearly blocked or inadequate. Passengers are unable to board buses without wading through water. This has been an issue for every rainy season for the past 3 years.",
      priority: "MEDIUM", status: "UNDER_REVIEW", categoryName: "Roads & Infrastructure", deptCode: "PWK",
      citizenIndex: 6,
      location: "Central Bus Terminal, entrance and platforms 1–4",
      createdDaysAgo: 6,
    },
    {
      seq: 18, title: "Street vendor blocking emergency vehicle access",
      description: "Informal street vendors have set up permanent stalls in front of Station Road fire station, completely blocking the exit lane used by fire engines. The fire station has reportedly had difficulty responding to at least one recent call. This is an urgent public safety matter.",
      priority: "CRITICAL", status: "CLOSED", categoryName: "Public Safety", deptCode: "MUN",
      citizenIndex: 7, officerEmail: "officer.emmanuel@civicresolve.gov",
      location: "Station Road Fire Station, main exit",
      createdDaysAgo: 45, resolvedDaysAgo: 40, closedDaysAgo: 35,
    },
    {
      seq: 19, title: "Broken water meter causing excessive billing",
      description: "My water meter appears to be faulty and is recording consumption that is 8 times my usual usage. I have received a bill for GH₵1,240 this month when my average is GH₵155. I have not changed my usage patterns and suspect the meter is damaged or has been tampered with.",
      priority: "MEDIUM", status: "IN_PROGRESS", categoryName: "Water & Sanitation", deptCode: "WAS",
      citizenIndex: 8, officerEmail: "officer.samuel@civicresolve.gov",
      location: "14 Mango Close, West Residential Area",
      createdDaysAgo: 9,
    },
    {
      seq: 20, title: "Graffiti vandalism on public library exterior",
      description: "The exterior walls of the Central Public Library have been extensively covered in graffiti over the past weekend. The vandalism covers approximately 30 square metres of the front and side facade. As a public building this is particularly disrespectful and should be addressed promptly.",
      priority: "LOW", status: "SUBMITTED", categoryName: "Other", deptCode: "MUN",
      citizenIndex: 9,
      location: "Central Public Library, Library Square",
      createdDaysAgo: 0,
    },
  ];

  const createdComplaints: { id: string; seq: number; status: ComplaintStatus; citizenId: string }[] = [];

  for (const seed of complaintSeeds) {
    const createdAt = daysAgo(seed.createdDaysAgo);
    const category = categories[seed.categoryName];
    const dept = departments[seed.deptCode];
    const citizen = citizens[seed.citizenIndex];
    const officerId = seed.officerEmail ? officers[seed.officerEmail]?.id : undefined;
    const slaDeadline = getSLADeadline(seed.priority, createdAt);

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber: generateComplaintNumber(seed.seq),
        title: seed.title,
        description: seed.description,
        priority: seed.priority,
        status: seed.status,
        location: seed.location,
        latitude: seed.latitude,
        longitude: seed.longitude,
        slaDeadline,
        categoryId: category.id,
        departmentId: dept.id,
        citizenId: citizen.id,
        assignedOfficerId: officerId ?? null,
        resolvedAt: seed.resolvedDaysAgo ? daysAgo(seed.resolvedDaysAgo) : null,
        closedAt: seed.closedDaysAgo ? daysAgo(seed.closedDaysAgo) : null,
        createdAt,
        updatedAt: seed.resolvedDaysAgo
          ? daysAgo(seed.resolvedDaysAgo)
          : seed.createdDaysAgo > 1
          ? daysAgo(Math.floor(seed.createdDaysAgo / 2))
          : createdAt,
      },
    });

    createdComplaints.push({ id: complaint.id, seq: seed.seq, status: seed.status, citizenId: citizen.id });
  }

  // ── Status Histories ──────────────────────────────────────
  console.log("→ Seeding status histories...");

  // Build status histories for each complaint based on their current status
  type HistoryStep = { from: ComplaintStatus | null; to: ComplaintStatus; actorId: string; daysAgo: number; reason?: string };

  const statusFlows: Record<ComplaintStatus, (officerId: string | undefined, managerId: string, citizenId: string, baseDays: number) => HistoryStep[]> = {
    SUBMITTED: (_, __, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
    ],
    UNDER_REVIEW: (_, managerId, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
      { from: "SUBMITTED", to: "UNDER_REVIEW", actorId: managerId, daysAgo: b - 1 },
    ],
    ASSIGNED: (officerId, managerId, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
      { from: "SUBMITTED", to: "UNDER_REVIEW", actorId: managerId, daysAgo: b - 1 },
      { from: "UNDER_REVIEW", to: "ASSIGNED", actorId: managerId, daysAgo: b - 2 },
    ],
    IN_PROGRESS: (officerId, managerId, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
      { from: "SUBMITTED", to: "UNDER_REVIEW", actorId: managerId, daysAgo: b - 1 },
      { from: "UNDER_REVIEW", to: "ASSIGNED", actorId: managerId, daysAgo: b - 2 },
      { from: "ASSIGNED", to: "IN_PROGRESS", actorId: officerId ?? managerId, daysAgo: b - 3 },
    ],
    RESOLVED: (officerId, managerId, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
      { from: "SUBMITTED", to: "UNDER_REVIEW", actorId: managerId, daysAgo: b - 2 },
      { from: "UNDER_REVIEW", to: "ASSIGNED", actorId: managerId, daysAgo: b - 4 },
      { from: "ASSIGNED", to: "IN_PROGRESS", actorId: officerId ?? managerId, daysAgo: b - 6 },
      { from: "IN_PROGRESS", to: "RESOLVED", actorId: officerId ?? managerId, daysAgo: Math.max(1, b - 10) },
    ],
    CLOSED: (officerId, managerId, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
      { from: "SUBMITTED", to: "UNDER_REVIEW", actorId: managerId, daysAgo: b - 2 },
      { from: "UNDER_REVIEW", to: "ASSIGNED", actorId: managerId, daysAgo: b - 4 },
      { from: "ASSIGNED", to: "IN_PROGRESS", actorId: officerId ?? managerId, daysAgo: b - 6 },
      { from: "IN_PROGRESS", to: "RESOLVED", actorId: officerId ?? managerId, daysAgo: Math.max(3, b - 10) },
      { from: "RESOLVED", to: "CLOSED", actorId: citizenId, daysAgo: Math.max(1, b - 15) },
    ],
    REJECTED: (_, managerId, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
      { from: "SUBMITTED", to: "UNDER_REVIEW", actorId: managerId, daysAgo: b - 1 },
      { from: "UNDER_REVIEW", to: "REJECTED", actorId: managerId, daysAgo: b - 3, reason: "Complaint falls outside our department's jurisdiction. Please contact the relevant authority." },
    ],
    REOPENED: (_, managerId, citizenId, b) => [
      { from: null, to: "SUBMITTED", actorId: citizenId, daysAgo: b },
      { from: "SUBMITTED", to: "UNDER_REVIEW", actorId: managerId, daysAgo: b - 1 },
    ],
  };

  for (let i = 0; i < complaintSeeds.length; i++) {
    const seed = complaintSeeds[i];
    const complaint = createdComplaints[i];
    const citizen = citizens[seed.citizenIndex];
    const officerId = seed.officerEmail ? officers[seed.officerEmail]?.id : undefined;

    // Pick a manager for this department
    const deptManagerMap: Record<string, string> = {
      PWK: mgr1.id,
      WAS: mgr2.id,
      TRF: mgr3.id,
      MUN: admin.id,
      PHC: admin.id,
      PAR: admin.id,
      EDU: admin.id,
    };
    const managerId = deptManagerMap[seed.deptCode] ?? admin.id;

    const flow = statusFlows[seed.status];
    if (flow) {
      const steps = flow(officerId, managerId, citizen.id, seed.createdDaysAgo);
      for (const step of steps) {
        await prisma.complaintStatusHistory.create({
          data: {
            complaintId: complaint.id,
            fromStatus: step.from ?? undefined,
            toStatus: step.to,
            changedById: step.actorId,
            reason: step.reason,
            createdAt: daysAgo(step.daysAgo),
          },
        });
      }
    }
  }

  // ── Comments ──────────────────────────────────────────────
  console.log("→ Seeding comments...");

  // Add comments to first 10 complaints
  const commentSeeds = [
    // Complaint 1 (IN_PROGRESS - pothole)
    { complaintIdx: 0, authorRole: "citizen", content: "This pothole has already damaged my car's tyre. When will this be fixed?", type: "PUBLIC_COMMENT" as const, daysAgo: 10 },
    { complaintIdx: 0, authorRole: "officer", content: "Site inspection completed. Road repair crew scheduled for next Tuesday.", type: "PUBLIC_COMMENT" as const, daysAgo: 8 },
    { complaintIdx: 0, authorRole: "officer", content: "Materials requisition submitted. Waiting for delivery from depot.", type: "INTERNAL_NOTE" as const, daysAgo: 6 },
    // Complaint 3 (RESOLVED - water pipe)
    { complaintIdx: 2, authorRole: "officer", content: "Emergency repair team dispatched. Pipe has been isolated. Repairs underway.", type: "PUBLIC_COMMENT" as const, daysAgo: 18 },
    { complaintIdx: 2, authorRole: "citizen", content: "Thank you for the quick response. When will water supply be restored?", type: "PUBLIC_COMMENT" as const, daysAgo: 17 },
    { complaintIdx: 2, authorRole: "officer", content: "Repair complete. Water supply restored to all affected properties.", type: "PUBLIC_COMMENT" as const, daysAgo: 15 },
    // Complaint 5 (IN_PROGRESS - traffic signals)
    { complaintIdx: 4, authorRole: "officer", content: "Signal fault diagnosed. Controller unit requires replacement. Part ordered.", type: "PUBLIC_COMMENT" as const, daysAgo: 2 },
    { complaintIdx: 4, authorRole: "officer", content: "Manual traffic management deployed at intersection pending repair.", type: "INTERNAL_NOTE" as const, daysAgo: 2 },
    // Complaint 10 (IN_PROGRESS - exposed wiring)
    { complaintIdx: 9, authorRole: "officer", content: "Urgent: Cordon placed around affected area. Electrical contractor en route.", type: "PUBLIC_COMMENT" as const, daysAgo: 0 },
    { complaintIdx: 9, authorRole: "officer", content: "School has been informed and is managing student movement near the hazard.", type: "INTERNAL_NOTE" as const, daysAgo: 0 },
    // Complaint 15 (IN_PROGRESS - bridge)
    { complaintIdx: 14, authorRole: "officer", content: "Section of bridge cordoned off. Structural assessment team booked for tomorrow.", type: "PUBLIC_COMMENT" as const, daysAgo: 3 },
    { complaintIdx: 14, authorRole: "citizen", content: "There are still people climbing over the cordon! Needs better barriers.", type: "PUBLIC_COMMENT" as const, daysAgo: 2 },
  ];

  for (const cs of commentSeeds) {
    const complaint = createdComplaints[cs.complaintIdx];
    const seed = complaintSeeds[cs.complaintIdx];
    const citizen = citizens[seed.citizenIndex];
    const officerId = seed.officerEmail ? officers[seed.officerEmail]?.id : admin.id;

    await prisma.complaintComment.create({
      data: {
        complaintId: complaint.id,
        authorId: cs.authorRole === "citizen" ? citizen.id : officerId!,
        content: cs.content,
        type: cs.type,
        createdAt: daysAgo(cs.daysAgo),
        updatedAt: daysAgo(cs.daysAgo),
      },
    });
  }

  // ── Ratings ───────────────────────────────────────────────
  console.log("→ Seeding ratings...");

  const closedComplaints = createdComplaints.filter((c, i) => complaintSeeds[i].status === "CLOSED");
  const ratingData = [
    { stars: 5, feedback: "Excellent service! The team responded quickly and resolved the issue thoroughly." },
    { stars: 4, feedback: "Good response. Issue was resolved though it took a bit longer than expected." },
    { stars: 3, feedback: "The problem was fixed but communication could have been better throughout the process." },
  ];

  for (let i = 0; i < Math.min(closedComplaints.length, ratingData.length); i++) {
    const complaint = closedComplaints[i];
    const seedIdx = createdComplaints.indexOf(complaint);
    const seed = complaintSeeds[seedIdx];
    const citizen = citizens[seed.citizenIndex];

    await prisma.rating.create({
      data: {
        complaintId: complaint.id,
        citizenId: citizen.id,
        stars: ratingData[i].stars,
        feedback: ratingData[i].feedback,
        createdAt: seed.closedDaysAgo ? daysAgo(seed.closedDaysAgo - 1) : new Date(),
      },
    });
  }

  // ── Notifications ─────────────────────────────────────────
  console.log("→ Seeding notifications...");

  // Notifications for citizens
  const notifData = [
    { userIdx: 0, type: "STATUS_UPDATED" as const, title: "Complaint Update", message: "Your complaint CMP-2026-000001 has been assigned to an officer.", complaintIdx: 0, isRead: true },
    { userIdx: 0, type: "COMPLAINT_ASSIGNED" as const, title: "Officer Assigned", message: "An officer has been assigned to your complaint CMP-2026-000011.", complaintIdx: 10, isRead: false },
    { userIdx: 1, type: "STATUS_UPDATED" as const, title: "Complaint Under Review", message: "Your complaint CMP-2026-000002 is now under review by the department.", complaintIdx: 1, isRead: true },
    { userIdx: 2, type: "COMPLAINT_RESOLVED" as const, title: "Complaint Resolved", message: "Your complaint CMP-2026-000003 has been marked as resolved. Please review and confirm.", complaintIdx: 2, isRead: false },
    { userIdx: 3, type: "COMPLAINT_CLOSED" as const, title: "Complaint Closed", message: "Your complaint CMP-2026-000004 has been closed. Thank you for using CivicResolve.", complaintIdx: 3, isRead: true },
    { userIdx: 4, type: "STATUS_UPDATED" as const, title: "Complaint Update", message: "Your complaint CMP-2026-000005 is now in progress.", complaintIdx: 4, isRead: false },
    // SLA warnings for staff
  ];

  for (const n of notifData) {
    const complaint = createdComplaints[n.complaintIdx];
    const citizen = citizens[n.userIdx];
    await prisma.notification.create({
      data: {
        userId: citizen.id,
        type: n.type,
        title: n.title,
        message: n.message,
        complaintId: complaint.id,
        isRead: n.isRead,
        createdAt: daysAgo(1),
      },
    });
  }

  // SLA breach notification for a manager
  const criticalComplaint = createdComplaints[4]; // Traffic signals - CRITICAL
  await prisma.notification.create({
    data: {
      userId: mgr3.id,
      type: "SLA_BREACHED",
      title: "SLA Breach Alert",
      message: "Complaint CMP-2026-000005 has breached its SLA deadline. Immediate action required.",
      complaintId: criticalComplaint.id,
      isRead: false,
      createdAt: hoursAgo(6),
    },
  });

  // ── Audit Logs ─────────────────────────────────────────────
  console.log("→ Seeding audit logs...");

  await prisma.auditLog.createMany({
    data: [
      { actorId: admin.id, action: "USER_CREATED", entity: "User", entityId: mgr1.id, metadata: { role: "DEPARTMENT_MANAGER", email: "manager.works@civicresolve.gov" }, createdAt: daysAgo(60) },
      { actorId: admin.id, action: "USER_CREATED", entity: "User", entityId: mgr2.id, metadata: { role: "DEPARTMENT_MANAGER", email: "manager.water@civicresolve.gov" }, createdAt: daysAgo(60) },
      { actorId: admin.id, action: "USER_CREATED", entity: "User", entityId: mgr3.id, metadata: { role: "DEPARTMENT_MANAGER", email: "manager.traffic@civicresolve.gov" }, createdAt: daysAgo(60) },
      { actorId: admin.id, action: "DEPARTMENT_CREATED", entity: "Department", entityId: departments["PWK"].id, metadata: { name: "Public Works", code: "PWK" }, createdAt: daysAgo(60) },
      { actorId: admin.id, action: "SLA_RULE_UPDATED", entity: "SLARule", metadata: { priority: "HIGH", resolutionHours: 48 }, createdAt: daysAgo(30) },
      { actorId: citizens[0].id, action: "COMPLAINT_SUBMITTED", entity: "Complaint", entityId: createdComplaints[0].id, metadata: { complaintNumber: "CMP-2026-000001", priority: "HIGH" }, createdAt: daysAgo(12) },
      { actorId: mgr1.id, action: "COMPLAINT_ASSIGNED", entity: "Complaint", entityId: createdComplaints[0].id, metadata: { officerEmail: "officer.kwame@civicresolve.gov" }, createdAt: daysAgo(10) },
      { actorId: citizens[2].id, action: "COMPLAINT_SUBMITTED", entity: "Complaint", entityId: createdComplaints[2].id, metadata: { complaintNumber: "CMP-2026-000003", priority: "CRITICAL" }, createdAt: daysAgo(20) },
      { actorId: officers["officer.samuel@civicresolve.gov"].id, action: "COMPLAINT_RESOLVED", entity: "Complaint", entityId: createdComplaints[2].id, metadata: { complaintNumber: "CMP-2026-000003" }, createdAt: daysAgo(15) },
      { actorId: citizens[3].id, action: "COMPLAINT_CLOSED", entity: "Complaint", entityId: createdComplaints[3].id, metadata: { complaintNumber: "CMP-2026-000004", rating: 4 }, createdAt: daysAgo(20) },
    ],
  });

  // ─────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("Demo accounts (see README for credentials):");
  console.log("  Admin:    admin@civicresolve.gov");
  console.log("  Manager:  manager.works@civicresolve.gov");
  console.log("  Officer:  officer.kwame@civicresolve.gov");
  console.log("  Citizen:  citizen.alice@example.com\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
