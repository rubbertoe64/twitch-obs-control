

const app = express();
const obs = new OBSWebSocket();

let currentScenes;
let sceneMap = new Map();
let sourcesMap = new Map();


app.get('/', (req, res) => {
  res.send('<h1>Hello World</h1>');
})

app.use(express.static(path.join(__dirname, 'assets')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`) );

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
          clientId: '',
          clientSecret: '',
          oauthToken: ''
      }
  }
});



const twitchUserEl = document.getElementById("twitch-user");
const wsPort = document.getElementById("websocket-port")
const wsPass = document.getElementById("websocket-password")
const snackbarContainer = document.querySelector("#demo-snackbar-example");
const obsConnectBut = document.getElementById("obsConnect");
const obsDisconnectBut = document.getElementById("obsDisconnect");
const obsScenesElement = document.getElementById('scenes');
const obsSourcesElement = document.getElementById('sources');
const rewardsElement = document.getElementById('rewards');
const dialog = document.querySelector('dialog');
const showDialogButton = document.querySelector('#show-dialog');
const twitchSubmitEl = document.getElementById('twitch-api-save');
const clientIdEl = document.getElementById('twitch-api-client-id-input');
const clientSecretEl = document.getElementById('twitch-api-client-secret-input');
const oauthTokenEl = document.getElementById('twitch-oauth-input');
const connectTwitchBtnEl = document.getElementById('connect-twitch-btn');
const disconnectTwtichBtnEl = document.getElementById('disconnect-twitch-btn');


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

twitchSubmitEl.addEventListener('click', () => {
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

let visible = true;
  
testScene = () => {
  visible = !visible;
  obs.sendCallback('SetSceneItemRender', {
    source: 'electron-server',
    render: visible
  }, (err, res) => {
    console.log(res);
  })
  
  // obs.send('SetSceneItemRender', )
}

  connectTwitch = async () => {
    ComfyJS.onReward = ( user, reward, cost, extra ) => {
      console.log( user + " redeemed " + reward + " for " + cost );
      if (reward === 'another test') {
        toggleSpecifiedSource(obsScenesElement.value, obsSourcesElement.value);
      }
    }

    ComfyJS.onChat = ( user, message, flags, self, extra ) => {
      console.log( user, message );
    }

    console.log(clientId, `oauth:${oauthToken}`);
    ComfyJS.Init(savedTwitchUser, `${oauthToken}`, savedTwitchUser);
    getRewards();
    toggleTwitchConnected();
  }

  disconnectTwitch = () => {
    console.log('Twitch Disconnected');
    ComfyJS.Disconnect();
    toggleTwitchConnected();
  }
  
  getRewards = async () => {
    let totalRewards = [];
    let channelRewards = await ComfyJS.GetChannelRewards(clientId);
    channelRewards.forEach(reward => {
      totalRewards.push(reward.title);
    })
    setRewardsList(totalRewards);
    console.log(channelRewards, true);
  }

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
    console.log('map', sourcesMap);
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
      optionEl.value = reward;
      const text = document.createTextNode(reward);
      // scene also has name of sources
      optionEl.appendChild(text);
      rewardsElement.appendChild(optionEl);
    })
  }

  onSceneSelectionChange = () => {
    const selectedValue = obsScenesElement.value;
    setSourceList(selectedValue);
  }

  testToggleSource = () => {
    const sceneVal = obsScenesElement.value;
    const sourceVal = obsSourcesElement.value;
    toggleSpecifiedSource(sceneVal, sourceVal);
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

  mapSourceReward = () => {
    console.log('mapping');
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



