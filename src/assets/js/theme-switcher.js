
const themeEl = document.getElementById('theme-link');
const themeBtnEl = document.getElementById('theme-switch');

const themeStore = new Store({
    configName: 'theme-settings',
    defaults: {
        theme: 'assets/css/light-theme.css',
        buttonVal: false
    }
});

const userTheme = themeStore.get('theme');
const userBtnVal = themeStore.get('buttonVal');

themeBtnEl.addEventListener('click', () => {
    if (!themeStore.get('buttonVal')) {
        themeEl.href = 'assets/css/dark-theme.css';
        themeStore.set('theme', 'assets/css/dark-theme.css');
        themeStore.set('buttonVal', true);
    } else {
        themeEl.href = 'assets/css/light-theme.css'
        themeStore.set('theme', 'assets/css/light-theme.css');
        themeStore.set('buttonVal', false);
    }
})

document.addEventListener("DOMContentLoaded", event => {
    themeEl.href = userTheme;
    themeBtnEl.checked = userBtnVal;
});