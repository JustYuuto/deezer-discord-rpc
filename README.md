<div align="center">
    <h1>Deezer Discord RPC</h1>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/justyuuto/deezer-discord-rpc?style=for-the-badge"></a>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/releases/latest"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/downloads/justyuuto/deezer-discord-rpc/latest/total?style=for-the-badge"></a>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/releases/latest"><img alt="GitHub release (latest by date including pre-releases)" src="https://img.shields.io/github/v/release/justyuuto/deezer-discord-rpc?include_prereleases&label=latest%20release&style=for-the-badge"></a>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/commits"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/w/justyuuto/deezer-discord-rpc?style=for-the-badge"></a>
    <hr />
    <p>A Discord RPC for showing the music you're listening to on Deezer (like the Spotify integration).</p>
</div>

## Features

* Updates instantly
* Shows the song title, the song artist(s), the album cover (when the mouse is over the album cover, the album title is shown) and the song duration
* On the RPC there's a "Listen along" button like on the Spotify integration. This is a link to the song
* An in-app updater
* Can hide the activity if song is not playing
* Can set a "Listening to" status (**requires your Discord token**)
* Includes an ad-blocker, so it can block Deezer ads, Sentry requests...
* Supports songs, radios, personal songs, podcasts

## Screenshots

#### RPC on profile:

<p>With the "Playing" status:</p>

![RPC on profile](screenshots/rpc_on_profile.png)

<p>With the "Listening to" status:</p>

![RPC on profile](screenshots/rpc_on_profile_2.png)

#### Tray menu:

![Tray menu](screenshots/tray_menu.png)

## How To build yourself (on linux)
If your not using a red-hat system make sure you have the build tools for rmp package

#### Install the rpm-build package
```
sudo apt install rpm-build
or
sudo dnf install rpm-build
```

#### Clone the repo

```
git clone https://github.com/JustYuuto/deezer-discord-rpc
cd ./deezer-discord-rpc
```

#### Build the app with docker

> [!NOTE]  
> OFC, You have to install docker!  

```
docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 electronuserland/builder:wine
```

##### Build the app

```
# npm install
# npm run build
```

#### Get the builded package

You can get the builded package directly in the ```dist``` folder

<br>

## Todo

* [x] Implement Discord WebSocket server to get a "Listening to" status on the profile
* [x] Support podcasts

## License

Mozilla Public License 2.0
