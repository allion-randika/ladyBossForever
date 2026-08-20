import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'dresses', label: 'Dresses' },
  { slug: 'tops', label: 'Tops' },
  { slug: 'denim', label: 'Denim' },
  { slug: 'trousers', label: 'Trousers' },
  { slug: 'skirts', label: 'Skirts' },
  { slug: 'jewelry', label: 'Jewelry' },
  { slug: 'footwear', label: 'Footwear' },
  { slug: 'bags', label: 'Bags' },
  { slug: 'hair-accessories', label: 'Hair' },
];

const SIZES_APPAREL = ['XS', 'S', 'M', 'L', 'XL'];
const SIZES_ONE = ['One Size'];
const SIZES_SHOE = ['36', '37', '38', '39', '40'];

const COLORS = {
  blush: { name: 'Blush', hex: '#d9a9b4' },
  plum: { name: 'Plum', hex: '#4a1942' },
  black: { name: 'Black', hex: '#1c1418' },
  ivory: { name: 'Ivory', hex: '#f1e8e2' },
  olive: { name: 'Olive', hex: '#7c7a52' },
  rust: { name: 'Rust', hex: '#a85a3a' },
  denimBlue: { name: 'Indigo', hex: '#3c4d68' },
  sand: { name: 'Sand', hex: '#c9a97c' },
  gold: { name: 'Gold', hex: '#a3803f' },
  wine: { name: 'Wine', hex: '#6d2340' },
};

interface SeedProduct {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  colors: { name: string; hex: string }[];
  sizes: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  isOnSale?: boolean;
  description: string;
  details: string[];
}

