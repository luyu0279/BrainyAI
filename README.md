This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

First, run the development server:
```bash
npm install pnpm -g
```

```bash
pnpm install
```

```bash
npx husky init 
```

Then, start the development server:
```bash
pnpm dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

For further guidance, [visit plasmo Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Making production(debug) build, which will reserve the logs

Run the following:

```bash
pnpm build:staing
```

## To enable GA4 Measurement protocol

```bash
mv .env.example .env
```

and then add your GA4 Measurement ID and API Secret in the .env file

