/**
 * Regenerates the companion's precomputed data (assets/data/v<version>/) from the game.
 *
 * Loads the game in a headless browser, injects the generator from ./page/generateData.ts,
 * and writes its output. Run with Node 22.18+ (native TypeScript support):
 *
 *   node tools/updateData.mts [--url <game url>] [--out <output dir>]
 *
 * Set CHROMIUM_PATH to use a specific browser executable.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import * as esbuild from 'esbuild';
import puppeteer from 'puppeteer';

const { values: options } = parseArgs({
    options: {
        url: { type: 'string', default: 'https://pokeclicker.com' },
        out: { type: 'string' },
    },
});

const projectRoot = path.resolve(import.meta.dirname, '..');

/** Bundles the generator into a script that defines the CompanionDataGenerator global */
const bundleGenerator = async (): Promise<string> => {
    const result = await esbuild.build({
        entryPoints: [path.join(import.meta.dirname, 'page', 'generateData.ts')],
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'CompanionDataGenerator',
        target: 'es2020',
        logLevel: 'warning',
    });
    return result.outputFiles[0].text;
};

const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
});

try {
    const page = await browser.newPage();
    await page.goto(options.url);

    // Not awaited: the game keeps running after it has started
    void page.evaluate('App.start()');
    await page.waitForFunction('App.game && App.game.update && App.game.update.version');

    const version = await page.evaluate('App.game.update.version') as string;

    await page.addScriptTag({ content: await bundleGenerator() });
    const optimalVitamins = await page.evaluate('CompanionDataGenerator.generateOptimalVitamins()');
    const forecastData = await page.evaluate('CompanionDataGenerator.generateForecastData()');

    const outDir = options.out ?? path.join(projectRoot, 'assets', 'data', `v${version}`);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'optimalVitamins.json'), JSON.stringify(optimalVitamins));
    fs.writeFileSync(path.join(outDir, 'forecastData.json'), JSON.stringify(forecastData));

    console.log(`Wrote data for v${version} to ${outDir}`);
} finally {
    await browser.close();
}
