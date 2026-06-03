var SettlementProcessor = Class.create();
SettlementProcessor.prototype = {
  initialize: function () {},

  recordSettlement: function (settlementData) {
    var utils = new SplitUtils();
    utils.requireMembership(settlementData.group);

    var actualFrom = settlementData.from_user || gs.getUserID();
    if (actualFrom !== gs.getUserID()) {
      throw new Error("You can only record your own settlements.");
    }
    settlementData.from_user = actualFrom;

    var balanceCalc = new BalanceCalculator();
    var netBalance = balanceCalc.getNetBalanceBetween(
      settlementData.group,
      settlementData.from_user,
      settlementData.to_user,
    );
    if (parseFloat(settlementData.amount.toFixed(2)) > parseFloat(netBalance.toFixed(2)) + 0.01) {
      throw new Error(
        "Settlement amount exceeds the outstanding balance of " +
          netBalance.toFixed(2),
      );
    }

    var shareGr = new GlideRecord("x_snc_split_app_2_share");
    shareGr.addQuery("expense.group", settlementData.group);
    shareGr.addQuery("user", settlementData.from_user);
    shareGr.addQuery("expense.payer", settlementData.to_user);
    shareGr.addEncodedQuery("settled_amount!=amount");
    shareGr.orderBy("expense.date");
    shareGr.query();

    var remaining = settlementData.amount;
    while (shareGr.next() && remaining > 0) {
      var currentAmount = shareGr.amount - shareGr.settled_amount;
      if (remaining >= currentAmount) {
        shareGr.settled_amount = shareGr.amount;
        remaining -= currentAmount;
      } else {
        shareGr.settled_amount = shareGr.settled_amount + remaining;
        remaining = 0;
      }
      shareGr.update();
    }

    var settGr = new GlideRecord("x_snc_split_app_2_settlement");
    settGr.initialize();
    settGr.group = settlementData.group;
    settGr.from_user = settlementData.from_user;
    settGr.to_user = settlementData.to_user;
    settGr.amount = settlementData.amount;
    settGr.date = settlementData.date;
    settGr.payment_method = settlementData.payment_method || "";
    settGr.notes = settlementData.notes || "";
    settGr.insert();

    return true;
  },

  type: "SettlementProcessor",
};
