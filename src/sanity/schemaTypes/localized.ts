import { defineField, defineType } from 'sanity';

// Ein Textfeld in zwei Sprachen: Deutsch und Englisch
export const localizedString = defineType({
  name: 'localizedString',
  title: 'Text (DE / EN)',
  type: 'object',
  fields: [
    defineField({ name: 'de', title: 'Deutsch', type: 'string' }),
    defineField({ name: 'en', title: 'English', type: 'string' }),
  ],
});

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Langtext (DE / EN)',
  type: 'object',
  fields: [
    defineField({ name: 'de', title: 'Deutsch', type: 'text', rows: 4 }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 4 }),
  ],
});
