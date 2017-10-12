const express = require('express');

const router = express.Router();

router.get('/',
	(req, res) => {
		res.render('index', {
			isAdmin: req.decoded.isAdmin,
			isLifecycle: req.body.isLifecycle
		});
	}
);


module.exports = router;
