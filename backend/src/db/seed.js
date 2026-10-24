const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { uploadDir } = require('../middleware/upload');

const departments = [
  { name: 'Koenigsegg Hypercars', slug: 'koenigsegg-hypercars', brand: 'Koenigsegg', accent: '#c9ced4',
    tagline: 'Swedish hypercars built without compromise',
    description: 'Jesko Absolut, Gemera, Regera and more. Hand-built carbon fibre hypercars with record-breaking engineering.' },
  { name: 'BMW M Performance', slug: 'bmw-m-performance', brand: 'BMW', accent: '#0166b1',
    tagline: 'Track-bred BMW M power for the road',
    description: 'M3, M4, M5 and M8 models tuned by BMW M GmbH for pure driving feel.' },
  { name: 'BMW Luxury Sedans', slug: 'bmw-luxury-sedans', brand: 'BMW', accent: '#53a8e2',
    tagline: 'Executive comfort with sporting character',
    description: 'The 3, 5 and 7 Series. Refined interiors, advanced technology and effortless long-distance comfort.' },
  { name: 'BMW SUV and X Models', slug: 'bmw-suv-x', brand: 'BMW', accent: '#e4002b',
    tagline: 'Space, presence and all-road capability',
    description: 'From the X3 to the XM. Family-ready SUVs with real performance credentials.' },
  { name: 'BMW Electric (i)', slug: 'bmw-electric', brand: 'BMW', accent: '#2fb67c',
    tagline: 'Fully electric BMW driving pleasure',
    description: 'i4, i5, i7 and iX. Zero tailpipe emissions with rapid charging and instant torque.' },
  { name: 'BMW Classics', slug: 'bmw-classics', brand: 'BMW', accent: '#c8963e',
    tagline: 'Collectible BMW icons',
    description: 'Carefully inspected, collector-grade BMWs from the golden era of the brand.' },
];

