# Developer Notes

## About Me

I am a **MERN stack developer** who took ownership of deploying this project to production.

## What I've Done So Far

- **Deployed the project to an AWS Lightsail VPS** — set up the server environment and got the application running in production.
- **Built a CI/CD pipeline using GitHub Actions** — pushing to `main` automatically SSHes into the Lightsail VPS and runs the full deploy flow (`git pull`, `composer install --no-dev`, `php artisan migrate --force`, `npm install && npm run build`, then `artisan optimize:clear`).

## What I'm Working On Next

I am now starting to work on the following sections of the application:

- **Exhibition** section
- **Contest** section

These will be my focus areas going forward.
