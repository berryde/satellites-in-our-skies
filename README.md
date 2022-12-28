# The satellites in our skies

This repository contains the data and code required to generate and view "The satellites in our skies" data visualization. This repository consists of two directories:

## Contents

### `app`

This directory contains the SvelteKit data visualisation showing various charts about satellites and space missions. You can explore the different charts and see how the data changes over time.

### `data`

This directory contains the raw datasets from the UCS satellite database and Next Spaceflight. It also includes a Jupyter notebook to perform preprocessing on these datasets. You can use this notebook to clean and prepare the data for use in the data visualization.

## Building the application

To build the application for standalone use, execute the following commands:

```bash
npm install
npm run build
npx http-server build -bgo
```

To build the application and preview it from within the repository, simply execute:

```bash
npm install
npm run build
npm run preview
```
