# Invite Manager

A unbranded discord bot that keeps tracks of invites and is written in TypeScript with discord.ts.

## Features

- Docker compatible
- PM2 compatible
- Admin commands to add, remove, reset invites
- Welcome message
- Leaderboard

## Requirements

- [a Node.js v17.6 or higher](https://nodejs.org/en/download/)
- TypeScript (`yarn add global typescript or npm i -g typescript`) 
- [a A Postgresql database](https://www.postgresql.org/)

## How to host

### Node 

Clone the repo:
```
git clone https://github.com/Bram3/InviteManager
```

Edit the config (./src/config.ts)

Create a `.env` file with these fields:
```
TOKEN=
GUILD_ID=
CLIENT_ID=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
DB_HOST=
```

Compile TypesScript to JavaScript:
```
npm run build
```

Start the bot:
```
npm run start
```

### PM2

Install PM2:
```
npm i -g pm2 --save-dev
```

Clone the repo:
```
git clone https://github.com/Bram3/InviteManager
```

Edit the config (./src/config.ts)

Create a `.env` file with these fields:
```
TOKEN=
GUILD_ID=
CLIENT_ID=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
DB_HOST=
```

Compile TypesScript to JavaScript:
```
npm run build
```

Start the bot:
```
pm2 start ./build/index.js
```

### Docker
Install docker: https://docs.docker.com/engine/install/

Clone the repo:
```
git clone https://github.com/Bram3/InviteManager
```

Edit the config (./src/config.ts)

Build the image:
```
docker build . -t bram3/invitemanager
```

Start the image:
```
docker run -it 
\ -e TOKEN="" 
\ -e CLIENT_ID=""
\ -e DB_USER="" 
\ -e DB_PASSWORD="" 
\ -e DB_NAME="" 
\ -e DB_PORT="" 
\ -e DB_HOST="" 
\ bram3/invitemanager ```


