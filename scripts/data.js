const UnobtainablePokemon = [
    'Mega Mewtwo X',
    'Mega Mewtwo Y',
    'Mega Medicham',
    'Mega Altaria',
    'Mega Banette',
    'Arceus (Fire)',
    'Arceus (Water)',
    'Arceus (Electric)',
    'Arceus (Grass)',
    'Arceus (Ice)',
    'Arceus (Fighting)',
    'Arceus (Poison)',
    'Arceus (Ground)',
    'Arceus (Flying)',
    'Arceus (Psychic)',
    'Arceus (Bug)',
    'Arceus (Rock)',
    'Arceus (Ghost)',
    'Arceus (Dragon)',
    'Arceus (Dark)',
    'Arceus (Steel)',
    'Arceus (Fairy)',
    'Eternamax Eternatus',
    'Dugtrio (Punk)',
    'Weepinbell (Fancy)',
    'Gengar (Punk)',
    'Onix (Rocker)',
    'Tangela (Pom-pom)',
    'Goldeen (Diva)',
    'XD001',
    'Furfrou (Heart)',
    /Gigantamax .+/
];

const EventDiscordClientPokemon = [
    'Bulbasaur (Clone)',
    'Spooky Bulbasaur',
    'Bulbasaur (Rose)',
    'Ivysaur (Clone)',
    'Spooky Ivysaur',
    'Ivysaur (Rose)',
    'Venusaur (Clone)',
    'Spooky Venusaur',
    'Venusaur (Rose)',
    'Charmander (Clone)',
    'Charmeleon (Clone)',
    'Charizard (Clone)',
    'Squirtle (Clone)',
    'Wartortle (Clone)',
    'Blastoise (Clone)',
    'Red Spearow',
    'Flying Pikachu',
    'Surfing Pikachu',
    'Pikachu (Gengar)',
    'Let\'s Go Pikachu',
    'Charity Chansey',
    'Let\'s Go Eevee',
    'Santa Snorlax',
    'Armored Mewtwo',
    'Spooky Togepi',
    'Surprise Togepi',
    'Spooky Togetic',
    'Blessing Blissey',
    'Grinch Celebi',
    'Handout Happiny',
    'Elf Munchlax',
    'Spooky Togekiss',
    'Rotom (Discord)',
    'Vivillon (Fancy)',
];

const pokemonRegionOverride = {

    // Magikarp
    ...Object.fromEntries(
        pokemonList.filter(p => Math.floor(p.id) == 129 && p.id > 129).map(p => [p.name, GameConstants.Region.alola])
    ),
    'Magikarp (Feebas)': GameConstants.Region.hoenn,

    // Pikachu
    ...Object.fromEntries(
        pokemonList.filter(p => Math.floor(p.id) == 25 && p.id > 25).map(p => [p.name, GameConstants.Region.alola])
    ),
    'Pinkan Pikachu': GameConstants.Region.kanto,
    'Detective Pikachu': GameConstants.Region.kanto,
    'Pikachu (World Cap)': GameConstants.Region.galar,

    // Mega and Primal
    ...Object.fromEntries(
        pokemonList.filter(p => p.name.startsWith('Mega ') || p.name.startsWith('Primal '))
            .map(p => [p.name, GameConstants.Region.kalos])
    ),

    'Hoppip (Chimecho)': GameConstants.Region.hoenn,
    'Meltan': GameConstants.Region.alola,
    'Melmetal': GameConstants.Region.alola,
    'Magearna (Original Color)': GameConstants.Region.galar,

    // Event / Discord / Client
    ...Object.fromEntries(EventDiscordClientPokemon.map(p => [p, -2]))
}

const DungeonListOverride = [
    {
        region: 0.1,
        name: 'Sevii Islands 123',
        dungeons: [
            ...Object.values(TownList)
                .filter(t => t.region == GameConstants.Region.kanto
                    && t.subRegion == GameConstants.KantoSubRegions.Sevii123
                    && t instanceof DungeonTown)
                .map(t => t.name)
        ]
    },
    {
        region: 2.1,
        name: 'Sevii Islands 4567',
        dungeons: [
            ...Object.values(TownList)
                .filter(t => t.region == GameConstants.Region.kanto
                    && t.subRegion == GameConstants.KantoSubRegions.Sevii4567
                    && t instanceof DungeonTown)
                .map(t => t.name)
        ]
    },
    {
        region: 2.2,
        name: 'Orre',
        dungeons: [
            ...Object.values(TownList)
                .filter(t => t.region == GameConstants.Region.hoenn
                    && t.subRegion == GameConstants.HoennSubRegions.Orre
                    && t instanceof DungeonTown)
                .map(t => t.name)
        ],
        hidden: true
    },
];

