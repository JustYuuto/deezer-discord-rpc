<div align="center">
    <h1>Deezer Discord RPC</h1>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/justyuuto/deezer-discord-rpc?style=for-the-badge"></a>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/releases/latest"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/downloads/justyuuto/deezer-discord-rpc/latest/total?style=for-the-badge"></a>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/releases/latest"><img alt="GitHub release (latest by date including pre-releases)" src="https://img.shields.io/github/v/release/justyuuto/deezer-discord-rpc?include_prereleases&label=latest%20release&style=for-the-badge"></a>
    <a href="https://github.com/JustYuuto/deezer-discord-rpc/commits"><img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/w/justyuuto/deezer-discord-rpc?style=for-the-badge"></a>
    <hr />
    <p>A Discord RPC for showing the music you're listening to on Deezer (like Spotify integration).</p>
    <p>If you want to use it on your phone, the app is available on Android: <a href="https://github.com/JustYuuto/deezer-discord-rpc-android/releases/latest">latest release</a></p>
</div>

## Features

* Updates instantly
* Shows the song title, the song artist(s), the album cover (when the mouse is over the album cover the album title is shown) and the song duration
* On the RPC there's a "Listen along" button like on the Spotify integration. This is a link to the song
* An in-app updater
* Can hide the activity if song is not playing
* Can set a "Listening to" status (like Spotify) (**requires your Discord token**)
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

## Todo

* [x] Implement Discord WebSocket server to get a "Listening to" status on the profile
* [x] Support podcasts

## License

Mozilla Public License 2.0
