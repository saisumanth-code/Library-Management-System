// GET /
const getHome = (req, res) => {
    if (req.session.user_id) {
        return req.session.isAdmin ? res.redirect("/admin") : res.redirect("/dashboard");
    }
    res.render("index");
};

// GET /dashboard
const getDashboard = (req, res) => {
    if (!req.session.user_id) return res.redirect("/login");

    res.render("dashboard", {
        username: req.session.username,
        user_id: req.session.user_id,
    });
};

module.exports = { getHome, getDashboard };
