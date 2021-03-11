
const obs = new OBSWebSocket();

let currentScenes;
let sceneMap = new Map();
let sourcesMap = new Map();

const store = new Store({
  configName: 'obs-proxy-settings',
  defaults: {
    websocket: {
      port: 4444,
      password: 'changeme'
    },
    'twitch-user': ''
  }
});

const twitchApiStore = new Store({
  configName: 'twitch-api',
  defaults: {
      'twitch-config': {
          clientId: '98a3op8i9g48ppw3ji60pw6qlcix52',
          clientSecret: 'pn0kurovm4ri43z0lv9vpr6i15buyr',
          oauthToken: ''
      }
  }
});

const pointsSourceToggleStore = new Store({
  configName: 'points-source-toggle-mapping',
  defaults: {
    'points-source': JSON.stringify(new Map())
  }
});


const twitchUserEl = document.getElementById("twitch-user");
const wsPort = document.getElementById("websocket-port")
const wsPass = document.getElementById("websocket-password")
const snackbarContainer = document.querySelector("#demo-snackbar-example");
const obsConnectBut = document.getElementById("obsConnect");
const rewardsElement = document.getElementById('rewards');
const obsDisconnectBut = document.getElementById("obsDisconnect");
const obsScenesElement = document.getElementById('scenes');
const obsSourcesElement = document.getElementById('sources');
const timedElement = document.getElementById('time-input');
const dialog = document.querySelector('dialog');
const showDialogButton = document.querySelector('#show-dialog');
const twitchSaveDialogEl = document.getElementById('twitch-api-save');
const clientIdEl = document.getElementById('twitch-api-client-id-input');
const clientSecretEl = document.getElementById('twitch-api-client-secret-input');
const oauthTokenEl = document.getElementById('twitch-oauth-input');
const connectTwitchBtnEl = document.getElementById('connect-twitch-btn');
const disconnectTwtichBtnEl = document.getElementById('disconnect-twitch-btn');
const pointsSourceListEl = document.getElementById('points-source-list');


let { port, password } = store.get("websocket");
let savedTwitchUser = store.get('twitch-user');
let { clientId, clientSecret, oauthToken } = twitchApiStore.get('twitch-config');

if (! dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}
showDialogButton.addEventListener('click', function() {
  dialog.showModal();
});
dialog.querySelector('.close').addEventListener('click', function() {
  dialog.close();
});

twitchSaveDialogEl.addEventListener('click', () => {
  const apiConfig = {
    clientId: clientIdEl.value,
    clientSecret: clientSecretEl.value,
    oauthToken: oauthTokenEl.value
  }
  twitchApiStore.set('twitch-config', apiConfig);
  dialog.close();
});

document.addEventListener("DOMContentLoaded", event => {
  twitchUserEl.value = savedTwitchUser;
  wsPort.value = port;
  wsPass.value = password;
  clientIdEl.value = clientId;
  clientSecretEl.value = clientSecret;
  oauthTokenEl.value = oauthToken;
})

save = () => {
  store.set('twitch-user', twitchUserEl.value);
  store.set('websocket', {port: wsPort.value, password: wsPass.value});
  const data = {
		message: "✅ OBS Websocket Settings Saved",
		timeout: 2000
  }
	snackbarContainer.MaterialSnackbar.showSnackbar(data)
}

/* OBS Section */

connectObs = () => {
  const { port, password } = store.get("websocket")
  obs.connect({ address: `localhost:${port}`, password: `${password}` }).then(() => {
      const data = {
				message: "👍🏼 OBS Connected Successfully",
				timeout: 2000,
			}
      snackbarContainer.MaterialSnackbar.showSnackbar(data)
      this.toggleConnected();
      return obs.send('GetSceneList');
    })
    .then(data => {
      currentScenes = data.scenes;
      data.scenes.forEach(scene => {

        sceneMap.set(scene.name, scene);
      });
    })
    .then(data => {
      setScenesList();
    })

	// You must add this handler to avoid uncaught exceptions.
	obs.on("error", (err) => {
    console.error("socket error:", err)
    const data = {
			message: err,
			timeout: 2000,
		}
		snackbarContainer.MaterialSnackbar.showSnackbar(data)
	})
}

disconnectObs = () => {
  obs.disconnect();
  const data = {
		message: "👋🏼 OBS Disconnected Successfully 👋🏼",
		timeout: 2000,
	}
	snackbarContainer.MaterialSnackbar.showSnackbar(data)
	this.toggleConnected()
}

let isConnected = false;
toggleConnected = () => {
  isConnected = !isConnected;
  if ( isConnected ) {
    obsConnectBut.classList.add("hidden");
    obsDisconnectBut.classList.remove("hidden");
  } else {
    obsConnectBut.classList.remove("hidden");
		obsDisconnectBut.classList.add("hidden");
  }
}

/* Twitch Section */

let isTwitchConnected = false;
toggleTwitchConnected = () => {
  isTwitchConnected = !isTwitchConnected;
  if ( isTwitchConnected ) {
    connectTwitchBtnEl.classList.add('hidden');
    disconnectTwtichBtnEl.classList.remove('hidden');
  } else {
    connectTwitchBtnEl.classList.remove('hidden');
    disconnectTwtichBtnEl.classList.add('hidden');
  }

}

connectTwitch = async () => {
  ComfyJS.Init(savedTwitchUser, `${oauthToken}`, savedTwitchUser);
  getRewards();
  toggleTwitchConnected();
  startTwitchListener();
}

disconnectTwitch = () => {
  console.log('Twitch Disconnected');
  ComfyJS.Disconnect();
  toggleTwitchConnected();
}

