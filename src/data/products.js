/* ── Product size charts ── */
export const kurthaSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const blouseSizes = ['S', 'M', 'L', 'XL']
const lehengaSizes = ['S', 'M', 'L', 'XL']

/* ── Master product catalog ──
   30 women's ethnic wear products with rich attributes for the hybrid recommender.
   Category: kurtha | saree | lehenga | dupatta | blouse
   Products with a `sizes` array require mandatory size selection at purchase.
   Products without sizes (saree, dupatta) can be added to cart directly. */
export const products = [
  {
    id: 1, name: 'Cotton Block-Print Kurtha', category: 'kurtha', price: 1899,
    fabric: 'cotton', pattern: 'block-print', neckline: 'round', sleeve: 'three-fourth',
    fit: 'straight', color: 'indigo', occasion: 'casual', region: 'jaipur',
    work: 'block-print', rating: 4.5, reviews: 128, emoji: '🪻',
    sizes: kurthaSizes,
  },
  {
    id: 2, name: 'Banarasi Silk Saree', category: 'saree', price: 8999,
    fabric: 'silk', pattern: 'embroidered', neckline: null, sleeve: null,
    fit: null, color: 'gold', occasion: 'wedding', region: 'banarasi',
    work: 'zari', rating: 4.8, reviews: 94, emoji: '✨',
    sareeLength: 5.5, blouseSize: 'M',
  },
  {
    id: 3, name: 'Chanderi Cotton Saree', category: 'saree', price: 3499,
    fabric: 'cotton', pattern: 'solid', neckline: null, sleeve: null,
    fit: null, color: 'mustard', occasion: 'office', region: 'chanderi',
    work: 'none', rating: 4.3, reviews: 76, emoji: '🌻',
    sareeLength: 5.5, blouseSize: 'S',
  },
  {
    id: 4, name: 'Georgette Flared Kurtha', category: 'kurtha', price: 2499,
    fabric: 'georgette', pattern: 'printed', neckline: 'v-neck', sleeve: 'half',
    fit: 'flared', color: 'teal', occasion: 'festive', region: 'north',
    work: 'print', rating: 4.6, reviews: 112, emoji: '🌊',
    sizes: kurthaSizes,
  },
  {
    id: 5, name: 'Silk Lehenga Set', category: 'lehenga', price: 15999,
    fabric: 'silk', pattern: 'embroidered', neckline: 'boat', sleeve: 'sleeveless',
    fit: 'flared', color: 'red', occasion: 'wedding', region: 'banarasi',
    work: 'zari', rating: 4.9, reviews: 53, emoji: '👑',
    sizes: lehengaSizes,
  },
  {
    id: 6, name: 'Linen Anarkali Kurtha', category: 'kurtha', price: 2199,
    fabric: 'linen', pattern: 'solid', neckline: 'collar', sleeve: 'full',
    fit: 'anarkali', color: 'beige', occasion: 'office', region: 'north',
    work: 'none', rating: 4.4, reviews: 89, emoji: '🌾',
    sizes: kurthaSizes,
  },
  {
    id: 7, name: 'Bandhani Dupatta', category: 'dupatta', price: 1299,
    fabric: 'chiffon', pattern: 'bandhani', neckline: null, sleeve: null,
    fit: null, color: 'pink', occasion: 'festive', region: 'gujarat',
    work: 'bandhani', rating: 4.2, reviews: 67, emoji: '🎀',
  },
  {
    id: 8, name: 'Kanchipuram Silk Saree', category: 'saree', price: 12999,
    fabric: 'silk', pattern: 'woven', neckline: null, sleeve: null,
    fit: null, color: 'green', occasion: 'wedding', region: 'kanchipuram',
    work: 'zari', rating: 4.7, reviews: 108, emoji: '💚',
    sareeLength: 6.0, blouseSize: 'L',
  },
  {
    id: 9, name: 'Cotton Straight Kurtha', category: 'kurtha', price: 1499,
    fabric: 'cotton', pattern: 'solid', neckline: 'round', sleeve: 'half',
    fit: 'straight', color: 'white', occasion: 'casual', region: 'north',
    work: 'none', rating: 4.1, reviews: 201, emoji: '🤍',
    sizes: kurthaSizes,
  },
  {
    id: 10, name: 'Embroidered Georgette Saree', category: 'saree', price: 5499,
    fabric: 'georgette', pattern: 'embroidered', neckline: null, sleeve: null,
    fit: null, color: 'purple', occasion: 'party', region: 'north',
    work: 'thread-embroidery', rating: 4.5, reviews: 84, emoji: '🔮',
    sareeLength: 5.5, blouseSize: 'M',
  },
  {
    id: 11, name: 'Velvet Lehenga', category: 'lehenga', price: 18999,
    fabric: 'velvet', pattern: 'embroidered', neckline: 'deep', sleeve: 'sleeveless',
    fit: 'flared', color: 'maroon', occasion: 'wedding', region: 'north',
    work: 'stone', rating: 4.8, reviews: 41, emoji: '🍷',
    sizes: lehengaSizes,
  },
  {
    id: 12, name: 'Cotton Kurtha Palazzo Set', category: 'kurtha', price: 2799,
    fabric: 'cotton', pattern: 'block-print', neckline: 'v-neck', sleeve: 'three-fourth',
    fit: 'straight', color: 'blue', occasion: 'casual', region: 'jaipur',
    work: 'block-print', rating: 4.6, reviews: 156, emoji: '💙',
    sizes: kurthaSizes,
  },
  {
    id: 13, name: 'Silk Blouse Piece', category: 'blouse', price: 2199,
    fabric: 'silk', pattern: 'woven', neckline: 'high', sleeve: 'full',
    fit: 'regular', color: 'gold', occasion: 'wedding', region: 'banarasi',
    work: 'zari', rating: 4.3, reviews: 62, emoji: '🌟',
    sizes: blouseSizes,
  },
  {
    id: 14, name: 'Chiffon Lehenga', category: 'lehenga', price: 12999,
    fabric: 'chiffon', pattern: 'printed', neckline: 'round', sleeve: 'half',
    fit: 'flared', color: 'peach', occasion: 'festive', region: 'north',
    work: 'sequin', rating: 4.4, reviews: 73, emoji: '🍑',
    sizes: lehengaSizes,
  },
  {
    id: 15, name: 'Handloom Cotton Saree', category: 'saree', price: 2799,
    fabric: 'cotton', pattern: 'woven', neckline: null, sleeve: null,
    fit: null, color: 'orange', occasion: 'casual', region: 'chanderi',
    work: 'none', rating: 4.2, reviews: 119, emoji: '🧡',
    sareeLength: 5.5, blouseSize: 'S',
  },
  {
    id: 16, name: 'Mirror Work Kurtha', category: 'kurtha', price: 3299,
    fabric: 'georgette', pattern: 'embroidered', neckline: 'peter-pan', sleeve: 'bell',
    fit: 'flared', color: 'magenta', occasion: 'party', region: 'gujarat',
    work: 'mirror', rating: 4.7, reviews: 88, emoji: '💜',
    sizes: kurthaSizes,
  },
  {
    id: 17, name: 'Silk Saree with Blouse', category: 'saree', price: 7499,
    fabric: 'silk', pattern: 'embroidered', neckline: null, sleeve: null,
    fit: null, color: 'navy', occasion: 'festive', region: 'banarasi',
    work: 'zari', rating: 4.6, reviews: 97, emoji: '🔵',
    sareeLength: 5.5, blouseSize: 'L',
  },
  {
    id: 18, name: 'Cotton Ikat Kurtha', category: 'kurtha', price: 1999,
    fabric: 'cotton', pattern: 'ikat', neckline: 'round', sleeve: 'three-fourth',
    fit: 'straight', color: 'green', occasion: 'casual', region: 'telangana',
    work: 'ikat', rating: 4.4, reviews: 134, emoji: '💚',
    sizes: kurthaSizes,
  },
  {
    id: 19, name: 'Net Dupatta', category: 'dupatta', price: 999,
    fabric: 'net', pattern: 'embroidered', neckline: null, sleeve: null,
    fit: null, color: 'white', occasion: 'party', region: 'north',
    work: 'sequin', rating: 4.1, reviews: 55, emoji: '🤍',
  },
  {
    id: 20, name: 'Georgette Anarkali', category: 'kurtha', price: 3999,
    fabric: 'georgette', pattern: 'printed', neckline: 'v-neck', sleeve: 'full',
    fit: 'anarkali', color: 'brown', occasion: 'festive', region: 'north',
    work: 'print', rating: 4.5, reviews: 92, emoji: '🤎',
    sizes: kurthaSizes,
  },
  {
    id: 21, name: 'Patola Silk Saree', category: 'saree', price: 11999,
    fabric: 'silk', pattern: 'patola', neckline: null, sleeve: null,
    fit: null, color: 'multicolor', occasion: 'wedding', region: 'gujarat',
    work: 'woven', rating: 4.9, reviews: 38, emoji: '🌈',
    sareeLength: 5.5, blouseSize: 'M',
  },
  {
    id: 22, name: 'Cotton Dhoti Kurtha', category: 'kurtha', price: 2599,
    fabric: 'cotton', pattern: 'solid', neckline: 'collar', sleeve: 'full',
    fit: 'straight', color: 'grey', occasion: 'office', region: 'south',
    work: 'none', rating: 4.3, reviews: 78, emoji: '🩶',
    sizes: kurthaSizes,
  },
  {
    id: 23, name: 'Lehenga Blouse', category: 'blouse', price: 2999,
    fabric: 'silk', pattern: 'embroidered', neckline: 'deep', sleeve: 'sleeveless',
    fit: 'regular', color: 'red', occasion: 'wedding', region: 'banarasi',
    work: 'stone', rating: 4.5, reviews: 71, emoji: '❤️',
    sizes: blouseSizes,
  },
  {
    id: 24, name: 'Cotton Printed Saree', category: 'saree', price: 1899,
    fabric: 'cotton', pattern: 'printed', neckline: null, sleeve: null,
    fit: null, color: 'yellow', occasion: 'casual', region: 'north',
    work: 'print', rating: 4.0, reviews: 145, emoji: '💛',
    sareeLength: 5.5, blouseSize: 'S',
  },
  {
    id: 25, name: 'Organza Saree', category: 'saree', price: 6499,
    fabric: 'organza', pattern: 'embroidered', neckline: null, sleeve: null,
    fit: null, color: 'pink', occasion: 'party', region: 'north',
    work: 'thread-embroidery', rating: 4.7, reviews: 65, emoji: '🩷',
    sareeLength: 5.5, blouseSize: 'M',
  },
  {
    id: 26, name: 'Embroidered Cotton Kurti', category: 'kurtha', price: 1699,
    fabric: 'cotton', pattern: 'embroidered', neckline: 'round', sleeve: 'half',
    fit: 'straight', color: 'pink', occasion: 'casual', region: 'north',
    work: 'thread-embroidery', rating: 4.2, reviews: 167, emoji: '🩷',
    sizes: kurthaSizes,
  },
  {
    id: 27, name: 'Kota Doria Saree', category: 'saree', price: 3999,
    fabric: 'cotton', pattern: 'woven', neckline: null, sleeve: null,
    fit: null, color: 'purple', occasion: 'office', region: 'rajasthan',
    work: 'woven', rating: 4.4, reviews: 82, emoji: '💜',
    sareeLength: 5.5, blouseSize: 'M',
  },
  {
    id: 28, name: 'Silk Lehenga Blouse', category: 'blouse', price: 3499,
    fabric: 'silk', pattern: 'embroidered', neckline: 'boat', sleeve: 'three-fourth',
    fit: 'regular', color: 'gold', occasion: 'festive', region: 'banarasi',
    work: 'zari', rating: 4.6, reviews: 44, emoji: '💛',
    sizes: blouseSizes,
  },
  {
    id: 29, name: 'Cotton Block-Print Saree', category: 'saree', price: 2499,
    fabric: 'cotton', pattern: 'block-print', neckline: null, sleeve: null,
    fit: null, color: 'blue', occasion: 'casual', region: 'jaipur',
    work: 'block-print', rating: 4.3, reviews: 113, emoji: '🩵',
    sareeLength: 5.5, blouseSize: 'M',
  },
  {
    id: 30, name: 'Velvet Dupatta', category: 'dupatta', price: 1599,
    fabric: 'velvet', pattern: 'embroidered', neckline: null, sleeve: null,
    fit: null, color: 'maroon', occasion: 'festive', region: 'north',
    work: 'zari', rating: 4.4, reviews: 59, emoji: '❤️',
  },
]

