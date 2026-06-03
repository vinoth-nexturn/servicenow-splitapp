var BalanceCalculator = Class.create();
BalanceCalculator.prototype = {
  initialize: function () {},

  getGroupBalances: function (groupSysId) {
    var utils = new SplitUtils();
    utils.requireMembership(groupSysId);

    var rawDebts = {};
    var shareGr = new GlideRecord("x_snc_split_app_2_share");
    shareGr.addQuery("expense.group", groupSysId);
    shareGr.query();
    while (shareGr.next()) {
      var debtor = shareGr.user.toString();
      var creditor = shareGr.expense.payer.toString();
      var amt = shareGr.amount - shareGr.settled_amount;
      if (amt > 0) {
        var key = debtor + ":" + creditor;
        rawDebts[key] = (rawDebts[key] || 0) + amt;
      }
    }

    var settGr = new GlideRecord("x_snc_split_app_2_settlement");
    settGr.addQuery("group", groupSysId);
    settGr.query();
    while (settGr.next()) {
      var from = settGr.from_user.toString();
      var to = settGr.to_user.toString();
      var settAmount = settGr.amount;
      var k = from + ":" + to;
      rawDebts[k] = (rawDebts[k] || 0) - settAmount;
    }

    // Normalize: move negative debts to the opposite direction.
    // E.g., if A owes B $30 from shares and B pays A $10 (settlement),
    // rawDebts["A:B"] = 30, rawDebts["B:A"] = -10.
    // After normalization: rawDebts["A:B"] = 20.
    var normPairs = [];
    for (var p in rawDebts) {
      if (rawDebts[p] < 0) normPairs.push(p);
    }
    for (var ni = 0; ni < normPairs.length; ni++) {
      var np = normPairs[ni];
      if (rawDebts.hasOwnProperty(np) && rawDebts[np] < 0) {
        var nParts = np.split(":");
        var rev = nParts[1] + ":" + nParts[0];
        var nv = rawDebts[np];
        rawDebts[rev] = (rawDebts[rev] || 0) + nv;
        delete rawDebts[np];
      }
    }

    var net = {};
    for (var pair in rawDebts) {
      var parts = pair.split(":");
      var u1 = parts[0],
        u2 = parts[1];
      var val = rawDebts[pair];
      var reverse = u2 + ":" + u1;
      var reverseVal = rawDebts[reverse] || 0;

      if (!net[pair] && !net[reverse]) {
        var netAmount = val - reverseVal;
        if (netAmount > 0) {
          net[u1 + ":" + u2] = netAmount;
        } else if (netAmount < 0) {
          net[u2 + ":" + u1] = -netAmount;
        }
      }
    }

    var result = [];
    for (var p in net) {
      var ps = p.split(":");
      result.push({
        from_user: ps[0],
        to_user: ps[1],
        amount: net[p],
      });
    }
    return result;
  },

  getNetBalanceBetween: function (groupSysId, user1, user2) {
    var balances = this.getGroupBalances(groupSysId);
    for (var i = 0; i < balances.length; i++) {
      var b = balances[i];
      if (b.from_user === user1 && b.to_user === user2) {
        return b.amount;
      }
    }
    return 0;
  },

  getUserDashboard: function (userSysId) {
    var owedTotal = 0,
      owingTotal = 0;
    var memGr = new GlideRecord("x_snc_split_app_2_membership");
    memGr.addQuery("user", userSysId);
    memGr.query();
    while (memGr.next()) {
      var gid = memGr.group.toString();
      var balances = this.getGroupBalances(gid);
      for (var i = 0; i < balances.length; i++) {
        var b = balances[i];
        if (b.from_user === userSysId) {
          owingTotal += b.amount;
        } else if (b.to_user === userSysId) {
          owedTotal += b.amount;
        }
      }
    }
    return {
      total_owed: owedTotal,
      total_owing: owingTotal,
    };
  },

  type: "BalanceCalculator",
};
