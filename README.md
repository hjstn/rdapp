# rdapp
Informs you when RD decisions come out (2020).

## Installation and Setup

1. Install Node.js from [here](https://nodejs.org/en/download/) (if it's not already installed).
2. Copy `keys_example.json` to `keys.json`.
3. Fill the values in `keys.json`. You can get a Telegram token from the BotFather bot on Telegram, and [reddit app settings](https://www.reddit.com/prefs/apps/) and [reddit-oauth-helper](https://not-an-aardvark.github.io/reddit-oauth-helper/) can help with the other Reddit tokens.
4. Run `npm install` to install dependencies.
5. Run `node .` to start the program.

## Updating university list

The university list is stored in `uni.csv` file in the `name,thread` format.
Here `name` is the friendly name for the university, and `thread` is the `t3_??????` Reddit thread link for the megathreads.

**NOTE**: When running, the program creates a `rderbot.json` storing user university selections by `thread`, and there is currently no way to remove invalid threads if the university list is modified, which can lead to unexpected behaviour.

## Upgrading

A previous version of the program used a `rderbot.json` file. To upgrade, run `node bot2db` to generate the new `rderDB.json` file.

## Porting to other platforms

Although I have not attempted this, you can try porting Rder to other platforms beyond Telegram (such as Discord). Like in `core/Telegram.js`, the platform-specific code can inherit and implement the methods in `model/Platform.js`. Then, by replacing `this.telegram` in `index.js`, Rder should theoretically be compatible with your platform of choice.