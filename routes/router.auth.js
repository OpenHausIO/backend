module.exports = (app, auth) => {


    auth.post("/logout", (req, res) => {

        res.json({
            success: false,
            message: "To implement!"
        });

    });


    auth.post("/register", (req, res) => {

        res.json({
            success: false,
            message: "To implement!"
        });

    });


    auth.post("/confirm", (req, res) => {

        res.json({
            success: false,
            message: "To implement!"
        });

    });

};