/* ── Category list used for filter pills ── */
export const categories = ['kurtha', 'saree', 'lehenga', 'dupatta', 'blouse']

/* ── Human-readable occasion labels ── */
export const occasionLabels = {
  casual: 'Casual Wear', office: 'Office Wear', festive: 'Festive',
  party: 'Party', wedding: 'Wedding',
}

/* ── Hero collection cards shown on the Collection page ── */
export const collections = [
  { id: 'festive', name: 'Festival Edit', desc: 'Celebrate in style', emoji: '✨', color: '#f0ebe4' },
  { id: 'casual', name: 'Daily Grace', desc: 'Everyday elegance', emoji: '○', color: '#e8e8e0' },
  { id: 'wedding', name: 'Bridal Luxe', desc: 'For the grand day', emoji: '👑', color: '#ebe4e4' },
  { id: 'office', name: 'Work Wardrobe', desc: 'Polished & comfortable', emoji: '◇', color: '#e4ebe4' },
  { id: 'party', name: 'Party Glam', desc: 'Shine bright', emoji: '☆', color: '#ebe4e8' },
]

/* ── Available filter values for the Products page filter bar ── */
export const filterOptions = {
  category: categories,
  fabric: ['cotton', 'silk', 'georgette', 'chiffon', 'linen', 'velvet', 'organza', 'net'],
  occasion: Object.keys(occasionLabels),
  color: ['red', 'blue', 'green', 'gold', 'pink', 'purple', 'white', 'maroon', 'navy', 'teal', 'beige', 'mustard', 'orange', 'multicolor', 'brown', 'grey', 'yellow', 'magenta', 'indigo', 'peach'],
  pattern: ['solid', 'printed', 'embroidered', 'block-print', 'bandhani', 'ikat', 'woven', 'patola'],
  region: ['banarasi', 'kanchipuram', 'chanderi', 'jaipur', 'gujarat', 'rajasthan', 'telangana', 'south', 'north'],
  work: ['none', 'zari', 'sequin', 'mirror', 'thread-embroidery', 'stone', 'block-print', 'print', 'bandhani', 'woven', 'ikat'],
}