const PRODUCTS: SeedProduct[] = [
  { slug: 'eleanor-wrap-midi-dress', name: 'Eleanor Wrap Midi Dress', category: 'dresses', price: 6490, compareAtPrice: 8200, colors: [COLORS.plum, COLORS.rust, COLORS.black], sizes: SIZES_APPAREL, isBestseller: true, isOnSale: true, description: 'A wrap-front midi with a soft drape and a self-tie waist, cut to move with you from desk to dinner.', details: ['Viscose blend', 'Self-tie waist', 'Hand wash cold', "Model is 5'6\", wearing S"] },
  { slug: 'noor-satin-slip-dress', name: 'Noor Satin Slip Dress', category: 'dresses', price: 5990, colors: [COLORS.ivory, COLORS.wine], sizes: SIZES_APPAREL, isNew: true, description: 'Bias-cut satin slip with adjustable straps — the one dress that does every occasion.', details: ['Satin-finish polyester', 'Adjustable straps', 'Lined', 'Dry clean recommended'] },
  { slug: 'cropped-rib-tee', name: 'Cropped Rib Tee', category: 'tops', price: 1890, colors: [COLORS.black, COLORS.ivory, COLORS.blush], sizes: SIZES_APPAREL, isBestseller: true, description: 'Fitted ribbed crop tee in a heavyweight cotton that holds its shape wash after wash.', details: ['95% cotton, 5% elastane', 'Cropped fit', 'Machine wash'] },
  { slug: 'oversized-poplin-shirt', name: 'Oversized Poplin Shirt', category: 'tops', price: 3290, colors: [COLORS.ivory, COLORS.denimBlue], sizes: SIZES_APPAREL, isNew: true, description: 'A relaxed poplin shirt built for layering, with dropped shoulders and a curved hem.', details: ['100% cotton poplin', 'Dropped shoulder', 'Curved hem'] },
  { slug: 'amara-silk-blouse', name: 'Amara Silk-Feel Blouse', category: 'tops', price: 3690, compareAtPrice: 4400, colors: [COLORS.blush, COLORS.black], sizes: SIZES_APPAREL, isOnSale: true, description: 'Fluid silk-feel blouse with a tie neck — dresses up denim, dresses down a blazer.', details: ['Silk-feel polyester', 'Tie neckline', 'Dry clean'] },
  { slug: 'straight-leg-jeans', name: 'Straight Leg Jeans', category: 'denim', price: 5490, colors: [COLORS.denimBlue, COLORS.black], sizes: SIZES_APPAREL, isBestseller: true, description: 'Mid-rise straight leg in a rigid denim that softens with wear, not stretch.', details: ['98% cotton, 2% elastane', 'Mid-rise', 'Five-pocket styling'] },
  { slug: 'wide-leg-cargo-jeans', name: 'Wide Leg Cargo Jeans', category: 'denim', price: 6290, colors: [COLORS.olive, COLORS.denimBlue], sizes: SIZES_APPAREL, isNew: true, description: 'Utility-pocket wide leg jeans with a relaxed drop from the hip.', details: ['100% cotton', 'Cargo pockets', 'Relaxed wide leg'] },
  { slug: 'tailored-office-trouser', name: 'Tailored Office Trouser', category: 'trousers', price: 4290, colors: [COLORS.black, COLORS.sand], sizes: SIZES_APPAREL, isBestseller: true, description: 'A crisp, tapered trouser cut for the boardroom with just enough stretch for the commute.', details: ['Poly-viscose blend', 'Tapered leg', 'Side zip'] },
  { slug: 'linen-blend-trouser', name: 'Linen-Blend Wide Trouser', category: 'trousers', price: 3990, colors: [COLORS.ivory, COLORS.rust], sizes: SIZES_APPAREL, description: 'Breathable linen-blend trouser with a fluid wide leg for warm-weather ease.', details: ['55% linen, 45% viscose', 'Elasticated back waist', 'Wide leg'] },
  { slug: 'pleated-midi-skirt', name: 'Pleated Midi Skirt', category: 'skirts', price: 3490, colors: [COLORS.plum, COLORS.black], sizes: SIZES_APPAREL, isBestseller: true, description: 'Knife-pleated midi that catches movement on the way to work and back out again.', details: ['Poly crepe', 'Elasticated waist', 'Fully lined'] },
  { slug: 'denim-mini-skirt', name: 'Denim Mini Skirt', category: 'skirts', price: 2890, colors: [COLORS.denimBlue], sizes: SIZES_APPAREL, isNew: true, description: 'A-line denim mini with a button-front and just enough structure to hold its shape.', details: ['100% cotton denim', 'Button front', 'A-line'] },
  { slug: 'layered-gold-necklace', name: 'Layered Gold-Tone Necklace', category: 'jewelry', price: 1690, colors: [COLORS.gold], sizes: SIZES_ONE, isBestseller: true, description: 'Three-layer chain necklace in a warm gold tone, styled to wear alone or stacked.', details: ['Gold-tone brass', 'Adjustable clasp', 'Tarnish-resistant coating'] },
  { slug: 'pearl-drop-earrings', name: 'Pearl Drop Earrings', category: 'jewelry', price: 1290, compareAtPrice: 1600, colors: [COLORS.ivory], sizes: SIZES_ONE, isOnSale: true, description: 'Freshwater-pearl drops on a gold-tone hook, light enough for all-day wear.', details: ['Freshwater pearl', 'Gold-tone hook', 'Nickel-free'] },
  { slug: 'stacking-bangle-set', name: 'Stacking Bangle Set of 5', category: 'jewelry', price: 990, colors: [COLORS.gold, COLORS.black], sizes: SIZES_ONE, description: 'Five slim bangles in mixed finishes, meant to be worn together or split across both wrists.', details: ['Alloy, mixed finish', 'Set of 5', 'One size'] },
  { slug: 'block-heel-sandal', name: 'Block Heel Sandal', category: 'footwear', price: 5490, colors: [COLORS.black, COLORS.sand], sizes: SIZES_SHOE, isBestseller: true, description: 'A 6cm block heel with an ankle strap built for standing all night, not just looking good in photos.', details: ['Synthetic upper', '6cm block heel', 'Cushioned footbed'] },
  { slug: 'woven-flat-mule', name: 'Woven Flat Mule', category: 'footwear', price: 4290, colors: [COLORS.sand, COLORS.rust], sizes: SIZES_SHOE, isNew: true, description: 'Hand-woven flat mule in a soft raffia-look finish, easy on and off.', details: ['Woven synthetic upper', 'Slip-on', 'Flat sole'] },
  { slug: 'structured-tote', name: 'Structured Top-Handle Tote', category: 'bags', price: 7290, colors: [COLORS.black, COLORS.wine], sizes: SIZES_ONE, isBestseller: true, description: 'A structured tote with a top handle and detachable strap, sized for a laptop and everything else.', details: ['Vegan leather', 'Detachable strap', 'Interior zip pocket'] },
  { slug: 'mini-sling-bag', name: 'Quilted Mini Sling', category: 'bags', price: 3990, compareAtPrice: 4800, colors: [COLORS.plum, COLORS.blush], sizes: SIZES_ONE, isOnSale: true, description: 'A quilted mini sling on a chain strap, just big enough for the essentials.', details: ['Quilted vegan leather', 'Chain strap', 'Magnetic closure'] },
  { slug: 'satin-scrunchie-set', name: 'Satin Scrunchie Set of 3', category: 'hair-accessories', price: 590, colors: [COLORS.blush, COLORS.plum, COLORS.ivory], sizes: SIZES_ONE, isBestseller: true, description: 'Three oversized satin scrunchies, gentle on hair and worth having in every colourway.', details: ['Satin-finish polyester', 'Set of 3', 'Oversized'] },
  { slug: 'pearl-hair-clip', name: 'Pearl Claw Clip', category: 'hair-accessories', price: 490, colors: [COLORS.ivory, COLORS.black], sizes: SIZES_ONE, isNew: true, description: 'A large claw clip finished with pearl detailing, strong enough for thick hair.', details: ['Acetate + pearl accent', 'Large size', 'Strong-grip spring'] },
];

const DEFAULT_STOCK = 25;

async function main() {
  console.log('Seeding categories...');
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { label: c.label },
      create: c,
    });
    categoryBySlug.set(c.slug, category.id);
  }

  console.log('Seeding products & variants...');
  for (const p of PRODUCTS) {
    const categoryId = categoryBySlug.get(p.category);
    if (!categoryId) throw new Error(`Unknown category "${p.category}" for product "${p.slug}"`);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        details: p.details,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        categoryId,
        isNew: !!p.isNew,
        isBestseller: !!p.isBestseller,
        isOnSale: !!p.isOnSale,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        details: p.details,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        categoryId,
        isNew: !!p.isNew,
        isBestseller: !!p.isBestseller,
        isOnSale: !!p.isOnSale,
      },
    });

    for (const size of p.sizes) {
      for (const color of p.colors) {
        await prisma.productVariant.upsert({
          where: { productId_size_color: { productId: product.id, size, color: color.name } },
          update: { colorHex: color.hex },
          create: {
            productId: product.id,
            size,
            color: color.name,
            colorHex: color.hex,
            stock: DEFAULT_STOCK,
          },
        });
      }
    }
  }

  console.log('Seeding super admin...');
  const adminPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@ladybossforever.com' },
    update: {},
    create: {
      email: 'admin@ladybossforever.com',
      passwordHash: adminPasswordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Done. Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products.`);
  console.log('Admin login: admin@ladybossforever.com / ChangeMe123!  (change this before real use)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
