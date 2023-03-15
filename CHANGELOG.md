# Changelog

## 1.1.5

* Added an ad-blocker, this means you can listen to Deezer without ads if you have Deezer Free!
* Added a debug indicator
* Updated user agents

## 1.1.4

* Retry with track instead of album ([``ba88160``](https://github.com/JustYuuto/deezer-discord-rpc/commit/ba881603405bb9117e98616d5ae021e85eef99e8) and [``c96f7ae``](https://github.com/JustYuuto/deezer-discord-rpc/commit/c96f7ae10d8963ddb9f57518082f904bdfb43ce5))

## 1.1.3

* Use album title instead of track title ([``a3d6e2f``](https://github.com/JustYuuto/deezer-discord-rpc/commit/a3d6e2fe44e5185e7fa00fc5fcfa1a998eeeec79))

## 1.1.2

* Fixed "Object has been destroyed" error when exiting the app and the window was open ([``3949012``](https://github.com/JustYuuto/deezer-discord-rpc/commit/39490125c850070dd080f06633de8e60acf44427))
* Added a small image on the "Listening to" status ([``65089b9``](https://github.com/JustYuuto/deezer-discord-rpc/commit/65089b905569b04cd7bd195e39291df28d3b8345))
* Now updates RPC if music is playing/paused ([``b9ecb67``](https://github.com/JustYuuto/deezer-discord-rpc/commit/b9ecb678235b92bb266647511bcd68292ba229ef))

## 1.1.1

* Automatically updating the Spotify access token

## 1.1.0: WebSocket Update

* We are now using Electron Builder for building the app; you can uninstall the old one
* You can now use a "Listening to" status (like Spotify) on your profile!
* Added tray tooltip options to change the text
* Added a tray menu option to reconnect the RPC
* Optimized the code **a lot** so now it is more readable

## 1.0.9

* Added a tray menu submenu to select the tray icon tooltip text ([``ca6401b``](https://github.com/JustYuuto/deezer-discord-rpc/commit/ca6401b6fe28bdf7caabe9b01c0b2356b1d5e0fa))

## 1.0.8

* Update checking on startup

## 1.0.7

* Updated Electron to version `23.1.0`
* The tray tooltip now updates and shows the current song playing
* Added a tray menu option to reconnect the RPC if it disconnected 

## 1.0.6

* That was for testing the updater ^^" ([``9018e05``](https://github.com/JustYuuto/deezer-discord-rpc/commit/9018e05acfef496928ab8fe64f71b023227a90b2))

## 1.0.5

* Fixed app not exiting when clicking on "Quit" in the tray menu ([``60ae06b``](https://github.com/JustYuuto/deezer-discord-rpc/commit/60ae06b9e430fa083376be4899806973c01adacb))
* Added an update checker when app starts ([``11f72f1``](https://github.com/JustYuuto/deezer-discord-rpc/commit/11f72f1b90a4997cabaec09bcfaabe3afc48c40e))

## 1.0.4

* Updated custom user-agent to Chrome 110 ([``1d1e24c``#diff-bf8986a545cc729a5e76191a9d4afa2f63cf28a132f238413ce8349b7da44813L27-R27](https://github.com/JustYuuto/deezer-discord-rpc/commit/1d1e24cc87d90026b03fff24515656c40830a22d#diff-bf8986a545cc729a5e76191a9d4afa2f63cf28a132f238413ce8349b7da44813L27-R27))
* Made in-app updater working when clicking on the notification ([``1d1e24c``#diff-bf8986a545cc729a5e76191a9d4afa2f63cf28a132f238413ce8349b7da44813R55-R57](https://github.com/JustYuuto/deezer-discord-rpc/commit/1d1e24cc87d90026b03fff24515656c40830a22d#diff-bf8986a545cc729a5e76191a9d4afa2f63cf28a132f238413ce8349b7da44813R55-R57))
* Added a config file ([``4e6945d``](https://github.com/JustYuuto/deezer-discord-rpc/commit/4e6945d8c3c14ab8ac2678d28c53ee78885a66ea))
* Made the RPC not visible if the music is not playing ([``e9a8332``](https://github.com/JustYuuto/deezer-discord-rpc/commit/e9a83327dfe791fbc86c602116416a3407567ca8))

## 1.0.3

The tray icon wasn't loaded

## 1.0.2

Added a setup for installing the app (finally)

## 1.0.1

A lot of changes :p

## 1.0.0

First release