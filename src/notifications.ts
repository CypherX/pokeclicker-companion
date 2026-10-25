import { notify } from './util';

/** One-off announcements, shown until dismissed or expired */
interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
    timeout: number;
    expires: Date;
}

const announcements: Announcement[] = [
    {
        id: 'newfeatbattlecalculator',
        title: 'New Feature',
        message: 'Check out the new Battle Calculator on the Tools tab to see if your party is ready to take on their next challenge!',
        type: 'info',
        timeout: 30000,
        expires: new Date(2024, 2, 22),
    },
    {
        id: 'newforecastsummary',
        title: 'Daily Summary',
        message: `Check out the <a class="text-dark text-decoration-underline" href="/#!Forecast/Summary" onclick="$('#tab-forecasts').click(); $('#tab-summary').click(); return false;">Daily Summary</a> on the Forecasts tab for a quick look at daily occurrences all in one place!`,
        type: 'info',
        timeout: 30000,
        expires: new Date(2024, 9, 16),
    },
    {
        id: 'pastesupport',
        title: 'Paste Support',
        message: `You can now paste your save file (the content copied to clipboard or the file itself) anywhere on the Companion and it will detect and load that file.`,
        type: 'info',
        timeout: 30000,
        expires: new Date(2025, 8, 1),
    },
    {
        id: 'routesandgymsupdates',
        title: 'UI/UX Updates',
        message: `The [Routes], [Dungeons], and [Gyms] sections of the <strong>My Save → Statistics & More</strong> page has been updated with a new look.`,
        type: 'info',
        timeout: 30000,
        expires: new Date(2025, 8, 5),
    },
    {
        id: 'newfeatbfsim',
        title: 'New Feature',
        message: `Check out the new Battle Frontier Simulator on the Tools tab! Make suggestions or report issues to <span class="text-warning fw-bold">Time</span> in the PokéClicker discord server.`,
        type: 'primary',
        timeout: 30000,
        expires: new Date(2025, 11, 1),
    },
];

const SEEN_KEY = 'seenNotifications';

const getSeen = (): string[] => JSON.parse(localStorage.getItem(SEEN_KEY) as string) || [];

export const createNotifications = (): void => {
    const seen = getSeen();
    announcements
        .filter(n => Date.now() < +n.expires && !seen.includes(n.id))
        .forEach(n => {
            notify({
                message: n.message,
                type: n.type,
                timeout: n.timeout,
                title: n.title,
                onHideFunction: () => {
                    localStorage.setItem(SEEN_KEY, JSON.stringify([...getSeen(), n.id]));
                },
            });
        });
};
