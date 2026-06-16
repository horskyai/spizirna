// Centrální překladový slovník — skládá se z dílčích modulů podle oblasti
// aplikace. Každý modul (core, pantry, recipes…) exportuje objekt
// { "klíč": { cs, sk } }. Přidávej nové texty do příslušného modulu, ať
// hlavní soubor zůstává přehledný a moduly jdou upravovat nezávisle.

import { core } from "./core";
import { pantry } from "./pantry";
import { foodlog } from "./foodlog";
import { recipes } from "./recipes";
import { shopping } from "./shopping";
import { recurring } from "./recurring";
import { provoz } from "./provoz";
import { scanner } from "./scanner";
import { header } from "./header";
import { productsheet } from "./productsheet";
import { addproduct } from "./addproduct";
import { addrecipe } from "./addrecipe";
import { voice } from "./voice";
import { prices } from "./prices";
import { auth } from "./auth";

export interface Translation {
  cs: string;
  sk: string;
}

export const DICT: Record<string, Translation> = {
  ...core,
  ...pantry,
  ...foodlog,
  ...recipes,
  ...shopping,
  ...recurring,
  ...provoz,
  ...scanner,
  ...header,
  ...productsheet,
  ...addproduct,
  ...addrecipe,
  ...voice,
  ...prices,
  ...auth,
};
