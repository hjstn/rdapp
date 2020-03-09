class HypeMeter {
    constructor(config = { factors: [], threshold: 0 }) {
        this.config = config;
    }

    static count(text = '', regex) {
        return (text.match(regex) || []).length;
    }

    score(text) {
        let values = [];

        this.config.factors.forEach(factor => {
            const factorScore = factor.score({
                text,
                length: text.length,
                count: HypeMeter.count(text, factor.regex)
            });

            values.push(factorScore > 1 ? 1 : factorScore);
        });

        return values;
    }

    isHype(text) {
        const hypeScore = this.score(text);
        return hypeScore.reduce((a, b) => a + b, 0) >= this.config.threshold ? hypeScore : 0;
    }
}

module.exports = HypeMeter;