getRewards = async () => {
  let totalRewards = [];
  let channelRewards = await ComfyJS.GetChannelRewards(clientId);
  setRewardsList(channelRewards);
}
  
startTwitchListener = () => {
  ComfyJS.onReward = ( user, reward, cost, extra ) => {
    console.log( user + " redeemed " + reward );
    let currentPointsSourceMap = getPointsSourceMap();
    if ( currentPointsSourceMap.has(reward) ) {
      const currentSceneSource = currentPointsSourceMap.get(reward);
      if (currentSceneSource) {
        if (currentSceneSource.time === 0) {
          toggleSpecifiedSource(currentSceneSource.scene, currentSceneSource.source);
        } else {
          timedToggleSource(currentSceneSource.scene, currentSceneSource.source, currentSceneSource.time)
        }
      }
    }
  }
}

mapSourceReward = () => {
  const currentReward = rewardsElement.value;
  const sceneVal = obsScenesElement.value;
  const sourceVal = obsSourcesElement.value;
  const numVal = parseInt(timedElement.value) * 1000;
  const timedVal = numVal === 0 ? 0 : numVal + 1000;
  if (currentReward && sceneVal && sourceVal) {
    let currentPointsSourceMap = getPointsSourceMap();
    currentPointsSourceMap.set(currentReward, {scene: sceneVal, source: sourceVal, time: timedVal});
    setPointsSourceMap(currentPointsSourceMap);
  } else {
    const data = {
      message: "🛑 Please make sure all services are connected 🛑",
      timeout: 2000,
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(data)
  }
}

getPointsSourceMap = () => {
  const currentPointsSource = pointsSourceToggleStore.get('points-source');
  if (currentPointsSource && Object.keys(currentPointsSource).length > 0 && currentPointsSource !== '{}') {
    return new Map(JSON.parse(currentPointsSource));
  } else {
    return new Map();
  }
}

setPointsSourceMap = (map) => {
  pointsSourceToggleStore.set('points-source', JSON.stringify(Array.from(map.entries())));
  console.log('pointsSourceToggleStore', pointsSourceToggleStore);
}

/* Setting Scenes */

setScenesList = () => {
  let firstScene;
  obsScenesElement.innerHTML = '';
  currentScenes.forEach((scene, index) => {
    const optionEl = document.createElement("option");
    optionEl.value = scene.name;
    if ( index === 0 ) {
      optionEl.selected = true;
      firstScene = scene.name;
    }
    const text = document.createTextNode(scene.name);
    // scene also has name of sources
    optionEl.appendChild(text);
    obsScenesElement.appendChild(optionEl);
    scene.sources.forEach(source => {
      sourcesMap.set(`${scene.name}-${source.name}`, source);
    })
  });
  setSourceList(firstScene);
}

  setSourceList = (scene) => {
    obsSourcesElement.innerHTML = '';
    const selectedScene = sceneMap.get(scene);
    const selectedSources = selectedScene.sources;
    selectedSources.forEach(source => {
      const optionEl = document.createElement("option");
      optionEl.value = source.name;
      const text = document.createTextNode(source.name);
      // scene also has name of sources
      optionEl.appendChild(text);
      obsSourcesElement.appendChild(optionEl);
    })
  }

  setRewardsList = (rewards) => {
    rewardsElement.innerHTML = '';
    rewards.forEach(reward => {
      const optionEl = document.createElement("option");
      optionEl.value = reward.title;
      const text = document.createTextNode(`${reward.title} (${reward.cost})`);
      // scene also has name of sources
      optionEl.appendChild(text);
      rewardsElement.appendChild(optionEl);
    })
  }

  onSceneSelectionChange = () => {
    const selectedSceneValue = obsScenesElement.value;
    setSourceList(selectedSceneValue);
  }

  onSourceSelectionChange = () => {
    const selectedSourceValue = obsSourcesElement.value;
    console.log('source selected', selectedSourceValue);
  }

  /* OBS Toggling */

  testToggleSource = () => {
    console.log('map', getPointsSourceMap());
    const sceneVal = obsScenesElement.value;
    const sourceVal = obsSourcesElement.value;
    timedToggleSource(sceneVal, sourceVal, 3000);
  }
  
  toggleSpecifiedSource = (scene, source) => {
    const key = `${scene}-${source}`;
    const selectedSource = sourcesMap.get(key);
    let isRendered = selectedSource.render;
    isRendered = !isRendered;
    selectedSource.render = isRendered;
    sourcesMap.set(key, selectedSource);
    toggleSource(source, isRendered);
  }
  
  toggleSource = (source, toggled) => {
    obs.sendCallback('SetSceneItemRender', {
      source: source,
      render: toggled
    }, (err, res) => {
      if (err) console.log(err);
    })
  }

  timedToggleSource = (scene, source, time) => {
    const key = `${scene}-${source}`;
    const selectedSource = sourcesMap.get(key);
    toggleSource(source, false);
    setTimeout(() => {
      toggleSource(source, true);
      setTimeout(() => toggleSource(source, false), time);
    }, 500);
    selectedSource.render = false;
    sourcesMap.set(key, selectedSource);
  }

  rubbertoeSourceToggling = () => {
    if (sourcesMap.get('Nintendo Switch-some sound').render) {
      toggleSource('some sound', false);
    }
    toggleSource('some sound', true);
    setTimeout(() => toggleSource('some sound', false), 4000);
    setInterval(() => {
      console.log('looping');
    }, 5000);
  }

  getToken = () => {
    shell.openExternal('https://twitchapps.com/tokengen/');
  }


  /** TODO 
   * 
   * Use store to store the set auto toggleable list
   * make crud method to 
   * 
   * save list in an array
   * 
   * martin livesplit - martin
   * 
   * RidersU
   * 
   */



