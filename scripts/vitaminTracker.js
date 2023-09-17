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

hidePokemonOptimalVitamins.subscribe((value) => localStorage.setItem('hidePokemonOptimalVitamins', +value));

const getVitaminPokemonList = ko.pureComputed(() => {
    if (!loadVitaminTrackerTable()) {
        return [];
    }

    const region = highestRegion();
    const pokemon = [...Companion.data.obtainablePokemonList].filter((p) => p.nativeRegion <= region);

    pokemon.forEach((p) => {
        p.baseAttackBonus = getBreedingAttackBonus([0,0,0], p.attack);
        p.baseEggSteps = calcEggSteps([0,0,0], p.eggCycles);
        const vitamins = getBestVitamins(p, region);
        p.bestVitamins = [vitamins.protein, vitamins.calcium, vitamins.carbos];
        p.breedingEfficiency = vitamins.eff;
        p.vitaminEggSteps = calcEggSteps(p.bestVitamins, p.eggCycles);
        p.attackBonus = getBreedingAttackBonus(p.bestVitamins, p.attack);
    });
    return pokemon;
});

const getTotalVitaminsNeeded = ko.pureComputed(() => {
    const vitaminCount = [0, 0, 0];

    getVitaminPokemonList().forEach((p) => {
        p.bestVitamins.forEach((count, i) => vitaminCount[i] += count);
    });

    const totalPrice = vitaminCount.reduce((sum, count, i) => {
        return sum += ItemList[GameConstants.VitaminType[i]].totalPrice(count);
    }, 0);

    return { vitaminCount: vitaminCount, totalCost: totalPrice };
});

const hideFromVitaminTrackerTable = (pokemon) => {
    return ko.pureComputed(() => {
        const searchVal = searchValue();
        if (searchVal) {
            if (!pokemon.id.toString().includes(searchVal)
                && !pokemon.name.toLowerCase().includes(searchVal)) {
                return true;
            }
        }

        if (hidePokemonOptimalVitamins()) {
            const partyPokemon = Companion.partyList()[pokemon.id];
            if (partyPokemon && GameHelper.enumNumbers(GameConstants.VitaminType).every((v) => pokemon.bestVitamins[v] == partyPokemon.vitaminsUsed[v]())) {
                return true;
            }
        }

        return false;
    });
};

$(document).ready(() => {
    if (+localStorage.getItem('hidePokemonOptimalVitamins')) {
        hidePokemonOptimalVitamins(true);
    }

    loadVitaminTrackerTable(true);
});

module.exports = {
    highestRegion,
    searchValue,
    hidePokemonOptimalVitamins,

    getVitaminPokemonList,
    hideFromVitaminTrackerTable,
    getTotalVitaminsNeeded,
};