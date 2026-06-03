var ExpenseManager = Class.create();
ExpenseManager.prototype = {
  initialize: function () {},

  _calculateShares: function (expenseData) {
    if (expenseData.split_type === "equal") {
      var memGr = new GlideRecord("x_snc_split_app_2_membership");
      memGr.addQuery("group", expenseData.group);
      memGr.query();
      var members = [];
      while (memGr.next()) {
        members.push(memGr.user.toString());
      }
      if (members.length === 0) throw new Error("Group has no members.");
      var perShare = parseFloat(
        (expenseData.amount / members.length).toFixed(2),
      );
      var remainder = parseFloat((expenseData.amount - perShare * members.length).toFixed(2));
      return members.map(function (userSysId, index) {
        var amount = perShare;
        if (index === 0) amount += remainder;
        return { user: userSysId, amount: amount };
      });
    }

    if (expenseData.split_type === "percentage") {
      var pShares = [];
      var pSum = 0;
      for (var pi = 0; pi < expenseData.shares.length; pi++) {
        var ps = expenseData.shares[pi];
        var amt = parseFloat(
          (expenseData.amount * ps.percentage / 100).toFixed(2),
        );
        pSum += amt;
        pShares.push({
          user: ps.user,
          amount: amt,
          percentage: ps.percentage,
        });
      }
      var pRemainder = expenseData.amount - pSum;
      if (Math.abs(pRemainder) > 0.01 && pShares.length > 0) {
      pShares[0].amount = parseFloat(
        (pShares[0].amount + pRemainder).toFixed(2),
      );
      for (var pi2 = 0; pi2 < pShares.length; pi2++) {
        pShares[pi2].amount = parseFloat(pShares[pi2].amount.toFixed(2));
      }
      }
      return pShares;
    }

    if (expenseData.split_type === "shares") {
      var totalShares = 0;
      for (var si = 0; si < expenseData.shares.length; si++) {
        totalShares += expenseData.shares[si].shares;
      }
      if (totalShares === 0) throw new Error("Total shares must be > 0.");
      var sShares = [];
      var sSum = 0;
      for (var sj = 0; sj < expenseData.shares.length; sj++) {
        var ss = expenseData.shares[sj];
        var amt = parseFloat(
          (expenseData.amount * ss.shares / totalShares).toFixed(2),
        );
        sSum += amt;
        sShares.push({ user: ss.user, amount: amt, shares: ss.shares });
      }
      var sRemainder = parseFloat((expenseData.amount - sSum).toFixed(2));
      if (Math.abs(sRemainder) > 0.01 && sShares.length > 0) {
        sShares[0].amount = parseFloat(
          (sShares[0].amount + sRemainder).toFixed(2),
        );
      }
      for (var sj2 = 0; sj2 < sShares.length; sj2++) {
        sShares[sj2].amount = parseFloat(sShares[sj2].amount.toFixed(2));
      }
      return sShares;
    }

    return expenseData.shares;
  },

  createExpense: function (expenseData) {
    var utils = new SplitUtils();
    utils.requireMembership(expenseData.group);

    var expGr = new GlideRecord("x_snc_split_app_2_expense");
    expGr.initialize();
    expGr.group = expenseData.group;
    expGr.description = expenseData.description;
    expGr.amount = parseFloat(expenseData.amount.toFixed(2));
    expGr.date = expenseData.date || new GlideDateTime().getDate();
    expGr.category = expenseData.category || "Other";
    expGr.payer = expenseData.payer || gs.getUserID();
    expGr.split_type = expenseData.split_type;
    expGr.notes = expenseData.notes || "";
    expGr.receipt_image = expenseData.receipt_image || "";
    var expSysId = expGr.insert();

    var shares = this._calculateShares(expenseData);
    utils.validateShares(expenseData.amount, shares);

    for (var i = 0; i < shares.length; i++) {
      var shGr = new GlideRecord("x_snc_split_app_2_share");
      shGr.initialize();
      shGr.expense = expSysId;
      shGr.user = shares[i].user;
      shGr.amount = shares[i].amount;
      if (shares[i].percentage !== undefined)
        shGr.percentage = shares[i].percentage;
      if (shares[i].shares !== undefined) shGr.shares = shares[i].shares;
      shGr.insert();
    }

    return expSysId;
  },

  updateExpense: function (expenseSysId, expenseData) {
    var expGr = new GlideRecord("x_snc_split_app_2_expense");
    if (!expGr.get(expenseSysId)) throw new Error("Expense not found.");

    var utils = new SplitUtils();
    utils.requireMembership(expGr.group.toString());

    if (
      expGr.payer.toString() !== gs.getUserID() &&
      !utils.isAdmin(expGr.group.toString())
    ) {
      throw new Error(
        "Only the payer or a group admin can edit this expense.",
      );
    }

    var settledCheck = new GlideRecord("x_snc_split_app_2_share");
    settledCheck.addQuery("expense", expenseSysId);
    settledCheck.addQuery("settled_amount", ">", 0);
    settledCheck.query();
    if (settledCheck.next()) {
      throw new Error("Cannot edit an expense that has settled shares.");
    }

    if (expenseData.description !== undefined)
      expGr.description = expenseData.description;
    if (expenseData.amount !== undefined)
      expGr.amount = parseFloat(expenseData.amount.toFixed(2));
    if (expenseData.date !== undefined)
      expGr.date = expenseData.date;
    if (expenseData.category !== undefined)
      expGr.category = expenseData.category;
    if (expenseData.payer !== undefined)
      expGr.payer = expenseData.payer;
    if (expenseData.split_type !== undefined)
      expGr.split_type = expenseData.split_type;
    if (expenseData.notes !== undefined) expGr.notes = expenseData.notes;
    if (expenseData.receipt_image !== undefined)
      expGr.receipt_image = expenseData.receipt_image;
    expGr.update();

    if (expenseData.split_type !== undefined || expenseData.shares !== undefined || expenseData.amount !== undefined) {
      var newShares;
      if (expenseData.shares) {
        var updateData = {
          group: expGr.group.toString(),
          amount: expGr.amount,
          split_type: expenseData.split_type || expGr.split_type,
          shares: expenseData.shares,
        };
        newShares = this._calculateShares(updateData);
      } else {
        return expenseSysId;
      }

      utils.validateShares(expGr.amount, newShares);

      var oldShares = new GlideRecord("x_snc_split_app_2_share");
      oldShares.addQuery("expense", expenseSysId);
      oldShares.query();
      while (oldShares.next()) {
        oldShares.deleteRecord();
      }

      for (var i = 0; i < newShares.length; i++) {
        var shGr = new GlideRecord("x_snc_split_app_2_share");
        shGr.initialize();
        shGr.expense = expenseSysId;
        shGr.user = newShares[i].user;
        shGr.amount = newShares[i].amount;
        if (newShares[i].percentage !== undefined)
          shGr.percentage = newShares[i].percentage;
        if (newShares[i].shares !== undefined)
          shGr.shares = newShares[i].shares;
        shGr.insert();
      }
    }

    return expenseSysId;
  },

  deleteExpense: function (expenseSysId) {
    var expGr = new GlideRecord("x_snc_split_app_2_expense");
    if (!expGr.get(expenseSysId)) throw new Error("Expense not found.");

    var utils = new SplitUtils();
    utils.requireMembership(expGr.group.toString());

    if (
      expGr.payer.toString() !== gs.getUserID() &&
      !utils.isAdmin(expGr.group.toString())
    ) {
      throw new Error(
        "Only the payer or a group admin can delete this expense.",
      );
    }

    var shareGr = new GlideRecord("x_snc_split_app_2_share");
    shareGr.addQuery("expense", expenseSysId);
    shareGr.addQuery("settled_amount", ">", 0);
    shareGr.query();
    if (shareGr.next()) {
      throw new Error("Cannot delete an expense that has settled shares.");
    }

    var delShares = new GlideRecord("x_snc_split_app_2_share");
    delShares.addQuery("expense", expenseSysId);
    delShares.query();
    while (delShares.next()) {
      delShares.deleteRecord();
    }
    expGr.deleteRecord();
  },

  type: "ExpenseManager",
};
