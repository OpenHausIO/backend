module.exports = (app, auth) => {

    auth.post("/login", (req, res) => {

        setTimeout(() => {
            res.json({
                success: true,
                token: "adslkfjlsakjfd-" + Date.now()
            })
        }, 1000)

    });


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