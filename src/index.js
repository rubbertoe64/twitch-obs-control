// const ExpressServer = require('./assets/js/server');
const obs = new OBSWebSocket();

let currentScenes;
let sceneMap = new Map();
let sourcesMap = new Map();
let groupMap = new Map();


const store = new Store({
  configName: 'obs-proxy-settings',
  defaults: {
    websocket: {
      port: 4444,
      password: ''
    },
    'twitch-user': ''
  }
});

const twitchApiStore = new Store({
  configName: 'twitch-api',
  defaults: {
      'twitch-config': {
          clientId: '98a3op8i9g48ppw3ji60pw6qlcix52',
          // clientSecret: '',
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

const sourceGroupStore = new Store({
  configName: 'source-group',
  defaults: {
    group: JSON.stringify(new Map())
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
const groupElement = document.getElementById('group-input');
const dialog = document.querySelector('dialog');
const showDialogButton = document.querySelector('#show-dialog');
const twitchSaveDialogEl = document.getElementById('twitch-api-save');
const clientIdEl = document.getElementById('twitch-api-client-id-input');
// const clientSecretEl = document.getElementById('twitch-api-client-secret-input');
const oauthTokenEl = document.getElementById('twitch-oauth-input');
const connectTwitchBtnEl = document.getElementById('connect-twitch-btn');
const disconnectTwtichBtnEl = document.getElementById('disconnect-twitch-btn');
const pointsSourceListEl = document.getElementById('points-source-list');
const copyTextEl = document.querySelector('.copy');


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

copyTextEl.onclick = () => {
  document.execCommand('copy');
  console.log('copied');
}

copyTextEl.addEventListener('copy', event => {
  event.preventDefault();
  if (event.clipboardData) {
    event.clipboardData.setData('text/plain', copyTextEl.textContent);
    console.log(event.clipboardData.getData("text"));
  }
})

twitchSaveDialogEl.addEventListener('click', () => {
  oauthToken = oauthTokenEl.value;
  clientId = clientIdEl.value;
  const apiConfig = {
    clientId: clientIdEl.value,
    // clientSecret: clientSecretEl.value,
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
  // clientSecretEl.value = clientSecret;
  oauthTokenEl.value = oauthToken;
  setRewardPointsList(getPointsSourceMap());
  // const app = new ExpressServer(5000);
  // app.start();
})

save = () => {
  port = wsPort.value;
  password = wsPass.value;
  savedTwitchUser = twitchUserEl.value;
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

ComfyJS.onConnected = () => {
  const data = {
		message: "👍🏼 Twitch Connected Successfully ",
		timeout: 2000
  }
	snackbarContainer.MaterialSnackbar.showSnackbar(data)
}


connectTwitch = async () => {
  ComfyJS.Init(savedTwitchUser, `${oauthToken}`, savedTwitchUser);
  getRewards();
  toggleTwitchConnected();
  startTwitchListener();
}

disconnectTwitch = () => {
  ComfyJS.Disconnect();
  const data = {
		message: "👋🏼 Twitch Disconnected Successfully 👋🏼",
		timeout: 2000
  }
	snackbarContainer.MaterialSnackbar.showSnackbar(data)
  toggleTwitchConnected();
}

getRewards = async () => {
  let channelRewards = await ComfyJS.GetChannelRewards(clientId);
  setRewardsList(channelRewards);
}
  
startTwitchListener = () => {
  ComfyJS.onReward = ( user, reward, cost, extra ) => {
    let currentPointsSourceMap = getPointsSourceMap();
    if ( currentPointsSourceMap.has(reward) ) {
      const currentSceneSource = currentPointsSourceMap.get(reward);
      if (currentSceneSource) {
        const group = currentSceneSource.group;
        if (group === 'None') {
          if (currentSceneSource.time === 0) {
            toggleSpecifiedSource(currentSceneSource.source);
          } else {
            timedToggleSource(currentSceneSource.source, currentSceneSource.time)
          }
        } else {
          toggleGroup(group, reward);
        }
      }
    }
  }
}

toggleGroup = (group, reward) => {
  let currentPointsSourceMap = getPointsSourceMap();
  const currentGroupMap = getStoreMap(sourceGroupStore, 'source-group');
  const groupArray = JSON.parse(currentGroupMap.get(group));
  groupArray.forEach( item => {
    const currentSceneSource = currentPointsSourceMap.get(item);
    if ( item !== reward ) {
      toggleOffSpecifiedSource( currentSceneSource.source);
    } else {
      toggleSpecifiedSource(currentSceneSource.source);
    }
  });

}

mapSourceReward = () => {
  const currentReward = rewardsElement.value;
  const sceneVal = obsScenesElement.value;
  const sourceVal = obsSourcesElement.value;
  const numVal = parseFloat(timedElement.value) * 1000;
  const timedVal = numVal === 0 ? 0 : numVal + 1000;
  const groupVal = groupElement.value ? groupElement.value : 'None';
  if (currentReward && sceneVal && sourceVal && currentReward !== 'not-connected' && sceneVal !== 'not-connected' && sourceVal !== 'not-connected' ) {
    let currentPointsSourceMap = getPointsSourceMap();
    currentPointsSourceMap.set(currentReward, {scene: sceneVal, source: sourceVal, time: timedVal, group: groupVal});
    setPointsSourceMap(currentPointsSourceMap);
  } else {
    const data = {
      message: "🛑 Please make sure all services are connected 🛑",
      timeout: 4000,
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(data)
  }
}

removeSingleSourceReward = key => {
  let currentPointsSourceMap = getPointsSourceMap();
  currentPointsSourceMap.delete(key);
  setPointsSourceMap(currentPointsSourceMap);
}

getPointsSourceMap = () => {
  return getStoreMap(pointsSourceToggleStore, 'points-source');
}

setPointsSourceMap = (map) => {
  setStoreMap(pointsSourceToggleStore, 'points-source', map);
  setRewardPointsList(getPointsSourceMap());
}

getStoreMap = (store, key) => {
  const currentPointsSource = store.get(key);
  if (currentPointsSource && Object.keys(currentPointsSource).length > 0 && currentPointsSource !== '{}') {
    return new Map(JSON.parse(currentPointsSource));
  } else {
    return new Map();
  }
}

setStoreMap = (store, key, map) => {
  store.set(key, JSON.stringify(Array.from(map.entries())));
}

setGroupStoreMapping  = () => {
  setStoreMap(sourceGroupStore, 'source-group', new Map());
  const currentMap = getPointsSourceMap();
  currentMap.forEach((val, key) => {
    const groupVal = val.group;
    if (groupVal !== 'None') {
      const currentGroupMap =  getStoreMap(sourceGroupStore, 'source-group');
      let currentSet = new Set();
      if (currentGroupMap.has(groupVal)) {
        currentSet = new Set(JSON.parse( currentGroupMap.get(groupVal) ));
      } 
      currentSet.add(key);
      currentGroupMap.set(groupVal, JSON.stringify(Array.from( currentSet )));
      setStoreMap(sourceGroupStore, 'source-group', currentGroupMap);
    }
  });
}

clearPointsSourceMap = () => {
  pointsSourceToggleStore.set('points-source', new Map());
  setRewardPointsList(getPointsSourceMap());
}

clearGroupMap = () => {
  sourceGroupStore.set('source-group', new Map());
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
      sourcesMap.set(source.name, source);
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

  setRewardPointsList = (rewardPoints) => {
    pointsSourceListEl.innerHTML = `
    <thead>
      <tr>
        <th class="mdl-data-table__cell--non-numeric">Reward</th>
        <th class="mdl-data-table__cell--non-numeric">Scene</th>
        <th class="mdl-data-table__cell--non-numeric">Source</th>
        <th class="data-table-middle">Seconds</th>
        <th class="mdl-data-table__cell--non-numeric">Group</th>
        <th></th>
        <th></th>
      </tr>
    </thead>`;
    const tbodyEl = document.createElement('tbody');
    for (const [key, val] of rewardPoints) {
      const trEl = document.createElement('tr');
      let listItem = `
        <td class="mdl-data-table__cell--non-numeric reward">${key}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.scene}</td>
        <td class="mdl-data-table__cell--non-numeric">${val.source}</td>
        <td class="data-table-middle">${val.time/1000 === 0 ? 0 : (val.time - 1000 )/1000 }</td>
        <td class="mdl-data-table__cell--non-numeric">${val.group}</td>
        <td><i class="material-icons" onclick="editRow(this)">create</i></td>
        <td><i class="material-icons" onclick="removeRow(this)">delete</i></td>`;
      trEl.innerHTML = listItem;
      tbodyEl.appendChild(trEl);
    }
    // pointsSourceListEl.appendChild(p.childNodes[0]);
    pointsSourceListEl.appendChild(tbodyEl);
    setGroupStoreMapping();
  }

  editRow = row => {
    const reward = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    const scene = row.parentNode.parentNode.childNodes[2].nextSibling.innerHTML;
    const source = row.parentNode.parentNode.childNodes[4].nextSibling.innerHTML;
    const time = row.parentNode.parentNode.childNodes[6].nextSibling.innerHTML;
    const group = row.parentNode.parentNode.childNodes[8].nextSibling.innerHTML;
    rewardsElement.value = reward;
    obsScenesElement.value = scene;
    obsScenesElement.selected = true;
    setSourceList(scene);
    obsSourcesElement.value = source 
    timedElement.value = time;
    groupElement.value = group;

    setTimeout( () => {
      console.table({
        reward: rewardsElement.value, 
        scene: obsScenesElement.value, 
        source: obsSourcesElement.value, 
        time: timedElement.value, 
        group: groupElement.value
      });
    }, 100);
  }

  removeRow = row => {
    const currentReward = row.parentNode.parentNode.childNodes[0].nextSibling.innerHTML;
    console.log(currentReward);
    removeSingleSourceReward(currentReward)
  }

  /* End Set Scenes */

  onSceneSelectionChange = () => {
    const selectedSceneValue = obsScenesElement.value;
    setSourceList(selectedSceneValue);
  }

  onSourceSelectionChange = () => {
    const selectedSourceValue = obsSourcesElement.value;
  }

  /* OBS Toggling */

  testToggleSource = () => {
    clearPointsSourceMap();
    clearGroupMap();

  }
  
  toggleSpecifiedSource = source => {
    const key = source;
    const selectedSource = sourcesMap.get(key);
    let isRendered = selectedSource.render;
    isRendered = !isRendered;
    selectedSource.render = isRendered;
    sourcesMap.set(key, selectedSource);
    toggleSource(source, isRendered);
  }
  
  toggleOffSpecifiedSource = source => {
    const selectedSource = sourcesMap.get(source);
    let isRendered = false;
    selectedSource.render = isRendered;
    sourcesMap.set(source, selectedSource);
    toggleSource(source, isRendered);
  }
  
  toggleOnSpecifiedSource = source => {
    const key = source;
    const selectedSource = sourcesMap.get(key);
    let isRendered = true;
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

  timedToggleSource = (source, time) => {
    const key = source;
    const selectedSource = sourcesMap.get(key);
    toggleSource(source, false);
    setTimeout(() => {
      toggleSource(source, true);
      setTimeout(() => toggleSource(source, false), time);
    }, 500);
    selectedSource.render = false;
    sourcesMap.set(key, selectedSource);
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



