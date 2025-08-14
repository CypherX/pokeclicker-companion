const UnobtainablePokemon = [
    'Mega Altaria',
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
    'Dugtrio (Punk)',
    'Weepinbell (Fancy)',
    'Gengar (Punk)',
    'Onix (Rocker)',
    'Tangela (Pom-pom)',
    'Goldeen (Diva)',
    'Pikachu (Rock Star)',
    'Pikachu (Belle)',
    'Pikachu (Pop Star)',
    'Pikachu (Ph. D.)',
    'Pikachu (Libre)',
    'Furfrou (Heart)',
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
    'Pikachu (Clone)',
    'Pikachu (Easter)',
    'Red Spearow',
    'Flying Pikachu',
    'Surfing Pikachu',
    'Pikachu (Gengar)',
    'Let\'s Go Pikachu',
    'Charity Chansey',
    'Santa Jynx',
    'Let\'s Go Eevee',
    'Santa Snorlax',
    'Snorlax (Snowman)',
    'Armored Mewtwo',
    'Spooky Togepi',
    'Togepi (Flowering Crown)',
    'Spooky Togetic',
    'Reindeer Stantler',
    'Blessing Blissey',
    'Grinch Celebi',
    'Torchic (Egg)',
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
    'Pikachu (Palaeontologist)': GameConstants.Region.kanto,
    'Detective Pikachu': GameConstants.Region.kalos,
    'Detective Raichu': GameConstants.Region.kalos,
    'Pikachu (World Cap)': GameConstants.Region.galar,

    // Valencian and Pinkan
    ...Object.fromEntries(
        pokemonList.filter(p => p.name.startsWith('Pinkan ') || p.name.startsWith('Valencian '))
            .map(p => [p.name, GameConstants.Region.hoenn])
    ),
    'Pink Butterfree': GameConstants.Region.hoenn,
    "Ash's Butterfree": GameConstants.Region.hoenn,
    'Pinkan Pikachu': GameConstants.Region.hoenn,
    'Crystal Onix': GameConstants.Region.hoenn,
    'Crystal Steelix': GameConstants.Region.hoenn,

    // Mega and Primal
    ...Object.fromEntries(
        pokemonList.filter(p => p.name.startsWith('Mega ') || p.name.startsWith('Primal '))
            .map(p => [p.name, GameConstants.Region.kalos])
    ),

    // Gigantamax
    ...Object.fromEntries(
        pokemonList.filter(p => p.name.startsWith('Gigantamax ') || p.name.startsWith('Eternamax'))
            .map(p => [p.name, GameConstants.Region.galar])
    ),

    'Meowth (Phanpy)': GameConstants.Region.johto,
    'Unown (E)': GameConstants.Region.sinnoh,
    'Unown (!)': GameConstants.Region.hoenn,
    'Unown (?)': GameConstants.Region.hoenn,
    'XD001': GameConstants.Region.unova,
    'Hoppip (Chimecho)': GameConstants.Region.hoenn,
    'Meltan': GameConstants.Region.alola,
    'Melmetal': GameConstants.Region.alola,
    'Ditto (Magikarp)': GameConstants.Region.alola,
    'Flowering Celebi': GameConstants.Region.galar,
    'Magearna (Original Color)': GameConstants.Region.galar,
    'Squad Leader Squirtle': GameConstants.Region.johto,
    'Deoxys (Green Core)': GameConstants.Region.unova,
    'Deoxys (Clone)': GameConstants.Region.unova,

    // Event / Discord / Client
    //...Object.fromEntries(EventDiscordClientPokemon.map(p => [p, -2]))
    'Bulbasaur (Rose)': GameConstants.Region.sinnoh,
    'Ivysaur (Rose)': GameConstants.Region.sinnoh,
    'Venusaur (Rose)': GameConstants.Region.sinnoh,
    'Pikachu (Gengar)': GameConstants.Region.hoenn,
    'Flying Pikachu': GameConstants.Region.kanto,
    'Surfing Pikachu': GameConstants.Region.kanto,
    'Let\'s Go Pikachu': GameConstants.Region.kanto,
    'Pikachu (Clone)': GameConstants.Region.kanto,
    'Pikachu (Easter)': GameConstants.Region.hoenn,
    'Togepi (Flowering Crown)': GameConstants.Region.hoenn,
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
        gyms: [
            ...GameConstants.OrreGyms
                .filter(gym => !GymList[gym].requirements.some((req) => req instanceof DevelopmentRequirement))
        ],
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
            && r.subRegion == GameConstants.HoennSubRegions.Orre)
    },
    {
        region: 6,
        subRegion: 4,
        name: 'Magikarp Jump',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.alola
            && r.subRegion == GameConstants.AlolaSubRegions.MagikarpJump)
    }
];

