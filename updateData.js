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

    page.evaluate(() => {
        App.start();
    });

    await page.waitForFunction(() => App.game &&  App.game.update && App.game.update.version);

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

    const forecastData = await page.evaluate(() => {

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const getUnownByDate = (date = new Date()) => {
            SeededDateRand.seedWithDate(date);
            return [
                getDailyUnown(date, AlphUnownList),
                getDailyUnown(date, TanobyUnownList),
                getDailyUnown(date, SolaceonUnownList),
            ];
        };

        const getDailyUnown = (date, unownList) => {
            SeededRand.seedWithDate(date);
            const shuffled = SeededRand.shuffleArray([...Array(unownList.length).keys()]);
            return shuffled.slice(0, 3).map(idx => unownList[idx]);
        };

        const getBerryDealsByDate = (date = new Date()) => {
            BerryDeal.generateDeals(date);
            return Object.values(BerryDeal.list).map(deals => {
                return [...deals()].map(deal => ({
                    berries: deal.berries,
                    item: {
                        amount: deal.item.amount,
                        itemName: deal.item.itemType.name,
                    },
                }));
            });
        };

        const getRegionalWeatherByDate = (date = new Date()) => {
            return [0, 4, 8, 12, 16, 20].map(hour => {
                const hourDate = new Date(date.setHours(hour, 0, 0, 0));
                const weather = [];
                for (let region = GameConstants.Region.kanto; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
                    weather.push(Weather.getWeather(region, hourDate));
                }
                return {
                    hour,
                    weather,
                };
            });
        };

        const getBoostedRoutesByDate = (date = new Date()) => {
            return [0, 8, 16].map(hour => {
                const hourDate = new Date(date.setHours(hour, 0, 0, 0));
                RoamingPokemonList.generateIncreasedChanceRoutes(hourDate);
                const routes = RoamingPokemonList.roamerGroups.filter((_, i) => i <= GameConstants.MAX_AVAILABLE_REGION).map((regionGroup, region) => {
                    return regionGroup.map((_, i) => {
                        const route = RoamingPokemonList.getIncreasedChanceRouteBySubRegionGroup(region, i)();
                        return route.routeName.replace('Route ', '');
                    });
                });
                return {
                    hour,
                    routes,
                }
            });
        };

        // previous day to the end of the following year
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date(now.getFullYear() + 2, 0, 1);

        const currentDate = new Date(startDate);
        const forecasts = {};

        while (currentDate <= endDate) {
            const data = {
                unown: getUnownByDate(currentDate),
                berryDeal: getBerryDealsByDate(currentDate),
                weather: getRegionalWeatherByDate(currentDate),
                boostedRoute: getBoostedRoutesByDate(currentDate),
            };
            forecasts[formatDate(currentDate)] = data;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return forecasts;
    });

    fs.writeFileSync('./assets/data/optimalVitamins.json', JSON.stringify(optimalVitamins));
    fs.writeFileSync('./assets/data/forecastData.json', JSON.stringify(forecastData));

    await browser.close();
})();
