/**
 * Pre-filled prompts for Studio Création templates
 * Optimized for fal.ai Flux Nano Banana model
 */

export const PRODUCT_TYPES = [
  { value: 'bag', label: 'Sac / Bag' },
  { value: 'shoes', label: 'Chaussures / Shoes' },
  { value: 'clothing', label: 'Vêtements / Clothing' },
  { value: 'furniture', label: 'Meubles / Furniture' },
  { value: 'electronics', label: 'Électronique / Electronics' },
  { value: 'accessories', label: 'Accessoires / Accessories' },
  { value: 'jewelry', label: 'Bijoux / Jewelry' },
  { value: 'cosmetics', label: 'Cosmétiques / Cosmetics' },
  { value: 'other', label: 'Autre / Other' }
] as const;

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'palette-couleurs': `Generate 4 color variations of this [product type] maintaining the exact same angle, lighting, and composition. Create versions in: black, white, red/pink, and blue. Keep all product details, textures, and design elements identical except for the color change. Professional product photography style, clean background, studio lighting.`,
  
  'vue-360': `Create 4 different angles of this [product type] for a professional showroom presentation: front view, left side profile, right side profile, and back view. Maintain consistent lighting, background, and product positioning across all angles. Professional studio photography, neutral background, even lighting, e-commerce quality.`,
  
  'branding': `Create professional branding mockups of this logo on different materials and contexts: business card, letterhead, branded merchandise, and digital display. Maintain brand colors and proportions. Clean, modern presentation style, professional mockup quality.`,
  
  'environnement': `Place this [product type] in 4 realistic lifestyle settings: modern living room, minimalist office, cozy bedroom, and bright kitchen. Maintain product visibility and appeal. Natural lighting, realistic staging, lifestyle photography style, interior design aesthetic.`,
  
  'pub-instagram': `Create 4 professional advertising visuals for this [product type] optimized for social media: Instagram story format, Facebook post, LinkedIn banner, and Pinterest pin. Include subtle copy space for text overlay. Modern advertising aesthetic, eye-catching composition, professional marketing quality.`,
  
  'lifestyle': `Generate 4 lifestyle scenes featuring this [product type] in aspirational contexts: fashion/style context, sports/active lifestyle, travel/adventure setting, and home comfort scene. Natural lighting, authentic staging, editorial photography style, emotional appeal.`,
  
  'essayage': `Create realistic mockups of this clothing/accessory item being worn by diverse models in 4 different settings: casual daywear, professional office setting, evening/night out, and outdoor/active wear. Natural poses, realistic fit, fashion photography style, diverse representation.`,
  
  'influenceur': `Generate 4 influencer-style product presentation photos: unboxing shot, hand holding product with aesthetic background, flat lay composition, and lifestyle action shot. Trendy Instagram aesthetic, natural lighting, authentic feel, social media optimized.`,
  
  'ugc': `Create 4 authentic user-generated content style photos of this product: close-up detail shot, product in use, comparison/before-after, and testimonial-style presentation. Authentic feel, phone camera aesthetic, relatable presentation, trustworthy appearance.`
};

/**
 * Get the template prompt with product type replaced
 */
export function getTemplatePrompt(templateId: string, productType: string): string {
  const basePrompt = TEMPLATE_PROMPTS[templateId];
  if (!basePrompt) {
    return '';
  }
  
  const productLabel = PRODUCT_TYPES.find(p => p.value === productType)?.label.split('/')[1]?.trim() 
    || productType;
  
  return basePrompt.replace(/\[product type\]/g, productLabel);
}

/**
 * Result labels for each template
 */
export const TEMPLATE_RESULT_LABELS: Record<string, string[]> = {
  'palette-couleurs': ['Noir / Black', 'Blanc / White', 'Rouge/Rose / Red/Pink', 'Bleu / Blue'],
  'vue-360': ['Vue de face / Front', 'Profil gauche / Left', 'Profil droit / Right', 'Vue de dos / Back'],
  'branding': ['Carte de visite / Business Card', 'En-tête / Letterhead', 'Marchandise / Merchandise', 'Affichage digital / Digital'],
  'environnement': ['Salon / Living Room', 'Bureau / Office', 'Chambre / Bedroom', 'Cuisine / Kitchen'],
  'pub-instagram': ['Story Instagram', 'Post Facebook', 'Bannière LinkedIn', 'Pin Pinterest'],
  'lifestyle': ['Mode / Fashion', 'Sport / Active', 'Voyage / Travel', 'Maison / Home'],
  'essayage': ['Casual / Day Wear', 'Bureau / Office', 'Soirée / Evening', 'Extérieur / Outdoor'],
  'influenceur': ['Unboxing', 'Main + Produit / Hand Held', 'Flat Lay', 'Action Shot'],
  'ugc': ['Détail / Close-up', 'En usage / In Use', 'Avant/Après / Before/After', 'Témoignage / Testimonial']
};
