import { defineArrayMember, defineField, defineType } from 'sanity';

export const product = defineType({
  name: 'product',
  title: 'Produkt',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Produktname',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Kennung (für die Internetadresse)',
      type: 'slug',
      options: { source: 'name.en', maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Fotos (das erste ist das Titelbild)',
      type: 'array',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true } })],
    }),
    defineField({
      name: 'category',
      title: 'Hauptkategorie',
      type: 'reference',
      to: [{ type: 'category' }],
      options: { filter: '!defined(parent)' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subcategory',
      title: 'Unterkategorie',
      type: 'reference',
      to: [{ type: 'category' }],
      options: {
        filter: ({ document }) => ({
          filter: 'parent._ref == $parent',
          params: { parent: (document as { category?: { _ref?: string } })?.category?._ref ?? '' },
        }),
      },
    }),
    defineField({
      name: 'price',
      title: 'Preis (€)',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'salePrice',
      title: 'Sale-Preis (€) – leer lassen, wenn das Produkt nicht im Sale ist',
      type: 'number',
      validation: (rule) =>
        rule.min(0).custom((value, context) => {
          const price = (context.document as { price?: number })?.price;
          if (value && price && value >= price) return 'Der Sale-Preis muss niedriger als der normale Preis sein.';
          return true;
        }),
    }),
    defineField({ name: 'bestseller', title: 'Bestseller', type: 'boolean', initialValue: false }),
    defineField({ name: 'isNew', title: 'Neuheit', type: 'boolean', initialValue: false }),
    defineField({ name: 'description', title: 'Beschreibung', type: 'localizedText' }),
    defineField({ name: 'material', title: 'Material / Zusammensetzung', type: 'localizedString' }),
    defineField({
      name: 'colors',
      title: 'Farben',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'color',
          fields: [
            defineField({ name: 'name', title: 'Farbname', type: 'localizedString' }),
            defineField({
              name: 'hex',
              title: 'Farbcode (z. B. #97A67F)',
              type: 'string',
              validation: (rule) =>
                rule.regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, { name: 'Farbcode' }).required(),
            }),
          ],
          preview: { select: { title: 'name.de', subtitle: 'hex' } },
        }),
      ],
    }),
    defineField({
      name: 'sizes',
      title: 'Größen (z. B. S, M, L)',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'stock',
      title: 'Bestand (Stück). 0 = ausverkauft',
      type: 'number',
      initialValue: 5,
      validation: (rule) => rule.min(0).integer(),
    }),
  ],
  preview: {
    select: { title: 'name.de', media: 'images.0', price: 'price' },
    prepare({ title, media, price }) {
      return { title, media, subtitle: price !== undefined ? `${price} €` : '' };
    },
  },
});
