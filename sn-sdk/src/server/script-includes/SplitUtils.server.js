var SplitUtils = Class.create();
SplitUtils.prototype = {
  initialize: function () {},

  getMembership: function (groupSysId) {
    var gr = new GlideRecord("x_snc_split_app_2_membership");
    gr.addQuery("group", groupSysId);
    gr.addQuery("user", gs.getUserID());
    gr.query();
    if (gr.next()) {
      return gr;
    }
    return null;
  },

  isAdmin: function (groupSysId) {
    var mem = this.getMembership(groupSysId);
    return mem && mem.role.toString() == "admin";
  },

  requireMembership: function (groupSysId) {
    if (!this.getMembership(groupSysId)) {
      var err = new sn_ws_err.ServiceError();
      err.setStatus(403);
      err.setMessage("You are not a member of this group.");
      err.setDetail(
        "User " + gs.getUserID() + " tried to access group " + groupSysId,
      );
      throw err;
    }
  },

  validateShares: function (totalAmount, shares) {
    var sum = 0;
    for (var i = 0; i < shares.length; i++) {
      sum += shares[i].amount;
    }
    if (Math.abs(sum - totalAmount) > 0.01) {
      var err = new sn_ws_err.ServiceError();
      err.setStatus(400);
      err.setMessage("Sum of shares does not equal the total expense amount.");
      err.setDetail("Total: " + totalAmount + ", Sum of shares: " + sum);
      throw err;
    }
  },

  type: "SplitUtils",
};