const obtainablePokemonList = (() => {
    const unobtainableList = UnobtainablePokemon.filter(p => typeof p === 'string');
    const unobtainableListRegex = UnobtainablePokemon.filter(p => typeof p === 'object').map(p => new RegExp(p));

    const pokemon = pokemonList.filter(p => {
        if (p.id < 1) {
            return false;
        }

        if (PokemonHelper.calcNativeRegion(p.name) > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (unobtainableList.includes(p.name) || unobtainableListRegex.some(r => r.test(p.name))) {
            return false;
        }

        return true;
    }).map(p => {
        p.nativeRegion = PokemonHelper.calcNativeRegion(p.name);
        p.obtainRegion = pokemonRegionOverride[p.name] || p.nativeRegion;

        return p;
    });

    return pokemon;
})();

const obtainablePokemonMap = obtainablePokemonList.reduce((map, p) => { map[p.id] = p; return map; }, {});

const shadowPokemon = (() => {
    const dungeons = Object.values(TownList)
        .filter(t => t.region == GameConstants.Region.hoenn
            && t.subRegion == GameConstants.HoennSubRegions.Orre
            && t instanceof DungeonTown
            && !t.requirements.some(req => req instanceof DevelopmentRequirement))
        .map(t => t.dungeon);

    const pokemon = [];
    dungeons.forEach(d => {
        d.enemyList.forEach(enemy => {
            if (enemy instanceof DungeonTrainer) {
                pokemon.push(...enemy.getTeam().filter(p => p.shadow == GameConstants.ShadowStatus.Shadow).map(p => p.name));
            }
        });
        d.bossList.forEach(boss => {
            if (boss instanceof DungeonTrainer) {
                pokemon.push(...boss.getTeam().filter(p => p.shadow == GameConstants.ShadowStatus.Shadow).map(p => p.name));
            }
        });
    });

    return new Set(pokemon);
})();

const validRegions = GameHelper.enumNumbers(GameConstants.Region).filter(region => region > GameConstants.Region.none && region <= GameConstants.MAX_AVAILABLE_REGION);
const validRegionNames = validRegions.map(region => GameConstants.camelCaseToString(GameConstants.Region[region]));
const roamerGroups =
    RoamingPokemonList.roamerGroups.map((rg, ri) => rg.map((sr, si) => ({ name: sr.name, region: ri, subRegionGroup: si })))
        .flat().filter((rg) => rg.region <= GameConstants.MAX_AVAILABLE_REGION);
const unownDungeonList = ['Ruins of Alph', 'Tanoby Ruins', 'Solaceon Ruins'];
const unownList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?'.split('');
const berryMasterPokemonLocations = [GameConstants.BerryTraderLocations['Pinkan Pokémon Reserve'], GameConstants.BerryTraderLocations['Secret Berry Shop']];
const berryMasterPokemonCosts = {
    [GameConstants.BerryTraderLocations['Pinkan Pokémon Reserve']]: [
        { pokemon: 'Pinkan Arbok', minCost: 40, maxCost: 60 },
        { pokemon: 'Pinkan Oddish', minCost: 20, maxCost: 40 },
        { pokemon: 'Pinkan Poliwhirl', minCost: 40, maxCost: 60 },
        { pokemon: 'Pinkan Geodude', minCost: 20, maxCost: 40 },
        { pokemon: 'Pinkan Weezing', minCost: 80, maxCost: 100 },
        { pokemon: 'Pinkan Scyther', minCost: 80, maxCost: 100 },
        { pokemon: 'Pinkan Electabuzz', minCost: 80, maxCost: 100 }
    ],
    [GameConstants.BerryTraderLocations['Secret Berry Shop']]: [
        { pokemon: 'Grotle (Acorn)', minCost: 80, maxCost: 100 }
    ]
};

module.exports = {
    UnobtainablePokemon,
    EventDiscordClientPokemon,

    pokemonRegionOverride,

    DungeonListOverride,
    GymListOverride,
    RouteListOverride,

    obtainablePokemonList,
    obtainablePokemonMap,
    shadowPokemon,
    validRegions,
    validRegionNames,
    roamerGroups,
    unownDungeonList,
    unownList,
    berryMasterPokemonLocations,
    berryMasterPokemonCosts,
}