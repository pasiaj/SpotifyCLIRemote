var SpotifyWebApi = require('spotify-web-api-node'),
    fs = require('fs');

//Read settings and start validation
fs.readFile('__dirname/settings.json', 'utf8', validateTokens);
var settings, spotifyApi;

var args = process.argv.splice(process.execArgv.length + 2);

function validateTokens(err, data){
    if (err) throw err;

    settings = JSON.parse(data);

    var credentials = {
        clientId:       settings.clientId,
        clientSecret:   settings.clientSecret,
        redirectUri:    settings.redirectUri
    };

    // console.log('New API');
    spotifyApi = new SpotifyWebApi(credentials);

    // The code that's returned as a query parameter to the redirect URI
    var code = settings.authCode;
    console.log(code);
    if (code == "") throw "AuthCode missing. Run ´node setup.js´"

    // Retrieve an access token and a refresh token
    if (settings.refreshToken == ''){
        spotifyApi.authorizationCodeGrant(code).then(
          function(data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            settings.tokenExpirationEpoch = new Date().getTime() / 1000 + data.body['expires_in'];
            settings.accessToken = data.body['access_token'];
            settings.refreshToken = data.body['refresh_token'];

            saveSettings(settings);

            return performApiCall();
          },
          function(err) {
            console.log('Something went wrong!', err);
          }
        );
    }

    spotifyApi.setAccessToken( settings.accessToken );
    spotifyApi.setRefreshToken( settings.refreshToken );

    if (settings.tokenExpirationEpoch != '' && settings.tokenExpirationEpoch < (new Date().getTime() / 1000)) {
        spotifyApi.refreshAccessToken().then(
          function(data) {
            spotifyApi.setAccessToken(data.body['access_token']);
            tokenExpirationEpoch = new Date().getTime() / 1000 + data.body['expires_in'];
            console.log( 'Refreshed token. It now expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');

            settings.tokenExpirationEpoch = tokenExpirationEpoch;
            settings.accessToken = data.body['access_token'];

            saveSettings(settings);

            return performApiCall();
          },
          function(err) {
            console.log('Could not refresh the token!', err.message);
          }
        );
    }

    if (settings.tokenExpirationEpoch > (new Date().getTime() / 1000)){
        return performApiCall();
    }

}

function saveSettings(settings){
    fs.writeFile('__dirname/settings.json', JSON.stringify(settings), 'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

function formatSpotifyURI( uri ) {
    if (uri.indexOf('track') != -1){
        return { uris: [uri] }
    } else {
        return { context_uri: uri }
    }
}

function performApiCall() {
    if (args.length == 0) return;

    var uri = args[0];

    spotifyApi.play( formatSpotifyURI( uri ) ).then(function(data) {
    // Output items
        console.log(data);
      }, function(err) {
        console.log('Something went wrong!', err);
      }
    );
}


// function test(){
//     console.log('Running a test');
//     // Get information about current playing song for signed in user
//     // spotifyApi.getMyDevices()
//     spotifyApi.play({context_uri: 'spotify:track:4fZJG8y70r2hyw3Kb4sU4N'})
//       .then(function(data) {
//         // Output items
//         console.log("Now Playing: ",data.body);
//       }, function(err) {
//         console.log('Something went wrong!', err);
//       });
//     /* Get Recommendations Based on Seeds */
//     // TBD

// }