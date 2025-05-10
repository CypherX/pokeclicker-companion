const getBreedingAttackBonus = (vitaminsUsed, baseAttack) => {
    const attackBonusPercent = (GameConstants.BREEDING_ATTACK_BONUS + vitaminsUsed[GameConstants.VitaminType.Calcium]) / 100;
    const proteinBoost = vitaminsUsed[GameConstants.VitaminType.Protein];
    return (baseAttack * attackBonusPercent) + proteinBoost;
}

const calcEggSteps = (vitaminsUsed, eggCycles) => {
    const div = 300;
    const extraCycles = (vitaminsUsed[GameConstants.VitaminType.Calcium] + vitaminsUsed[GameConstants.VitaminType.Protein]) / 2;
    const steps = (eggCycles + extraCycles) * GameConstants.EGG_CYCLE_MULTIPLIER;
    return steps <= div ? steps : Math.round(((steps / div) ** (1 - vitaminsUsed[GameConstants.VitaminType.Carbos] / 70)) * div);
}

const getEfficiency = (vitaminsUsed, baseAttack, eggCycles) => {
    return (getBreedingAttackBonus(vitaminsUsed, baseAttack) / calcEggSteps(vitaminsUsed, eggCycles)) * GameConstants.EGG_CYCLE_MULTIPLIER;
}

const getBestVitamins = (pokemon, region) => {
    const baseAttack = pokemon.attack;
    const eggCycles = pokemon.eggCycles;
    // Add our initial starting eff here
    let res = {
        protein: 0,
        calcium: 0,
        carbos: 0,
        eff: getEfficiency([0,0,0], baseAttack, eggCycles),
    };
    vitaminsUsed = {};
    totalVitamins = (region + 1) * 5;
    // Unlocked at Unova
    carbos = (region >= GameConstants.Region.unova ? totalVitamins : 0) + 1;
    while (carbos-- > 0) {
        // Unlocked at Hoenn
        calcium = (region >= GameConstants.Region.hoenn ? totalVitamins - carbos: 0) + 1;
        while (calcium-- > 0) {
            protein = (totalVitamins - (carbos + calcium)) + 1;
            while (protein-- > 0) {
                const eff = getEfficiency([protein, calcium, carbos], baseAttack, eggCycles);
                // If the previous result is better than this, no point to continue
                if (eff < res.eff) break;
                // Push our data if same or better
                res = {
                    protein,
                    calcium,
                    carbos,
                    eff,
                };
            }
        }
    }
    return res;
}

const loadVitaminTrackerTable = ko.observable(false);
const highestRegion = ko.observable(GameConstants.Region.kanto);
const searchValue = ko.observable('');
const hidePokemonOptimalVitamins = ko.observable(false);
const hideUncaughtPokemon = ko.observable(false);
const hideShinyPokemon = ko.observable(false);

hidePokemonOptimalVitamins.subscribe((value) => localStorage.setItem('hidePokemonOptimalVitamins', +value));
hideUncaughtPokemon.subscribe((value) => localStorage.setItem('hideUncaughtPokemon', +value));
hideShinyPokemon.subscribe((value) => localStorage.setItem('hideShinyPokemon', +value));

const tableSort = ko.observable('id');
const tableSortDir = ko.observable(false);

const pokemonVitaminList = (() => {
    const pokemon = [...Companion.data.obtainablePokemonList];
    pokemon.forEach((p) => {
        p.baseAttackBonus = getBreedingAttackBonus([0,0,0], p.attack);
        p.baseEggSteps = calcEggSteps([0,0,0], p.eggCycles);
        p.regionVitamins = [];
        for (let i = 0; i <= GameConstants.MAX_AVAILABLE_REGION; i++) {
            const res = getBestVitamins(p, i);
            const vitamins = [res.protein, res.calcium, res.carbos];
            p.regionVitamins[i] = {
                bestVitamins: vitamins,
                breedingEfficiency: res.eff,
                vitaminEggSteps: calcEggSteps(vitamins, p.eggCycles),
                attackBonus: getBreedingAttackBonus(vitamins, p.attack),
            };
        }
    });

    return pokemon;
})();