// dept = slug, price in USD
const vehicles = [
  { dept: 'koenigsegg-hypercars', brand: 'Koenigsegg', model: 'Jesko Absolut', year: 2025, price: 3400000, mileage: 120, fuel: 'Petrol (E85)', transmission: '9-speed Light Speed Transmission', horsepower: 1600, top_speed: 531, acceleration: 2.5, color: 'Ghost White', featured: 1,
    description: 'The pursuit of the highest top speed ever. The Jesko Absolut trades downforce for a slippery 0.278 Cd body and a 5.0L twin-turbo V8 that makes 1,600 hp on E85. Hand-built in Angelholm, Sweden.', c: ['#d9dde2', '#6b7684'] },
  { dept: 'koenigsegg-hypercars', brand: 'Koenigsegg', model: 'Jesko Attack', year: 2024, price: 3100000, mileage: 340, fuel: 'Petrol (E85)', transmission: '9-speed Light Speed Transmission', horsepower: 1600, top_speed: 483, acceleration: 2.5, color: 'Carbon Black', featured: 1,
    description: 'The track-focused sibling with 1,000 kg of downforce at 250 km/h. Giant rear wing, triplex suspension and a cockpit built around the driver.', c: ['#2b3138', '#0f1317'] },
  { dept: 'koenigsegg-hypercars', brand: 'Koenigsegg', model: 'Gemera', year: 2025, price: 1950000, mileage: 60, fuel: 'Hybrid', transmission: 'Koenigsegg Direct Drive', horsepower: 1700, top_speed: 400, acceleration: 1.9, color: 'Arctic Silver', featured: 1,
    description: 'The world first Mega-GT: four seats, four electric motors and the 2.0L Tiny Friendly Giant three-cylinder engine delivering 1,700 hp.', c: ['#aab4bf', '#4d5864'] },
  { dept: 'koenigsegg-hypercars', brand: 'Koenigsegg', model: 'Regera', year: 2022, price: 2800000, mileage: 1800, fuel: 'Hybrid', transmission: 'Direct Drive (single speed)', horsepower: 1500, top_speed: 410, acceleration: 2.8, color: 'Pearl Blue', featured: 0,
    description: 'Gearbox-free hybrid hypercar with a twin-turbo V8 and three electric motors. Famous for its sequential power delivery and luxury cabin.', c: ['#4d79b0', '#1a2a46'] },
  { dept: 'koenigsegg-hypercars', brand: 'Koenigsegg', model: 'CC850', year: 2024, price: 3650000, mileage: 90, fuel: 'Petrol', transmission: '6-speed manual with 9-speed engagement', horsepower: 1385, top_speed: 440, acceleration: 2.7, color: 'Sunburst Orange', featured: 0,
    description: 'A tribute to the original CC8S with a unique Engage Shift System: a true manual gearbox and a paddle-shift automatic in one car.', c: ['#f08a2c', '#7a3207'] },
  { dept: 'bmw-m-performance', brand: 'BMW', model: 'M3 Competition xDrive', year: 2024, price: 94000, mileage: 4200, fuel: 'Petrol', transmission: '8-speed M Steptronic', horsepower: 503, top_speed: 290, acceleration: 3.4, color: 'Isle of Man Green', featured: 1,
    description: 'Twin-turbo inline-six, M xDrive with rear-biased handling and carbon-fibre roof. The benchmark sports sedan, ready for road or track days.', c: ['#2f7d5b', '#0f2f22'] },
  { dept: 'bmw-m-performance', brand: 'BMW', model: 'M4 CSL', year: 2023, price: 165000, mileage: 2100, fuel: 'Petrol', transmission: '8-speed M Steptronic', horsepower: 543, top_speed: 307, acceleration: 3.6, color: 'Brooklyn Grey', featured: 1,
    description: 'Limited production, 100 kg lighter, with laser-light headlights and a stripped-out cabin. A Nurburgring-bred special.', c: ['#8d96a0', '#2f353c'] },
  { dept: 'bmw-m-performance', brand: 'BMW', model: 'M5 Competition', year: 2023, price: 112000, mileage: 9800, fuel: 'Petrol', transmission: '8-speed M Steptronic', horsepower: 617, top_speed: 305, acceleration: 3.3, color: 'Marina Bay Blue', featured: 0,
    description: 'A 4.4L twin-turbo V8 with all-wheel drive and a rear-drive mode. Executive-class comfort with supercar pace.', c: ['#1f3f8a', '#0a1636'] },
  { dept: 'bmw-m-performance', brand: 'BMW', model: 'M8 Competition Coupe', year: 2022, price: 128000, mileage: 11000, fuel: 'Petrol', transmission: '8-speed M Steptronic', horsepower: 617, top_speed: 305, acceleration: 3.2, color: 'Frozen Black', featured: 0,
    description: 'Grand-touring muscle with M Carbon ceramic brakes and a beautifully appointed cabin. Fast, wide and unmistakable.', c: ['#3a3d42', '#101214'] },
  { dept: 'bmw-luxury-sedans', brand: 'BMW', model: '740i M Sport', year: 2024, price: 99000, mileage: 3000, fuel: 'Petrol', transmission: '8-speed Steptronic', horsepower: 375, top_speed: 250, acceleration: 5.4, color: 'Oxide Grey', featured: 0,
    description: 'Flagship luxury with a 31-inch Theatre Screen, Executive Lounge seating and a silky inline-six.', c: ['#767f86', '#2b3136'] },
  { dept: 'bmw-luxury-sedans', brand: 'BMW', model: '530i xDrive', year: 2024, price: 62000, mileage: 5200, fuel: 'Petrol', transmission: '8-speed Steptronic', horsepower: 255, top_speed: 250, acceleration: 6.2, color: 'Alpine White', featured: 0,
    description: 'The sweet-spot 5 Series with a curved display, driver assistance suite and a refined ride.', c: ['#e9ecef', '#9aa3ab'] },
  { dept: 'bmw-luxury-sedans', brand: 'BMW', model: '330i Sport Line', year: 2023, price: 46000, mileage: 14000, fuel: 'Petrol', transmission: '8-speed Steptronic', horsepower: 255, top_speed: 250, acceleration: 5.6, color: 'Portimao Blue', featured: 0,
    description: 'The compact executive sedan that defined the category. Balanced handling and everyday usability.', c: ['#2a5fb0', '#0d2447'] },
  { dept: 'bmw-suv-x', brand: 'BMW', model: 'XM Label Red', year: 2024, price: 185000, mileage: 1500, fuel: 'Plug-in Hybrid', transmission: '8-speed M Steptronic', horsepower: 738, top_speed: 290, acceleration: 3.8, color: 'Marrakesh Brown', featured: 1,
    description: 'The most powerful BMW production car of its time: a V8 plug-in hybrid with bold design and a 2+3 lounge cabin.', c: ['#7a3f2a', '#2a120b'] },
  { dept: 'bmw-suv-x', brand: 'BMW', model: 'X5 M Competition', year: 2023, price: 138000, mileage: 8700, fuel: 'Petrol', transmission: '8-speed M Steptronic', horsepower: 617, top_speed: 290, acceleration: 3.7, color: 'Carbon Black', featured: 0,
    description: 'Family SUV with a supercar heart: 4.4L twin-turbo V8, adaptive M suspension and big brakes.', c: ['#30343a', '#0c0e10'] },
  { dept: 'bmw-suv-x', brand: 'BMW', model: 'X3 M40i', year: 2024, price: 68000, mileage: 2400, fuel: 'Petrol', transmission: '8-speed Steptronic Sport', horsepower: 382, top_speed: 250, acceleration: 4.4, color: 'Phytonic Blue', featured: 0,
    description: 'Compact SUV with an inline-six, sport brakes and an M Sport differential. The right size for daily life.', c: ['#35529c', '#0e1a3b'] },
  { dept: 'bmw-electric', brand: 'BMW', model: 'i7 xDrive60', year: 2024, price: 125000, mileage: 2800, fuel: 'Electric', transmission: 'Single speed', horsepower: 536, top_speed: 240, acceleration: 4.5, color: 'Mineral White', featured: 1,
    description: 'Fully electric luxury limousine with a 101.7 kWh battery, rear-seat theatre and up to 600 km WLTP range.', c: ['#dfe3e8', '#8a949e'] },
  { dept: 'bmw-electric', brand: 'BMW', model: 'iX M60', year: 2024, price: 111000, mileage: 3300, fuel: 'Electric', transmission: 'Single speed', horsepower: 610, top_speed: 250, acceleration: 3.8, color: 'Storm Bay', featured: 0,
    description: 'M Performance electric SUV with 111.5 kWh battery, 195 kW DC fast charging and a crafted cabin.', c: ['#4a5d6c', '#16202a'] },
  { dept: 'bmw-electric', brand: 'BMW', model: 'i4 M50', year: 2023, price: 72000, mileage: 7600, fuel: 'Electric', transmission: 'Single speed', horsepower: 536, top_speed: 225, acceleration: 3.9, color: 'Frozen Portimao Blue', featured: 0,
    description: 'The sporty electric Gran Coupe. Instant torque, a low centre of gravity and daily-usable range.', c: ['#2c64c0', '#0c2650'] },
  { dept: 'bmw-classics', brand: 'BMW', model: 'E30 M3 Sport Evolution', year: 1990, price: 285000, mileage: 62000, fuel: 'Petrol', transmission: '5-speed manual', horsepower: 235, top_speed: 248, acceleration: 6.5, color: 'Nogaro Silver', featured: 1,
    description: 'The legendary homologation special with a 2.5L S14 four-cylinder. Matching-numbers example with full documentation.', c: ['#b9bfc6', '#4f565e'] },
  { dept: 'bmw-classics', brand: 'BMW', model: '3.0 CSL Batmobile', year: 1973, price: 420000, mileage: 71000, fuel: 'Petrol', transmission: '4-speed manual', horsepower: 206, top_speed: 220, acceleration: 7.0, color: 'Polaris Silver', featured: 0,
    description: 'The aero-winged icon from BMW Motorsport history. Restored to concours standard with period-correct details.', c: ['#c7ccd1', '#59616a'] },
];

