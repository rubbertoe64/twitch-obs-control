// import { RefreshableAuthProvider, StaticAuthProvider } from "twitch-auth";
const {RefreshableAuthProvider, StaticAuthProvider} = require('twitch-auth');
const { promises } = require('fs');
const fs = promises;

const dialog = document.querySelector('dialog');
const showDialogButton = document.querySelector('#show-dialog');
const twitchSubmitEl = document.getElementById('twitch-api-save');
const clientIdEl = document.getElementById('twitch-api-client-id-input');
const clientSecretEl = document.getElementById('twitch-api-client-secret-input');

const twitchApiStore = new Store({
    configName: 'twitch-api',
    defaults: {
        'twitch-config': {
            clientId: '',
            clientSecret: ''
        }
    }
});

let { clientId, clientSecret } = twitchApiStore.get('twitch-config');

document.addEventListener("DOMContentLoaded", event => {
    clientIdEl.value = clientId;
    clientSecretEl.value = clientSecret;
});

if (! dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}
showDialogButton.addEventListener('click', function() {
  dialog.showModal();
});
dialog.querySelector('.close').addEventListener('click', function() {
  dialog.close();
});

twitchSubmitEl.addEventListener('click', () => {
    const apiConfig = {
        clientId: clientIdEl.value,
        clientSecret: clientSecretEl.value
    }
    twitchApiStore.set('twitch-config', apiConfig);
    dialog.close();
});

connectToTwitch = () => {
    console.log('working');
}



