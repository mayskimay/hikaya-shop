'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './src/sanity/schemaTypes';
import { dataset, projectId } from './src/sanity/env';

export default defineConfig({
  name: 'hikaya',
  title: 'Hikaya Shop',
  basePath: '/studio',
  // Platzhalter, damit der Build auch ohne Einrichtung nicht abbricht
  projectId: projectId || 'missing-project-id',
  dataset,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
