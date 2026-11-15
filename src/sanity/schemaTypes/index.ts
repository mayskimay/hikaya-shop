import { localizedString, localizedText } from './localized';
import { category } from './category';
import { product } from './product';
import { order } from './order';
import { shopSettings, shippingSettings, siteTexts } from './settings';

export const schemaTypes = [localizedString, localizedText, category, product, order, shopSettings, shippingSettings, siteTexts];

// Dokumente, die es nur einmal gibt (feste ID = Typname)
export const singletonTypes = new Set(['shopSettings', 'shippingSettings', 'siteTexts']);
