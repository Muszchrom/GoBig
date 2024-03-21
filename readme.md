# swiftin.app
https://www.swiftin.app/schedule/friday

The app development is currently paused because I'm currently studying and working on other projects. Using sqlite makes this app extreamly cheap to run but harder to implement good CI/CD pipelines. Next iteration would deffinitelly use separated database. 

Swiftin is an easy-to-use, readable, and lightweight scheduling application. You can effortlessly create or edit subject tiles by simply pressing one of them and entering edit mode. The app's header provides four main functionalities: switching the displayed day, fast navigation to the current day, navigation between weeks, and a button that takes you to the semester calendar with notes. These notes are draggable and easily editable thanks to the clean design; they also change color depending on the chosen event. The three dots button located in the bottom-right part of the schedule takes you to a new window, where you can add a note and even a campus map (or any small image you want). There, you can add users with read permissions to your schedule, remove users, accept invites, or switch between active groups.

## Stuff used
Front:\
CRA, React rotuer\
Backend:\
Express, Bcrypt, sqlite (??)\
Deployment:\
Vercel, AWS EC2
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

### Renewing certs
Run these commands
```bash
cd path/
ls # docker-compose.yml nginx
docker-compose run --rm certbot renew
docker ps # get nginx container id
docker restart [nginx-image-id]
```