const getVitaminPokemonList = ko.pureComputed(() => {
    if (!loadVitaminTrackerTable()) { // wait until document ready to load
        return [];
    }

    const region = highestRegion();
    const saveLoaded = SaveData.isLoaded();
    const pokemon = getFilteredVitaminList();
    pokemon.forEach((p) => {
        const regionVitamins = p.regionVitamins[region];
        p.bestVitamins = regionVitamins.bestVitamins;
        p.breedingEfficiency = regionVitamins.breedingEfficiency;
        p.vitaminEggSteps = regionVitamins.vitaminEggSteps;
        p.attackBonus = regionVitamins.attackBonus;
        p.vitaminText = p.bestVitamins.map((v, i) => {
            //return saveLoaded ? `${Companion.partyList()[p.id]?.vitaminsUsed[i]() ?? 0} | ${v}` : `${v}`;
            if (!saveLoaded) {
                return v;
            }

            const current = Companion.partyList()[p.id]?.vitaminsUsed[i]() ?? 0;
            return current === v ? v : `${current} <span class="text-warning">(${v})</span>`;
        });
    });

    return pokemon;
});

const getFilteredVitaminList = () => {
    const region = highestRegion();
    const searchVal = searchValue()?.toLowerCase();

    return pokemonVitaminList.filter((pokemon) => {
        if (pokemon.obtainRegion > region) {
            return false;
        }

        if (searchVal) {
            if (!pokemon.id.toString().includes(searchVal)
                && !pokemon.name.toLowerCase().includes(searchVal)) {
                return false;
            }
        }

        const partyPokemon = Companion.partyList()[pokemon.id];
        if (SaveData.isLoaded() && hideUncaughtPokemon() && !partyPokemon) {
            return false;
        }

        if (partyPokemon?.shiny && hideShinyPokemon()) {
            return false;
        }

        if (hidePokemonOptimalVitamins()) {
            if (partyPokemon && GameHelper.enumNumbers(GameConstants.VitaminType).every((v) => pokemon.regionVitamins[region].bestVitamins[v] == partyPokemon.vitaminsUsed[v]())) {
                return false;
            }
        }

        return true;
    });
};

const getSortedVitaminList = ko.pureComputed(() => {
    const sortOption = tableSort();
    const sortDirection = tableSortDir();
    return Object.values(getVitaminPokemonList()).sort(compareBy(sortOption, sortDirection));
});

const getTotalVitaminsNeeded = ko.pureComputed(() => {
    const region = highestRegion();
    const amountNeeded = pokemonVitaminList.reduce((sum, p) => {
        if (p.obtainRegion <= region) {
            const bestVitamins = p.regionVitamins[region].bestVitamins;
            bestVitamins.forEach((count, i) => sum[i] += count);
        }
        return sum;
    }, [0, 0, 0]);

    const amountOwned = [0, 0, 0];

    if (SaveData.isLoaded()) {
        GameHelper.enumStrings(GameConstants.VitaminType).forEach((v, i) => {
            amountOwned[i] += SaveData.file().player._itemList[v] ?? 0;
        });

        SaveData.file().save.party.caughtPokemon.forEach((pokemon) => {
            const vitaminsUsed = pokemon[PartyPokemonSaveKeys['vitaminsUsed']];
            Object.values(vitaminsUsed).forEach((n, i) => amountOwned[i] += n);
        });
    }

    const totalPriceAll = amountNeeded.reduce((sum, count, i) => {
        return sum += ItemList[GameConstants.VitaminType[i]].totalPrice(count);
    }, 0);

    const totalPriceOwned = amountOwned.reduce((sum, count, i) => {
        return sum += ItemList[GameConstants.VitaminType[i]].totalPrice(count);
    }, 0);

    amountNeeded.forEach((v, i) => {
        amountNeeded[i] = Math.max(0, v - amountOwned[i]);
    });

    return { vitaminCount: amountNeeded, totalCost: Math.max(0, totalPriceAll - totalPriceOwned) };
});

