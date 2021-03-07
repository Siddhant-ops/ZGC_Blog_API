# Blog

Blog API for KES Shroff College, The API is splitted into three services

- Auth
- Content
- User

### Requirements

- Local MongoDB
- Nodejs & npm
- nginx

> Don't forget to install dependencies for each services

```bash
cd folder_name && npm install
```

#### For Quick Start

Run the start.js file, It will run all the services for you

## Auth Service

This service handles authentication and authorizaton for the users.

`Port : 1336`

## Content Service

This service handles Blogs and Comments for the users.

`Port : 1337`

## User Service

This service handles request related to the users.

`Port : 1338`

## Setting Up Nginx

Just copy the config file in your nginx folder
