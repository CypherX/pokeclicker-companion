const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH || null,
        args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto('https://pokeclicker.com');

    const optimalVitamins = await page.evaluate(() => {

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
                        res = { protein, calcium, carbos, eff };
                    }
                }
            }
            return res;
        }

        const list = pokemonList.filter(p => p.id > 0).reduce((obj, p) => {
            const arr = [];
            for (let r = 0; r <= GameConstants.MAX_AVAILABLE_REGION; r++) {
                const res = getBestVitamins(p, r);
                const vitamins = [res.protein, res.calcium, res.carbos];
                arr.push({
                    bestVitamins: vitamins,
                    breedingEfficiency: res.eff,
                    vitaminEggSteps: calcEggSteps(vitamins, p.eggCycles),
                    attackBonus: getBreedingAttackBonus(vitamins, p.attack),
                });
            }
            obj[p.id] = arr;
            return obj;
        }, {});

        return list;
    });

    fs.writeFileSync('./assets/data/optimalVitamins.json', JSON.stringify(optimalVitamins, null, 4));

    await browser.close();
})();
