var ConnConstant = (function () {
    var PROTOCOL = "ws";
    var HOST = "rest-game.kongkongye.com";
    var PORT = "80";
    var PATH = "/ws";
    var URL = PROTOCOL+"://"+HOST+":"+PORT+PATH;
    var CALLBACK_TIMEOUT = 10000;

    return {
        PROTOCOL: PROTOCOL,
        HOST: HOST,
        PORT: PORT,
        PATH: PATH,
        URL: URL,
        CALLBACK_TIMEOUT: CALLBACK_TIMEOUT,

        PHASE_LOAD: 'load',
        PHASE_START: 'start',
    }
})();