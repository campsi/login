# campsi/login
Client-side widget that implements [**campsi**/api](https://github.com/campsi/api) [authentification](https://github.com/campsi/api#authentification--authorization) and registration.

## Features
- [x] User / Password login flow 
- [x] Social and entreprise login flow
- [x] Custom and built-in themes
- [x] Follows jQuery plugins conventions
  - [x] Named methods
  - [x] Minimal `$.fn` footprint
- [x] Responsive

## Demo themes

|    |      |      |
|----| ---- | ---- |
`Modal.Transparent.Sunset` | `Modal.Flat.Carmin` | `Modal.Flat.Neonblue` |
![](docs/images/modal.transparent.sunset.jpg?raw=true) | ![](docs/images/modal.flat.carmin.jpg?raw=true) | ![](docs/images/modal.transparent.neonblue.jpg?raw=true) |

## Installation
#### Pre-requisites
**campsi**/login is a *jQuery plugin*, and therefore requires an instance of **jQuery**. You can either use an official jQuery CDN or download your own custom version, but **do not use the `slim` version**. This version strips out `$.ajax()`, which is required to call the authentification endpoint of the api. 

#### Step 1 : Get the script
Using NPM
```sh
$ npm install --save campsi-login
```
#### Step 2 : Import the plugin 
```html
<!-- jQuery isn't bundled, you have to import it first. Reminder : do not use the slim version -->
<script src="node_modules/jquery/dist/jquery.js"></script>
<script src="node_modules/campsi-login/dist/jquery.campsi-login.js"></script>
```

Like most jQuery plugins, **campsi**/login ships with a minified version. Just use `jquery.campsi-login.min.js` if you need to.

#### Step 3 : Configure

**camspi**/api returns the auth token in the query string, so we have to parse it to obtain the value. The **campsi**/login plugin can also use an invitation token and display the issuer and the message.
```javascript
// here's the URL to the campsi/api server
var apiUrl = 'http://api.mysuperwebsite.com/';

$('#login').CampsiLogin({
    baseUrl: apiUrl + '/auth'
}).on('login', function(event, user){
    console.info('user logged in', user);
});
```
## Documentation
### Methods

| Method          |  Description                                                                    |
|---------------- | ------------------------------------------------------------------------------- |
| `$div.CampsiLogin(options)` |  **Constructor method**|
| `$div.CampsiLogin('show')`|  Display the login widget by adding the class `visible` and removing the class `closed` to the container `div` |
| `$div.CampsiLogin('hide')`| Display the login widget by adding the class `closed` and removing the class `visible` to the container `div`|
| `$div.CampsiLogin('logout')`|  Destroy the token in the browser's `localStorage` |

### Constructor options

| Name            | Type         |  Required |       Description                                                            |
|---------------- | ------------ | --------- | ----------------------------------------------------------------- |
| `baseUrl`       |  `string`    | **Yes**   | The URL of your **campsi**/api setup                            |
| `token`         | `string`     | No        | force the authentification token |
| `invitation`    | `string`     | No        | force the invitation token   |
| `state`         | `string`     | No        | which form to display by default (one of "signup", "signin", "reset")|

The parameters `token` and `invitation` have precedence over the query string and the local storage.

### Events

| Name            |          Description                                                            |
|---------------- | ------------------------------------------------------------------------------- |
| `ready`         | when the providers are loaded and the markup created                            |
| `login`         | when a token is successfully decoded and the user has been authentificated      |
| `loginError`    | when an error happened while decoding the token or authentificating the user    |

The `login` event listener is called with an additional parameter: an object containing the user infos:

```javascript
$('#login').on('login', function(event, user){
    var whatAUserLooksLike =  {
        _id: "58334d2a41015672d3b3f147",
        displayName: "Romain Bessuges-Meusy",
        picture: "https://",
        email: "romain@agilitation.fr",
        identities: {
            local: {
                id: "romain@agilitation.fr",
                username: "romain@agilitation.fr"
            }
        },
        token: {
            value: "9e7f91f5-9d47-403a-9604-dcb8b1d9e938",
            expiration: "2016-12-10T17:19:01.839Z"
        },
        isAdmin: false
   };
});
```
