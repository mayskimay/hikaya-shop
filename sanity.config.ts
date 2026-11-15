'use client';

import { defineConfig } from 'sanity';
import { structureTool, type StructureBuilder } from 'sanity/structure';
import { schemaTypes, singletonTypes } from './src/sanity/schemaTypes';
import { dataset, projectId } from './src/sanity/env';

// Übersichtliche Gliederung im Editor. Einstellungen gibt es genau einmal.
const singleton = (S: StructureBuilder, type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title));

export default defineConfig({
  name: 'hikaya',
  title: 'Hikaya Shop',
  basePath: '/studio',
  // Platzhalter, damit der Build auch ohne Einrichtung nicht abbricht
  projectId: projectId || 'missing-project-id',
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Hikaya')
          .items([
            S.documentTypeListItem('product').title('Produkte'),
            S.documentTypeListItem('category').title('Kategorien'),
            S.documentTypeListItem('order').title('Bestellungen'),
            S.divider(),
            singleton(S, 'shopSettings', 'Shop-Informationen'),
            singleton(S, 'shippingSettings', 'Versand'),
            singleton(S, 'siteTexts', 'Texte (DE / EN)'),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    // Einstellungen nicht ein zweites Mal anlegen lassen
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      singletonTypes.has(schemaType) ? actions.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action)) : actions,
  },
});