const GymListOverride = [
    {
        region: 2.1,
        name: 'Orange League',
        gyms: [ ...GameConstants.OrangeGyms ]
    },
    {
        region: 2.2,
        name: 'Orre',
        gyms: [ ...GameConstants.OrreGyms ],
        hidden: true
    },
    {
        region: 6.1,
        name: 'Magikarp Jump',
        gyms: [ ...GameConstants.MagikarpJumpGyms ]
    }
];

const RouteListOverride = [
    {
        region: 0,
        subRegion: 1,
        name: 'Sevii Islands 123',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.kanto
            && r.subRegion == GameConstants.KantoSubRegions.Sevii123)
    },
    {
        region: 0,
        displayRegion: 2,
        subRegion: 2,
        name: 'Sevii Islands 4567',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.kanto
            && r.subRegion == GameConstants.KantoSubRegions.Sevii4567)
    },
    {
        region: 2,
        subRegion: 1,
        displaySubRegion: 2,
        name: 'Orre',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.hoenn
            && r.subRegion == GameConstants.HoennSubRegions.Orre),
        hidden: true
    },
    {
        region: 6,
        subRegion: 4,
        name: 'Magikarp Jump',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.alola
            && r.subRegion == GameConstants.AlolaSubRegions.MagikarpJump)
    }
];

const friendSafariPokemon = [
    'Ivysaur',
    'Ivysaur (Clone)',
    'Spooky Ivysaur',
    'Ivysaur (Rose)',
    'Venusaur',
    'Venusaur (Clone)',
    'Spooky Venusaur',
    'Venusaur (Rose)',
    'Charmeleon',
    'Charmeleon (Clone)',
    'Charizard',
    'Charizard (Clone)',
    'Wartortle',
    'Wartortle (Clone)',
    'Blastoise',
    'Blastoise (Clone)',
    'Pinkan Pidgeotto',
    'Pikachu (Partner Cap)',
    'Surfing Pikachu',
    'Pinkan Pikachu',
    'Alolan Muk',
    'Magikarp Skelly',
    'Magikarp Calico (White, Orange)',
    'Magikarp Pink Dapples',
    'Magikarp Grey Diamonds',
    'Magikarp Purple Bubbles',
    'Magikarp Purple Patches',
    'Magikarp Brown Tiger',
    'Magikarp Orange Forehead',
    'Magikarp Black Mask',
    'Magikarp Saucy Blue',
    'Bayleef',
    'Meganium',
    'Quilava',
    'Typhlosion',
    'Croconaw',
    'Feraligatr',
    'Spiky-eared Pichu',
    'Spooky Togepi',
    'Surprise Togepi',
    'Jumpluff',
    'Forretress',
    'Flowering Celebi',
    'Grovyle',
    'Sceptile',
    'Combusken',
    'Blaziken',
    'Marshtomp',
    'Swampert',
    'Cradily',
    'Meta Groudon',
    'Grotle',
    'Torterra',
    'Monferno',
    'Infernape',
    'Prinplup',
    'Empoleon',
    'Staraptor',
    'Cranidos',
    'Rampardos',
    'Shieldon',
    'Bastiodon',
    'Burmy (Sand)',
    'Burmy (Trash)',
    'Wormadam (Plant)',
    'Wormadam (Sand)',
    'Wormadam (Trash)',
    'Mothim',
    'Cherrim (Overcast)',
    'Cherrim (Sunshine)',
    'Mismagius (Illusion)',
    'Handout Happiny',
    'Elf Munchlax',
    'Probopass',
    'Rotom (Discord)',
    'Giratina (Origin)',
    'Phione',
    'Servine',
    'Serperior',
    'Pignite',
    'Emboar',
    'Dewott',
    'Samurott',
    'Blitzle',
    'Darmanitan',
    'Cofagrigus',
    'Archeops',
    'Fraxure',
    'Quilladin',
    'Chesnaught',
    'Braixen',
    'Delphox',
    'Frogadier',
    'Greninja',
    'Ash-Greninja',
    'Floette (Eternal)',
    'Gogoat',
    'Aegislash (Blade)',
    'Goodra',
    'Dartrix',
    'Decidueye',
    'Torracat',
    'Incineroar',
    'Brionne',
    'Primarina',
    'Crabominable',
    'Lycanroc (Dusk)',
    'Magearna (Original Color)',
    'Naganadel',
    'Melmetal',
    'Thwackey',
    'Rillaboom',
    'Raboot',
    'Cinderace',
    'Drizzile',
    'Inteleon',
    'Toxtricity (Amped)',
    'Toxtricity (Low Key)',
    'Cursola',
    'Sirfetch\'d',
    'Runerigus',
    'Zacian (Crowned Sword)',
    'Zamazenta (Crowned Shield)',
    'Eternatus',
    'Kubfu',
    'Urshifu (Single Strike)',
    'Urshifu (Rapid Strike)',
];

module.exports = {
    UnobtainablePokemon,
    EventDiscordClientPokemon,

    pokemonRegionOverride,

    DungeonListOverride,
    GymListOverride,
    RouteListOverride,

    friendSafariPokemon,
}