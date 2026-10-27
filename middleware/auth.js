const requireAuth = (req, res, next) => {
    if (!req.session.user_id) return res.redirect("/login");
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user_id || !req.session.isAdmin) return res.redirect("/login");
    next();
};

module.exports = { requireAuth, requireAdmin };