const exportData = () => {
    const isSaveLoaded = SaveData.isLoaded();
    const headers = [ '#', 'Pokemon', 'Type 1', 'Type 2' ];
    if (isSaveLoaded) {
        headers.push('Caught', 'Shiny');
    }
    headers.push('Native Region', 'Base Attack', 'Base Attack Bonus', 'Base Egg Steps');
    GameHelper.enumStrings(GameConstants.VitaminType).forEach((v) => {
        if (isSaveLoaded) {
            headers.push(`Current ${v}`);
        }
        headers.push(`Optimal ${v}`);
    });
    headers.push('Vitamin Attack Bonus', 'Vitamin Egg Steps', 'Breeding Efficiency');

    const data = [];
    getSortedVitaminList().forEach((p) => {
        const types = pokemonMap[p.id].type;
        const row = [ p.id, `"${p.name}"`, PokemonType[types[0]], PokemonType[types[1] ?? -1] ];

        if (isSaveLoaded) {
            row.push(
                Companion.partyList()[p.id] ? 1 : 0,
                Companion.partyList()[p.id]?.shiny ? 1 : 0
            );
        }

        row.push(
            GameConstants.camelCaseToString(GameConstants.Region[p.nativeRegion]),
            p.attack,
            p.baseAttackBonus,
            p.baseEggSteps
        );

        p.bestVitamins.forEach((v, i) => {
            if (isSaveLoaded) {
                row.push(Companion.partyList()[p.id]?.vitaminsUsed[i]() ?? 0);
            }
            row.push(v);
        });

        row.push(
            p.attackBonus,
            p.vitaminEggSteps,
            p.breedingEfficiency
        );

        data.push(row);
    });

    Util.exportToCsv(headers, data, `VitaminTracker-${Date.now()}.csv`);
};

function compareBy(sortOption, direction) {
    return function (a, b) {
        let res, dir = direction ? -1 : 1;

        const aValue = getSortValue(sortOption, a);
        const bValue = getSortValue(sortOption, b);
        
        if (aValue == bValue) {
            return a.id - b.id;
        } else if (aValue < bValue) {
            res = -1;
        } else if (aValue > bValue) {
            res = 1;
        } else {
            res = 0;
        }

        return res * dir;
    }
}

function getSortValue(sortOption, pokemon) {
    switch (sortOption) {
        case 'name':
            return pokemon.name;
        case 'base-attack':
            return pokemon.attack;
        case 'base-bonus':
            return pokemon.baseAttackBonus;
        case 'base-steps':
            return pokemon.baseEggSteps;
        case 'vitamin-bonus':
            return pokemon.attackBonus;
        case 'vitamin-steps':
            return pokemon.vitaminEggSteps;
        case 'breeding-efficiency':
            return pokemon.breedingEfficiency;
        case 'id':
        default:
            return pokemon.id;
    }
}

$(document).ready(() => {
    if (+localStorage.getItem('hidePokemonOptimalVitamins')) {
        hidePokemonOptimalVitamins(true);
    }

    if (+localStorage.getItem('hideUncaughtPokemon')) {
        hideUncaughtPokemon(true);
    }

    if (+localStorage.getItem('hideShinyPokemon')) {
        hideShinyPokemon(true);
    }

    $(document).on('click', '#vitaminTrackerTable thead th.sortable', (e) => {
        const sort = e.currentTarget.dataset.sort;
        if (tableSort() == sort) {
            tableSortDir(!tableSortDir());
        } else {
            tableSort(sort);
            tableSortDir(true);
        }
    });

    loadVitaminTrackerTable(true);
});

module.exports = {
    highestRegion,
    searchValue,
    hidePokemonOptimalVitamins,
    hideUncaughtPokemon,
    hideShinyPokemon,

    getSortedVitaminList,
    getTotalVitaminsNeeded,

    exportData,
};