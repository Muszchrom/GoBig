# This setup covers hosting both services on the same machine

## Setting up nginx and SSL
Big thank you to https://mindsers.blog/post/https-using-nginx-certbot-docker/

In case you have directory certbot, certbot/www, certbot/conf, ommit list below and copy yours /certbot directory to nginx/, paste code from point 4 to nginx/nginx/conf/default.conf and docker compose up

1. Map port 80 to 80 and 443 to 443 in the router settigns and replace %DOMAIN.ORG% with your domain name in nginx/conf/default.conf.
2. In nginx/ run: docker compose up
3. In nginx/ run: docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ -d %DOMAIN.ORG%
4. Paste this code in nginx/conf/default.conf, replace %DOMAIN.ORG% with your domain name and restart docker compose
server {  
&nbsp;&nbsp;&nbsp;&nbsp;listen 443 default_server ssl;  
    listen [::]:443 ssl;  

    server_name %DOMAIN.ORG%;  

    ssl_certificate /etc/nginx/ssl/live/%DOMAIN.ORG%/fullchain.pem;  
    ssl_certificate_key /etc/nginx/ssl/live/%DOMAIN.ORG%/privkey.pem;  

    location / {  
        proxy_pass http://192.168.100.54:3000$request_uri;  
    }  

    location /api {  
        proxy_pass http://192.168.100.54:5000$request_uri;  
    }  
}
5. Before certificate expiration, renew it with: docker compose run --rm certbot renew

## Setting up dev environment
1. Ensure that nginx SSL server is running
2. Crete client/src/source.js which exports your api endpoint as string eg.
Powershell: 'export const source = "https://YOURDOMAIN.ORG/WHATEVER"' | Out-File -FilePath .\client\src\source.js -Encoding ASCII
3. In docker compose provide values for JWT_KEY and COOKIE_SECRET env variables
4. docker compose -f docker-compose.dev.yml build
5. docker compose -f docker-compose.dev.yml up

## Setting up production
client: 
Is going to be managed by github actions.  
Remember to map ports from nginx/nginx/conf/default.conf to client/nginx/config/default.conf properly, eg. 3000:80 since nginx containing client files listens on 80 and parent nginx proxy_pass is set to 3000.  
docker run -dp 3000:80 IMAGE-NAME
