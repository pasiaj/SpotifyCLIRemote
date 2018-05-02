var SpotifyWebApi = require('spotify-web-api-node'),
    prompt = require('prompt'),
    fs = require('fs');

var settings;

fs.readFile('__dirname/settings.json', 'utf8', setup);

function setup(err, data){
    if (err) throw err;

    settings = JSON.parse(data);
    console.log(settings)

    var scopes = ['user-modify-playback-state', 'user-read-playback-state', 'streaming'],
      redirectUri = settings.redirectUri,
      clientId = settings.clientId,
      state = 'some-state-of-my-choice';

    // Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
    var spotifyApi = new SpotifyWebApi({
      redirectUri: redirectUri,
      clientId: clientId
    });

    // Create the authorization URL
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    console.log('Please visit the following URL for app authorization:\n\n', authorizeURL);

    //
    // Start the prompt
    //
    prompt.start();
    prompt.get(['authCode'], function (err, result) {
        settings.authCode = result.authCode;
        settings.refreshToken = '';
        settings.accessToken = '';
        settings.tokenExpirationEpoch = '';

        fs.writeFile('__dirname/settings.json', JSON.stringify(settings), 'utf8', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
        console.log('  Code: ' + result.authCode);
    });
}
