# brewrovision

Score keeping system + stream overlay for the National Panomaju Brewrovision

Hacked together in the span of 2 days

## Building frontend

```bash
cd frontend
npm run build
# And then just serve through Caddy :)
# Hosted at https://panomaju.matsu.beer
 
```


## Building Backend

```bash
cd backend
npm run prod:start
# Runs on localhost:3000 / https://panomaju-api.matsu.beer
```

## Stopping Backend

```bash
cd backend
npm run prod:stop
# Stops and kills the pm2 instance
```


The data is persisted onto a JSON file because why not
