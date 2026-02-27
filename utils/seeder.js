require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const User = require('../models/User');

// Product images mapped by name (emoji codes used as image placeholders for now)
// In production, replace image field with actual uploaded image URLs
const products = [
  // ── MEAT & FISH ──────────────────────────────────────────────────────
  { name: 'Dhoopudu Mutton 500g', description: 'Fresh cleaned dhoopudu mutton, tender cuts — 500g pack', price: 550, originalPrice: 600, category: 'meat-fish', unit: '500g', featured: true, tags: ['mutton', 'meat', 'fresh', 'dhoopudu'], image: '' },
  { name: 'Dhoopudu Mutton 1kg', description: 'Fresh cleaned dhoopudu mutton, tender cuts — 1kg pack', price: 1050, originalPrice: 1100, category: 'meat-fish', unit: '1kg', tags: ['mutton', 'meat', 'fresh', 'dhoopudu'], image: '' },
  { name: 'Fresh Dam Fish 1kg', description: 'Fresh catch from local dams, cleaned & ready to cook — 1kg', price: 250, category: 'meat-fish', unit: '1kg', featured: true, tags: ['fish', 'dam fish', 'seafood', 'fresh'], image: '' },
  { name: 'Kadaknath Chicken 1kg', description: 'Premium black Kadaknath desi chicken — rich in protein & minerals', price: 680, originalPrice: 750, category: 'meat-fish', unit: '1kg', featured: true, tags: ['chicken', 'kadaknath', 'premium', 'desi'], image: '' },
  { name: 'Mekapothu Mamsam 500g', description: 'Tender and juicy desi goat meat — 500g pack', price: 550, category: 'meat-fish', unit: '500g', tags: ['goat', 'mutton', 'mekapothu', 'meat'], image: '' },
  { name: 'Mekapothu Mamsam 1kg', description: 'Tender and juicy desi goat meat — 1kg pack', price: 1050, category: 'meat-fish', unit: '1kg', tags: ['goat', 'mutton', 'mekapothu', 'meat'], image: '' },

  // ── VEGETABLES ───────────────────────────────────────────────────────
  { name: 'Carrot 500g', description: 'Crunchy farm-fresh carrots, great for salads & cooking', price: 40, category: 'vegetables', unit: '500g', tags: ['carrot', 'vegetable', 'fresh'], image: '' },
  { name: 'Carrot 1kg', description: 'Crunchy farm-fresh carrots, great for salads & cooking', price: 60, category: 'vegetables', unit: '1kg', tags: ['carrot', 'vegetable'], image: '' },
  { name: 'Brinjal Black 500g', description: 'Fresh black brinjal (eggplant), great for curries', price: 30, category: 'vegetables', unit: '500g', tags: ['brinjal', 'eggplant', 'vegetable'], image: '' },
  { name: 'Brinjal Black 1kg', description: 'Fresh black brinjal (eggplant), great for curries', price: 60, category: 'vegetables', unit: '1kg', tags: ['brinjal', 'eggplant'], image: '' },
  { name: 'Tomato 1kg', description: 'Ripe, firm red tomatoes straight from the farm', price: 60, category: 'vegetables', unit: '1kg', featured: true, tags: ['tomato', 'vegetable'], image: '' },
  { name: 'Green Lemon (3 pcs)', description: 'Juicy fresh green lemons, pack of 3', price: 20, category: 'vegetables', unit: '3 pcs', tags: ['lemon', 'citrus', 'lime'], image: '' },
  { name: 'Lady Finger 500g', description: 'Tender fresh okra / bhindi, great for fry & curry', price: 35, category: 'vegetables', unit: '500g', tags: ['ladyfinger', 'bhindi', 'okra'], image: '' },
  { name: 'Lady Finger 1kg', description: 'Tender fresh okra / bhindi, great for fry & curry', price: 60, category: 'vegetables', unit: '1kg', tags: ['ladyfinger', 'bhindi', 'okra'], image: '' },
  { name: 'Beetroot 500g', description: 'Fresh red beetroot, rich in iron & nutrients', price: 40, category: 'vegetables', unit: '500g', tags: ['beetroot', 'vegetable', 'iron'], image: '' },
  { name: 'Beetroot 1kg', description: 'Fresh red beetroot, rich in iron & nutrients', price: 60, category: 'vegetables', unit: '1kg', tags: ['beetroot', 'vegetable'], image: '' },
  { name: 'Onion 1kg', description: 'Farm-fresh quality onions for everyday cooking', price: 60, category: 'vegetables', unit: '1kg', tags: ['onion', 'vegetable', 'pyaaz'], image: '' },
  { name: 'Ginger', description: 'Fresh aromatic ginger root — 100g pack', price: 40, category: 'vegetables', unit: '100g', tags: ['ginger', 'adrak', 'spice'], image: '' },
  { name: 'Coriander (1 Bunch)', description: 'Fresh fragrant coriander / dhania leaves — 1 bunch', price: 20, category: 'vegetables', unit: '1 bunch', tags: ['coriander', 'dhania', 'herbs'], image: '' },
  { name: 'Capsicum 500g', description: 'Fresh green capsicum / shimla mirch', price: 60, category: 'vegetables', unit: '500g', tags: ['capsicum', 'shimla mirch', 'pepper'], image: '' },
  { name: 'Cabbage', description: 'Fresh tender cabbage head — good for salads & sabzi', price: 40, category: 'vegetables', unit: '1 pc', tags: ['cabbage', 'patta gobhi', 'vegetable'], image: '' },
  { name: 'Sweet Corn', description: 'Sweet juicy corn cob — 1 piece', price: 15, category: 'vegetables', unit: '1 pc', tags: ['corn', 'sweet corn', 'makai'], image: '' },
  { name: 'Amla 500g', description: 'Fresh Indian gooseberry — rich in Vitamin C, great immunity booster', price: 60, category: 'vegetables', unit: '500g', tags: ['amla', 'gooseberry', 'immunity'], image: '' },
  { name: 'Amla 1kg', description: 'Fresh Indian gooseberry — rich in Vitamin C, great immunity booster', price: 120, category: 'vegetables', unit: '1kg', tags: ['amla', 'gooseberry'], image: '' },

  // ── DAIRY & EGGS ─────────────────────────────────────────────────────
  { name: 'Desi Chicken Eggs (30 pcs)', description: 'Farm-raised free-range desi eggs — pack of 30. Naturally nutritious!', price: 660, category: 'dairy-eggs', unit: '30 pcs', featured: true, tags: ['eggs', 'desi', 'chicken', 'protein'], image: '' },
  { name: 'Cow Milk 1L', description: 'Pure fresh A2 cow milk from our own farm — delivered daily', price: 70, category: 'dairy-eggs', unit: '1L', featured: true, tags: ['milk', 'cow', 'a2', 'dairy'], image: '' },
  { name: 'Buffalo Milk 1L', description: 'Pure fresh buffalo milk — rich, creamy & full of calcium', price: 90, category: 'dairy-eggs', unit: '1L', tags: ['milk', 'buffalo', 'dairy', 'rich'], image: '' },

  // ── OILS & GHEE ──────────────────────────────────────────────────────
  { name: 'A2 Cow Ghee 1L', description: 'Pure handmade A2 Gir cow ghee — traditional bilona method. Zero adulteration!', price: 1200, originalPrice: 1400, category: 'oils-ghee', unit: '1L', featured: true, tags: ['ghee', 'cow', 'organic', 'a2', 'bilona'], image: '' },
  { name: 'Sesame Oil 1L', description: 'Cold-pressed pure sesame (gingelly) oil — great for cooking & health', price: 520, category: 'oils-ghee', unit: '1L', tags: ['sesame', 'gingelly', 'oil', 'cold pressed'], image: '' },
  { name: 'Groundnut Oil 1L', description: 'Pure cold-pressed peanut oil — traditional taste for Indian cooking', price: 399, category: 'oils-ghee', unit: '1L', tags: ['groundnut', 'peanut', 'oil', 'cold pressed'], image: '' },
  { name: 'Coconut Oil 1L', description: 'Pure cold-pressed virgin coconut oil — natural & unrefined', price: 440, category: 'oils-ghee', unit: '1L', tags: ['coconut', 'oil', 'virgin', 'cold pressed'], image: '' },
  { name: 'Pure Honey 500g', description: 'Raw unprocessed pure forest honey — direct from beehive', price: 375, originalPrice: 420, category: 'oils-ghee', unit: '500g', featured: true, tags: ['honey', 'pure', 'natural', 'forest'], image: '' },
  { name: 'Natural Honey 1L', description: 'Natural wildflower honey — 1 litre jar for family use', price: 515, category: 'oils-ghee', unit: '1L', tags: ['honey', 'natural', 'wildflower'], image: '' },

  // ── MILLETS & GROCERIES ──────────────────────────────────────────────
  { name: 'Ragi Flour 500g', description: 'Stone-ground finger millet (ragi) flour — great for roti & porridge', price: 90, category: 'millets-groceries', unit: '500g', tags: ['ragi', 'millet', 'flour', 'healthy'], image: '' },
  { name: 'Multi Millet Dosa Mix', description: 'Ready-to-cook healthy multi-millet dosa mix — just add water!', price: 185, category: 'millets-groceries', unit: '500g', featured: true, tags: ['dosa', 'millet', 'mix', 'healthy'], image: '' },
  { name: 'Jowar Flour 500g', description: 'Stone-ground sorghum (jowar) flour — gluten-free & nutritious', price: 90, category: 'millets-groceries', unit: '500g', tags: ['jowar', 'sorghum', 'flour', 'gluten free'], image: '' },
  { name: 'Brown Sugar 1kg', description: 'Unrefined natural brown cane sugar — less processed & healthier', price: 175, category: 'millets-groceries', unit: '1kg', tags: ['sugar', 'brown', 'natural', 'cane'], image: '' },
  { name: 'Organic Rock Salt 1kg', description: 'Pure Himalayan pink rock salt — natural minerals, no chemicals', price: 120, category: 'millets-groceries', unit: '1kg', tags: ['salt', 'rock salt', 'himalayan', 'organic'], image: '' },

  // ── MASALAS ──────────────────────────────────────────────────────────
  { name: 'Natural Mutton Masala', description: 'Authentic hand-ground spice blend for perfect mutton curry', price: 99, category: 'masalas', unit: '100g', featured: true, tags: ['masala', 'mutton', 'spice', 'natural'], image: '' },
  { name: 'Natural Chicken Masala', description: 'Aromatic hand-ground spice blend for delicious chicken dishes', price: 99, category: 'masalas', unit: '100g', tags: ['masala', 'chicken', 'spice', 'natural'], image: '' },

  // ── DRY FRUITS ───────────────────────────────────────────────────────
  { name: 'Almond 500g', description: 'Premium California almonds — great for brain health & immunity', price: 475, category: 'dry-fruits', unit: '500g', featured: true, tags: ['almond', 'badam', 'nuts', 'dry fruit'], image: '' },
  { name: 'Jumbo Almond 500g', description: 'Extra-large premium California almonds — finest quality', price: 545, category: 'dry-fruits', unit: '500g', tags: ['almond', 'jumbo', 'premium', 'badam'], image: '' },
  { name: 'Cashew Split 500g', description: 'Premium split cashews (kaju) — perfect for cooking & snacking', price: 475, category: 'dry-fruits', unit: '500g', tags: ['cashew', 'kaju', 'nuts'], image: '' },
  { name: 'Pistachio Plain 500g', description: 'Premium unsalted pistachios (pista) — heart-healthy snack', price: 625, category: 'dry-fruits', unit: '500g', tags: ['pistachio', 'pista', 'nuts'], image: '' },
  { name: 'Walnuts 500g', description: 'Premium California walnuts — rich in Omega-3, great for brain', price: 950, originalPrice: 1000, category: 'dry-fruits', unit: '500g', tags: ['walnut', 'akhrot', 'nuts', 'omega3'], image: '' },
  { name: 'Dry Grapes 500g', description: 'Sweet seedless raisins (kishmish) — natural energy booster', price: 390, category: 'dry-fruits', unit: '500g', tags: ['raisins', 'kishmish', 'dry grapes'], image: '' },
  { name: 'Anjeer 500g', description: 'Dried premium figs (anjeer) — rich in fibre & iron', price: 800, category: 'dry-fruits', unit: '500g', tags: ['anjeer', 'fig', 'dry fruit', 'fibre'], image: '' },
  { name: 'Dry Mango 500g', description: 'Sweet-tangy dried mango slices — aam papad style', price: 450, category: 'dry-fruits', unit: '500g', tags: ['mango', 'aam', 'dried', 'sweet'], image: '' },
  { name: 'Dry Kiwi 500g', description: 'Sweet dried kiwi fruit slices — exotic & nutritious', price: 300, category: 'dry-fruits', unit: '500g', tags: ['kiwi', 'dried fruit', 'exotic'], image: '' },

  // ── CHOCOLATES ───────────────────────────────────────────────────────
  { name: 'Schmitten Milk Chocolate', description: 'Creamy Swiss-style milk chocolate bar — smooth & delicious', price: 100, category: 'chocolates', unit: '1 bar', tags: ['chocolate', 'milk', 'schmitten', 'sweet'], image: '' },
  { name: 'Schmitten Dark Chocolate', description: 'Rich dark chocolate bar — perfect for chocolate lovers', price: 100, category: 'chocolates', unit: '1 bar', tags: ['chocolate', 'dark', 'schmitten'], image: '' },
  { name: 'Schmitten Luxury Dark', description: 'Premium 70% cocoa luxury dark chocolate — intense & refined taste', price: 250, originalPrice: 300, category: 'chocolates', unit: '1 bar', featured: true, tags: ['chocolate', 'luxury', 'dark', '70% cocoa', 'premium'], image: '' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas connected!');

    await Product.deleteMany({});
    await User.deleteMany({ role: 'admin' });

    await Product.insertMany(products);
    console.log(`✅ ${products.length} products seeded!`);

    // Create admin user with PIN
    const hashedPin = await bcrypt.hash(process.env.ADMIN_PIN || '1234', 12);
    await User.create({
      name: process.env.ADMIN_NAME || 'Desi2Door Admin',
      phone: process.env.ADMIN_PHONE || '9849854853',
      pin: hashedPin,
      role: 'admin'
    });
    console.log('✅ Admin created!');
    console.log(`   Phone: ${process.env.ADMIN_PHONE || '9849854853'}`);
    console.log(`   PIN: ${process.env.ADMIN_PIN || '1234'}`);

    mongoose.disconnect();
    console.log('\n🎉 Seeding complete! Start server and visit /admin to manage.');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedDB();
