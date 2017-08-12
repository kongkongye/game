const ConnConstant = (function () {
    const PROTOCOL = "ws";
    const HOST = "rest-game.kongkongye.com";
    const PORT = "80";
    const PATH = "/ws";
    const URL = PROTOCOL+"://"+HOST+":"+PORT+PATH;
    const CALLBACK_TIMEOUT = 10000;

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