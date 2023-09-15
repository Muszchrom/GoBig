## Setting up dev environment
Run: `docker compose -f docker-compose.dev.yml build`
then: `docker compose -f docker-compose.dev.yml up`
Should work out of the box
In case you're running on different ports, edit `client/src/source.js` so it exports url that matches `ALLOW_ORIGIN` env variable in `docker-compose.dev.yml`


## Setting up production
### Frontend
1. Edit `client/src/source.js` to match the api domain. In for example vercell Build & Development Settings set Build command to: `echo "export const source = 'https://%DOMAIN.ORG%'" > src/source.js; npm run build`
### Api
Workin' on it

