#Ocelbot
This is a bot I created for the Alternate Reality Games server (A&S)

Many thanks to [eslachance](https://github.com/eslachance) for her excellent command loader/framework which you can find [here](https://github.com/eslachance/komada/tree/61cd70b3f210c4e0b68c1a3405a0e5612979b7ff).
##Requirements
Requires Node.JS v7.2.1 or greater.
```sh
$ git clone https://github.com/artemisbot/Ocelbot.git
$ cd Ocelbot
$ npm install
```
You will also want to set up your API keys in the file `config.json`:
```json
{
  "prefix": "!",
  "token": "Insert Discord Token Here",
  "ownerID": "Insert Owner's Discord ID here",
  "consumer_key": "Twitter API Keys",
  "consumer_secret": "Twitter API Keys",
  "access_token": "Twitter API Keys",
  "access_token_secret": "Twitter API Keys",
  "twitWatch": {"Do not edit this Object"}
}
```
You can now run the bot by executing this:
```sh
$ node --harmony main.js
```
