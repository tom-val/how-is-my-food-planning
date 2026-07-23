import type { AiSuggestedRecipe } from "../../api/recipeApi";

/**
 * One-time import dataset extracted from "meal plan.xlsx".
 * 43 recipes: 32 from sheet "Produktų sąrašas" + 11 recovered from
 * "turbo produktų sąrašas" (by recipe ID) and the weekly-plan sheets.
 * Category mapping: breakfast -> ["breakfast"]; soups/salads/pasta/stews/
 * "something interesting" -> ["lunch", "dinner"].
 * Units normalised to the app vocabulary; unknown/"as needed" quantities -> null.
 * Safe to delete this file (and ImportRecipesPage) once the import is done.
 */
export const IMPORT_RECIPES: AiSuggestedRecipe[] = [
  {
    "name": "varškėčiai",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "varškė",
        "quantity": 2,
        "unit": "pakeliai"
      },
      {
        "name": "jogurtas",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "bananas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "kiaušiniai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "miltai",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "cinamonas",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "druska",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "kepimo milteliai",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "uogienė",
        "quantity": 4,
        "unit": "v.š."
      },
      {
        "name": "grietinė",
        "quantity": 4,
        "unit": "v.š."
      }
    ]
  },
  {
    "name": "chia pudingas (šokoladinis)",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "chia sėklos",
        "quantity": 3,
        "unit": "v.š."
      },
      {
        "name": "jogurtas",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "kakava",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "šaldytos vyšnios",
        "quantity": 3,
        "unit": "v.š."
      },
      {
        "name": "druska",
        "quantity": 0.5,
        "unit": "a.š."
      }
    ]
  },
  {
    "name": "chia pudingas (su bananais)",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "chia sėklos",
        "quantity": 3,
        "unit": "v.š."
      },
      {
        "name": "bananas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "riešutų sviestas",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "druska",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "sirupas",
        "quantity": 1,
        "unit": "v.š."
      }
    ]
  },
  {
    "name": "sumuštiniai su mėsyte",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "duona",
        "quantity": 4,
        "unit": "rieks."
      },
      {
        "name": "sviestas",
        "quantity": 25,
        "unit": "g"
      },
      {
        "name": "mėsytė",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "pomidoras",
        "quantity": 2,
        "unit": "vnt"
      }
    ]
  },
  {
    "name": "kiaušinis su langeliu",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "duona",
        "quantity": 4,
        "unit": "rieks."
      },
      {
        "name": "kiaušiniai",
        "quantity": 4,
        "unit": null
      }
    ]
  },
  {
    "name": "virti kiaušiniai",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "kiaušiniai",
        "quantity": 4,
        "unit": "vnt"
      },
      {
        "name": "duona",
        "quantity": 4,
        "unit": "rieks."
      },
      {
        "name": "sviestas",
        "quantity": 25,
        "unit": "g"
      },
      {
        "name": "majonezas",
        "quantity": 4,
        "unit": "a.š."
      }
    ]
  },
  {
    "name": "omletas",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "kiaušiniai",
        "quantity": 5,
        "unit": "vnt"
      },
      {
        "name": "pienas",
        "quantity": 100,
        "unit": "ml"
      },
      {
        "name": "miltai",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Sūris",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "saulėje džiovinti pomidorai",
        "quantity": 50,
        "unit": "g"
      }
    ]
  },
  {
    "name": "avižinė košė",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "avižiniai dribsniai",
        "quantity": 200,
        "unit": "g"
      },
      {
        "name": "uogienė",
        "quantity": 4,
        "unit": "v.š."
      },
      {
        "name": "pienas",
        "quantity": 200,
        "unit": "ml"
      },
      {
        "name": "druska",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "riešutų sviestas",
        "quantity": 4,
        "unit": "v.š."
      }
    ]
  },
  {
    "name": "grikių košė",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "grikiai",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "avokadas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "pomidoras",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "feta sūris",
        "quantity": 50,
        "unit": "g"
      }
    ]
  },
  {
    "name": "sumuštinis su kiaušiniene",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "kiaušiniai",
        "quantity": 4,
        "unit": "vnt"
      },
      {
        "name": "duona",
        "quantity": 4,
        "unit": "rieks."
      },
      {
        "name": "pomidoras",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "avokadas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Sūris",
        "quantity": 50,
        "unit": "g"
      }
    ]
  },
  {
    "name": "kesadilijos",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Vištienos krūtinėlė",
        "quantity": 450,
        "unit": "g"
      },
      {
        "name": "Alyvuogių aliejus",
        "quantity": 30,
        "unit": "ml"
      },
      {
        "name": "Česnakas",
        "quantity": 3,
        "unit": "sk."
      },
      {
        "name": "Svogūnai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Paprika",
        "quantity": 120,
        "unit": "g"
      },
      {
        "name": "Konservuoti kukurūzai",
        "quantity": 75,
        "unit": "g"
      },
      {
        "name": "Taco prieskoniai",
        "quantity": 20,
        "unit": "g"
      },
      {
        "name": "druska",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "mandarinai",
        "quantity": 425,
        "unit": "g"
      },
      {
        "name": "Tortilijos (vidutinio dydžio)",
        "quantity": 8,
        "unit": "vnt"
      },
      {
        "name": "Sūris",
        "quantity": 200,
        "unit": "g"
      }
    ]
  },
  {
    "name": "plovas",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Jautiena",
        "quantity": 700,
        "unit": "g"
      },
      {
        "name": "Svogūnai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Morkos",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Česnako galvutė",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Ilgagrūdžiai ryžiai",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Aliejus",
        "quantity": 100,
        "unit": "ml"
      },
      {
        "name": "Kumino sėklos",
        "quantity": 1,
        "unit": "a.š."
      },
      {
        "name": "Kalendros milteliai",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "Juodieji pipirai",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "Druska",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "Razinos",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "Paprika",
        "quantity": 1,
        "unit": "vnt"
      }
    ]
  },
  {
    "name": "makaronai su vištiena",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Vištienos krūtinėlė",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Penne makaronai",
        "quantity": 200,
        "unit": "g"
      },
      {
        "name": "Sviestas",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "Česnakas",
        "quantity": 3,
        "unit": "sk."
      },
      {
        "name": "Vištienos sultinys",
        "quantity": 240,
        "unit": "ml"
      },
      {
        "name": "Grietinėlė (35%)",
        "quantity": 240,
        "unit": "ml"
      },
      {
        "name": "Sūris",
        "quantity": 60,
        "unit": "g"
      },
      {
        "name": "saulėje džiovinti pomidorai",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Itališki prieskoniai",
        "quantity": 2,
        "unit": "a.š."
      }
    ]
  },
  {
    "name": "pad thai",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Vištienos filė",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Ryžių makaronai",
        "quantity": 200,
        "unit": "g"
      },
      {
        "name": "kiaušiniai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Morkos",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Žemės riešutai",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Česnakas",
        "quantity": 2,
        "unit": "sk."
      },
      {
        "name": "Sezamų aliejus",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "Laimo sultys",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "Svogūnų laiškai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Paprika",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Pad thai padažas",
        "quantity": 1,
        "unit": "pakelis"
      }
    ]
  },
  {
    "name": "Bolonijos padažas",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Morka",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "Svogūnai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Saliero stiebas",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "Česnako skiltelės",
        "quantity": 3,
        "unit": "vnt"
      },
      {
        "name": "Pancetta arba šoninė",
        "quantity": 225,
        "unit": "g"
      },
      {
        "name": "Malta jautiena",
        "quantity": 450,
        "unit": "g"
      },
      {
        "name": "Maltas kiauliena",
        "quantity": 450,
        "unit": "g"
      },
      {
        "name": "Baltas vynas",
        "quantity": 240,
        "unit": "ml"
      },
      {
        "name": "Smulkinti pomidorai",
        "quantity": 820,
        "unit": "g"
      },
      {
        "name": "Pomidorų pasta",
        "quantity": 115,
        "unit": "g"
      },
      {
        "name": "Vištienos sultinys",
        "quantity": 480,
        "unit": "ml"
      },
      {
        "name": "Pienas",
        "quantity": 240,
        "unit": "ml"
      }
    ]
  },
  {
    "name": "Peanut butter noodles",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Ryžių makaronai",
        "quantity": 200,
        "unit": "g"
      },
      {
        "name": "Česnakas",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Aliejus",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "Žemės riešutų sviestas",
        "quantity": 60,
        "unit": "g"
      },
      {
        "name": "Sojos padažas",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "Ryžių actas",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "Klevų sirupas",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "Vanduo",
        "quantity": 60,
        "unit": "ml"
      },
      {
        "name": "Čili padažas",
        "quantity": 1,
        "unit": "a.š."
      },
      {
        "name": "Sezamų aliejus",
        "quantity": 1,
        "unit": "a.š."
      },
      {
        "name": "Svogūnų laiškai",
        "quantity": null,
        "unit": null
      },
      {
        "name": "Smulkinti žemės riešutai",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Kalendra",
        "quantity": null,
        "unit": null
      },
      {
        "name": "Vištiena",
        "quantity": 400,
        "unit": "g"
      }
    ]
  },
  {
    "name": "Bulviniai blynai",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Bulvės",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "kiaušiniai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Svogūnai",
        "quantity": 0.5,
        "unit": "vnt"
      },
      {
        "name": "Grietinė",
        "quantity": 8,
        "unit": "v.š."
      }
    ]
  },
  {
    "name": "Čili troškinys",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Malta jautiena",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Svogūnai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Česnako skiltelės",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Paprika",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Konservuoti pomidorai",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Raudonosios pupelės (kons.)",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Pomidorų pasta",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "Morkos",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Konservuoti kukurūzai",
        "quantity": 1,
        "unit": "indelis"
      }
    ]
  },
  {
    "name": "Kiniška vištiena",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Vištiena",
        "quantity": 800,
        "unit": "g"
      },
      {
        "name": "Krakmolas",
        "quantity": 6,
        "unit": "v.š."
      },
      {
        "name": "Čili padažas",
        "quantity": 6,
        "unit": "v.š."
      },
      {
        "name": "Aliejus",
        "quantity": 6,
        "unit": "v.š."
      },
      {
        "name": "Sirupas",
        "quantity": 6,
        "unit": "v.š."
      },
      {
        "name": "Sojos padažas",
        "quantity": 6,
        "unit": "v.š."
      },
      {
        "name": "Ryžiai",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "avokadas",
        "quantity": 2,
        "unit": "vnt"
      }
    ]
  },
  {
    "name": "Kotletai",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Malta kiauliena",
        "quantity": 600,
        "unit": "g"
      },
      {
        "name": "kiaušiniai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Džiūvėsėliai",
        "quantity": 3,
        "unit": "v.š."
      },
      {
        "name": "Svogūnai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Bulvės",
        "quantity": 800,
        "unit": "g"
      },
      {
        "name": "Pienas",
        "quantity": 150,
        "unit": "ml"
      },
      {
        "name": "Sviestas",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "VIrti burokėliai",
        "quantity": 1,
        "unit": "pakelis"
      }
    ]
  },
  {
    "name": "Cezario salotos",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Vištienos krūtinėlė",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Romėniškos salotos",
        "quantity": 1,
        "unit": "didelė galva"
      },
      {
        "name": "Vyšniniai pomidorai",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Kietasis sūris",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Batonas skrudinimui",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Česnakas",
        "quantity": 1,
        "unit": "sk."
      },
      {
        "name": "kiaušiniai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Dižono garstyčios",
        "quantity": 1,
        "unit": "a.š."
      },
      {
        "name": "Citrinos sultys",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "Worcestershire padažas",
        "quantity": 1,
        "unit": "a.š."
      }
    ]
  },
  {
    "name": "Trinta daržovių sriuba",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Morkos",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Salierų stiebai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Poras",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Svogūnai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Sviestas",
        "quantity": 25,
        "unit": "g"
      },
      {
        "name": "Pastarnokas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Bulvės",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Daržovių sultinys",
        "quantity": 600,
        "unit": "ml"
      },
      {
        "name": "Šaldyti žirneliai",
        "quantity": 120,
        "unit": "g"
      },
      {
        "name": "Grietinėlė (35%)",
        "quantity": 100,
        "unit": "ml"
      },
      {
        "name": "Sviestas",
        "quantity": 20,
        "unit": "g"
      },
      {
        "name": "Rozmarinas",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Batonas skrudinimui",
        "quantity": 3,
        "unit": "rieks."
      }
    ]
  },
  {
    "name": "Makaronai su svogūnais",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Makaronai",
        "quantity": 320,
        "unit": "g"
      },
      {
        "name": "Svogūnai",
        "quantity": 3,
        "unit": "vnt"
      },
      {
        "name": "Česnakas",
        "quantity": 4,
        "unit": "sk."
      },
      {
        "name": "Džiovinti pomidorai",
        "quantity": 280,
        "unit": "g"
      },
      {
        "name": "Šviežios petražolės",
        "quantity": 30,
        "unit": "g"
      },
      {
        "name": "Sviestas",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Grietinėlė (35%)",
        "quantity": 100,
        "unit": "ml"
      },
      {
        "name": "Sūris",
        "quantity": 100,
        "unit": "g"
      }
    ]
  },
  {
    "name": "Barščiai",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Konservuoti burokėliai",
        "quantity": 1,
        "unit": "stiklainis"
      },
      {
        "name": "Morka",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Svogūnai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Saliero stiebas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Bulvės",
        "quantity": 3,
        "unit": "vidutinio dydžio"
      },
      {
        "name": "Česnako skiltelės",
        "quantity": 3,
        "unit": "vnt"
      },
      {
        "name": "Pomidorų pasta",
        "quantity": 2,
        "unit": "v.š."
      },
      {
        "name": "Malta kiauliena",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "kiaušiniai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Svogūnai",
        "quantity": 1,
        "unit": "vnt"
      }
    ]
  },
  {
    "name": "Pavasarinės salotos",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Ridikėliai",
        "quantity": 250,
        "unit": "g"
      },
      {
        "name": "Svogūnų laiškai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Salota",
        "quantity": 0.5,
        "unit": "vnt"
      },
      {
        "name": "Agurkas",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "grietinė",
        "quantity": 4,
        "unit": "v.š."
      }
    ]
  },
  {
    "name": "Brokolių sriuba",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Brokoliai",
        "quantity": 1,
        "unit": "galva"
      },
      {
        "name": "Morkos",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Bulvės",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Svogūnai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Saliero stiebai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Česnakas",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Daržovių sultinys",
        "quantity": 1,
        "unit": "l"
      },
      {
        "name": "Grietinėlė (35%)",
        "quantity": 150,
        "unit": "ml"
      },
      {
        "name": "Rudieji ryžiai",
        "quantity": 100,
        "unit": "g"
      }
    ]
  },
  {
    "name": "Kiaušinienė tortilijoje",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "Tortilijos (vidutinio dydžio)",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "kiaušiniai",
        "quantity": 4,
        "unit": "vnt"
      },
      {
        "name": "Pomidoras",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "avokadas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "mėsytė",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Sūris",
        "quantity": 50,
        "unit": "g"
      }
    ]
  },
  {
    "name": "Tortilijos",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Tortilijos (vidutinio dydžio)",
        "quantity": 8,
        "unit": "vnt"
      },
      {
        "name": "Malta jautiena",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "Raudonosios pupelės (kons.)",
        "quantity": 1,
        "unit": "skardinė"
      },
      {
        "name": "Konservuoti kukurūzai",
        "quantity": 1,
        "unit": "skardinė"
      },
      {
        "name": "Avokadas",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Jogurtas",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Sūris",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Citrinos sultys",
        "quantity": 30,
        "unit": "ml"
      }
    ]
  },
  {
    "name": "Vištiena meduje su bulvėm",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Vištienos filė",
        "quantity": 800,
        "unit": "g"
      },
      {
        "name": "Medus",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Garstyčios",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Bulvės",
        "quantity": 500,
        "unit": "g"
      }
    ]
  },
  {
    "name": "Karis su bulvėm",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Bulvės",
        "quantity": 400,
        "unit": "g"
      },
      {
        "name": "špinatai",
        "quantity": 200,
        "unit": "g"
      },
      {
        "name": "anakardžiai",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "konservuoti pomidorai",
        "quantity": 1,
        "unit": "skardinė"
      },
      {
        "name": "svogūnai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "česnakas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "kokosų aliejus",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "vištienos sultinys",
        "quantity": 1,
        "unit": "kubelis"
      }
    ]
  },
  {
    "name": "Lazanija",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Plokšti makaronai",
        "quantity": 10,
        "unit": "vnt"
      },
      {
        "name": "Malta jautiena",
        "quantity": 700,
        "unit": "g"
      },
      {
        "name": "Pomidorų pasta",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "svogūnai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "česnakas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "sūris",
        "quantity": 200,
        "unit": "g"
      },
      {
        "name": "pienas",
        "quantity": 600,
        "unit": "ml"
      },
      {
        "name": "miltai",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "sviestas",
        "quantity": 40,
        "unit": "g"
      },
      {
        "name": "konservuoti pomidorai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "morka",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "salieras",
        "quantity": 1,
        "unit": "vnt"
      }
    ]
  },
  {
    "name": "Salotos su halumiu",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Iceberg",
        "quantity": 1,
        "unit": "galva"
      },
      {
        "name": "Avokadas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Agurkas",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Obuolys (traškus)",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "Halumi sūris",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Graikiniai riešutai",
        "quantity": 50,
        "unit": "g"
      }
    ]
  },
  {
    "name": "Varškės sūris su medumi",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "Varškės sūris",
        "quantity": 200,
        "unit": "g"
      },
      {
        "name": "Medus",
        "quantity": 2,
        "unit": "v.š."
      }
    ]
  },
  {
    "name": "Žaliasis kokteilis",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "bananai",
        "quantity": null,
        "unit": null
      },
      {
        "name": "špinatai",
        "quantity": null,
        "unit": null
      },
      {
        "name": "augalinis pienas",
        "quantity": null,
        "unit": null
      }
    ]
  },
  {
    "name": "Vaisių kokteilis",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "bananai",
        "quantity": null,
        "unit": null
      },
      {
        "name": "apelsinai",
        "quantity": null,
        "unit": null
      },
      {
        "name": "obuoliai",
        "quantity": null,
        "unit": null
      }
    ]
  },
  {
    "name": "Kokteilis su imbieru",
    "instructions": null,
    "categories": [
      "breakfast"
    ],
    "ingredients": [
      {
        "name": "bananai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "apelsinai",
        "quantity": 2,
        "unit": "vnt"
      },
      {
        "name": "imbieras",
        "quantity": null,
        "unit": null
      }
    ]
  },
  {
    "name": "Pica",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Picos padas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Pomidorų padažas",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Mocarela sūris",
        "quantity": 150,
        "unit": "g"
      },
      {
        "name": "Sūris",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Grybai",
        "quantity": 100,
        "unit": "g"
      },
      {
        "name": "Kumpis",
        "quantity": 50,
        "unit": "g"
      },
      {
        "name": "Alyvuogių aliejus",
        "quantity": 1,
        "unit": "a.š."
      }
    ]
  },
  {
    "name": "Įdaryti makaronai su mėsa",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Malta jautiena",
        "quantity": 500,
        "unit": "g"
      },
      {
        "name": "Svogūnas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Makaronų vamzdeliai",
        "quantity": 500,
        "unit": "g"
      },
      {
        "name": "Druska",
        "quantity": null,
        "unit": null
      },
      {
        "name": "Prieskoniai (maltos mėsos)",
        "quantity": null,
        "unit": null
      }
    ]
  },
  {
    "name": "Moliūgų sriuba",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Moliūgas",
        "quantity": 500,
        "unit": "g"
      },
      {
        "name": "Svogūnas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Česnakas",
        "quantity": 2,
        "unit": "sk."
      },
      {
        "name": "Bulvė",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Grietinėlė",
        "quantity": 200,
        "unit": "ml"
      },
      {
        "name": "Daržovių sultinys",
        "quantity": 500,
        "unit": "ml"
      },
      {
        "name": "Alyvuogių aliejus",
        "quantity": 1,
        "unit": "v.š."
      }
    ]
  },
  {
    "name": "Pomidorinė sriuba",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Svogūnas",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Česnakas",
        "quantity": 2,
        "unit": "sk."
      },
      {
        "name": "Konservuoti pomidorai",
        "quantity": 2,
        "unit": "skardinė"
      }
    ]
  },
  {
    "name": "Troškinti kopūstai su dešrelėmis",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "rauginti kopūstai",
        "quantity": 350,
        "unit": "g"
      },
      {
        "name": "storos dešrelės",
        "quantity": 3,
        "unit": "vnt"
      },
      {
        "name": "Morkos",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Svogūnai",
        "quantity": 0.5,
        "unit": "vnt"
      },
      {
        "name": "Pomidorų padažas",
        "quantity": 1.5,
        "unit": "v.š."
      },
      {
        "name": "Ciberžolė",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "Kmynai",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "Lauro lapai",
        "quantity": 1,
        "unit": "vnt"
      },
      {
        "name": "Česnakas",
        "quantity": 2,
        "unit": "vnt"
      }
    ]
  },
  {
    "name": "Vištiena tikka masala",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "Vištienos krūtinėlė",
        "quantity": 300,
        "unit": "g"
      },
      {
        "name": "Grietinėlė",
        "quantity": 120,
        "unit": "ml"
      },
      {
        "name": "Konservuoti pomidorai",
        "quantity": 100,
        "unit": "ml"
      },
      {
        "name": "Pomidorų padažas",
        "quantity": 100,
        "unit": "ml"
      },
      {
        "name": "Svogūnas",
        "quantity": 0.5,
        "unit": "vnt"
      },
      {
        "name": "Imbieras",
        "quantity": 1,
        "unit": "a.š."
      },
      {
        "name": "saldžiosios paprikos milteliai",
        "quantity": 1,
        "unit": "a.š."
      },
      {
        "name": "aitriosios paprikos milteliai",
        "quantity": 1,
        "unit": "a.š."
      },
      {
        "name": "citrinų sultys",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "cukraus",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "malta kalendra",
        "quantity": 0.6,
        "unit": "a.š."
      },
      {
        "name": "malta ciberžolė",
        "quantity": 0.3,
        "unit": "a.š."
      },
      {
        "name": "garam masala prieskoniai",
        "quantity": 0.6,
        "unit": "a.š."
      },
      {
        "name": "Česnakas",
        "quantity": 3,
        "unit": "sk."
      },
      {
        "name": "Jogurtas",
        "quantity": 1,
        "unit": "v.š."
      },
      {
        "name": "Maltas kuminas",
        "quantity": 0.5,
        "unit": "a.š."
      },
      {
        "name": "Ryžiai",
        "quantity": 100,
        "unit": "g"
      }
    ]
  },
  {
    "name": "Burgeriai",
    "instructions": null,
    "categories": [
      "lunch",
      "dinner"
    ],
    "ingredients": [
      {
        "name": "malta mėsa",
        "quantity": null,
        "unit": null
      },
      {
        "name": "pomidoras",
        "quantity": null,
        "unit": null
      },
      {
        "name": "bandelės",
        "quantity": null,
        "unit": null
      },
      {
        "name": "kokios nors be gliuteno duonelės",
        "quantity": null,
        "unit": null
      }
    ]
  }
];
