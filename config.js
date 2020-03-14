module.exports = {
    hypeMeter: {
        factors: [
            {
                regex: /!/g,
                score: msg => 1 - Math.exp(-msg.count)
            },
            {
                regex: /[A-Z]/g,
                score: msg => Math.exp(4 * (msg.count/msg.length - 0.1)) - Math.exp(-0.4)
            },
            {
                regex: /got in|accepted|rejected|waitlisted/gi,
                score: msg => msg.count > 0 ? 1 : 0
            },
        ],
        threshold: 6/5
    },
    activity: {
        timeout: 30 * 60 * 1000,
        threshold: 5
    },
    announce: {
        timeout: 2 * 60 * 60 * 1000
    },
    storage: 'rderDB.json'
};
