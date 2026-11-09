import { defineField, defineType } from 'sanity';

// Hauptkategorie: "Übergeordnete Kategorie" leer lassen.
// Unterkategorie: die Hauptkategorie bei "Übergeordnete Kategorie" auswählen.
export const category = defineType({
  name: 'category',
  title: 'Kategorie',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'localizedString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Kennung (für die Internetadresse)',
      type: 'slug',
      options: { source: 'title.en', maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Übergeordnete Kategorie (leer lassen = Hauptkategorie)',
      type: 'reference',
      to: [{ type: 'category' }],
      options: { filter: '!defined(parent)' },
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge (kleine Zahl = weiter vorne)',
      type: 'number',
      initialValue: 100,
    }),
  ],
  preview: {
    select: { title: 'title.de', parent: 'parent.title.de' },
    prepare({ title, parent }) {
      return { title, subtitle: parent ? `Unterkategorie von ${parent}` : 'Hauptkategorie' };
    },
  },
});
