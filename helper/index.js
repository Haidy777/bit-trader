module.exports = {
    round: function (amount, digits = 5) {
        const multiplicator = Math.pow(10, digits);

        amount = parseFloat((amount * multiplicator).toFixed(11));

        return Number((Math.round(amount) / multiplicator).toFixed(digits));
    }
};
