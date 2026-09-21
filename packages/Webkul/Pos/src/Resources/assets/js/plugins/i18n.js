import ar from "@src/locales/ar.json";
import bn from "@src/locales/bn.json";
import ca from "@src/locales/ca.json";
import de from "@src/locales/de.json";
import en from "@src/locales/en.json";
import es from "@src/locales/es.json";
import fa from "@src/locales/fa.json";
import fr from "@src/locales/fr.json";
import he from "@src/locales/he.json";
import hi_IN from "@src/locales/hi_IN.json";
import it from "@src/locales/it.json";
import ja from "@src/locales/ja.json";
import nl from "@src/locales/nl.json";
import pl from "@src/locales/pl.json";
import pt_BR from "@src/locales/pt_BR.json";
import ru from "@src/locales/ru.json";
import sin from "@src/locales/sin.json";
import tr from "@src/locales/tr.json";
import uk from "@src/locales/uk.json";
import zh_CN from "@src/locales/zh_CN.json";
import { createI18n } from 'vue-i18n';
import { useCookies } from '@src/composable/cookies';

/**
 * Import the locales
 */
const locales = {
    ar, bn, ca, de, en, es, fa, fr, he, hi_IN, it, ja, nl, pl, pt_BR, ru, sin, tr, uk, zh_CN,
};

/**
 * Get the cookies
 */
const cookies = useCookies();

/**
 * Get the current locale from cookies
 * If the locale is not set, it defaults to English (en) with left-to-right direction (ltr).
 */
function getCurrentLocale() {
    try {
        const localeData = cookies.get('locale');

        return localeData ? JSON.parse(localeData) : { code: 'en', direction: 'ltr' };
    } catch (e) {
        return { code: 'en', direction: 'ltr' };
    }
}

const initialLocale = getCurrentLocale();

/**
 * Set the initial locale and direction
 */
document.documentElement.lang = initialLocale.code;
document.documentElement.dir = initialLocale.direction;

/**
 * Check for dark mode preference in cookies
 * If dark mode is enabled, add the 'dark' class to the document element.
 */
if (cookies.get('dark-mode')) {
    document.documentElement.classList.add('dark');
}

/**
 * Create & export a single shared instance
 */
const I18n = createI18n({
    locale: initialLocale.code,
    fallbackLocale: 'en',
    messages: locales,
    legacy: false,
});

/**
 * Default export for main.js
 */
export default I18n;