function carSvg(title, caption, c1, c2, view) {
  const flip = view === 1 ? ' transform="translate(800 0) scale(-1 1)"' : '';
  const glow = view === 2 ? 0.55 : 0.3;
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b232c"/><stop offset="1" stop-color="#0c1015"/></linearGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.75" r="0.6"><stop offset="0" stop-color="${c1}" stop-opacity="${glow}"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="500" fill="url(#bg)"/>
<rect width="800" height="500" fill="url(#glow)"/>
<rect x="0" y="372" width="800" height="128" fill="#0a0d11" opacity="0.65"/>
<g${flip}>
<ellipse cx="400" cy="372" rx="300" ry="16" fill="#000" opacity="0.5"/>
<path d="M92 340 C92 318 110 306 140 300 L205 282 C238 252 285 234 350 230 L470 228 C530 230 574 252 606 284 L672 296 C706 302 716 318 716 340 L716 356 L92 356 Z" fill="url(#body)"/>
<path d="M232 284 C258 258 296 246 350 244 L456 243 C506 245 542 262 566 286 Z" fill="#0b1218" opacity="0.88"/>
<path d="M92 340 L716 340" stroke="#000" stroke-opacity="0.25" stroke-width="2"/>
<rect x="676" y="316" width="30" height="8" rx="4" fill="#fff" opacity="0.85"/>
<rect x="98" y="314" width="26" height="8" rx="4" fill="#e4002b" opacity="0.9"/>
<circle cx="214" cy="352" r="46" fill="#0b0d10"/><circle cx="214" cy="352" r="28" fill="#2a3037"/><circle cx="214" cy="352" r="9" fill="#9aa3ab"/>
<circle cx="590" cy="352" r="46" fill="#0b0d10"/><circle cx="590" cy="352" r="28" fill="#2a3037"/><circle cx="590" cy="352" r="9" fill="#9aa3ab"/>
</g>
<rect x="40" y="40" width="46" height="4" fill="#53a8e2"/><rect x="40" y="48" width="46" height="4" fill="#0166b1"/><rect x="40" y="56" width="46" height="4" fill="#e4002b"/>
<text x="40" y="440" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="34" font-weight="600" fill="#f2f5f8">${safeTitle}</text>
<text x="40" y="472" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="18" fill="#9aa7b4">${caption}</text>
</svg>`;
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@jeskobmw.com').toLowerCase();
  const rows = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) return;
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10);
  await query('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)', [
    process.env.ADMIN_NAME || 'Store Admin', email, hash, 'admin',
  ]);
  console.log(`👤 Default admin created -> ${email}`);
}

async function seedDepartments() {
  const rows = await query('SELECT COUNT(*) AS n FROM departments');
  if (rows[0].n > 0) return;
  let order = 1;
  for (const d of departments) {
    await query(
      'INSERT INTO departments (name, slug, brand, tagline, description, accent, sort_order) VALUES (?,?,?,?,?,?,?)',
      [d.name, d.slug, d.brand, d.tagline, d.description, d.accent, order++]
    );
  }
  console.log(`🏛️  Seeded ${departments.length} departments`);
}

async function seedVehicles() {
  const rows = await query('SELECT COUNT(*) AS n FROM vehicles');
  if (rows[0].n > 0) return;
  const deps = await query('SELECT id, slug FROM departments');
  const depMap = Object.fromEntries(deps.map((d) => [d.slug, d.id]));
  const views = ['Front three-quarter', 'Side profile', 'Studio view'];

  for (const v of vehicles) {
    const res = await query(
      `INSERT INTO vehicles (department_id, brand, model, year, price, mileage, fuel, transmission, horsepower, top_speed, acceleration, color, description, stock, featured)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [depMap[v.dept], v.brand, v.model, v.year, v.price, v.mileage, v.fuel, v.transmission, v.horsepower, v.top_speed, v.acceleration, v.color, v.description, 1, v.featured]
    );
    const id = res.insertId;
    for (let i = 0; i < views.length; i++) {
      const file = `seed-${id}-${i + 1}.svg`;
      fs.writeFileSync(
        path.join(uploadDir, file),
        carSvg(`${v.brand} ${v.model}`, `${v.year}  |  ${v.color}  |  ${views[i]}`, v.c[0], v.c[1], i)
      );
      await query('INSERT INTO vehicle_images (vehicle_id, image_path, is_primary) VALUES (?,?,?)', [id, `/uploads/${file}`, i === 0 ? 1 : 0]);
    }
  }
  console.log(`🚗 Seeded ${vehicles.length} demo vehicles with photos`);
}

async function seedAll() {
  await seedAdmin();
  await seedDepartments();
  await seedVehicles();
}

module.exports = { seedAll };
