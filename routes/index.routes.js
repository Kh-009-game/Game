const express = require('express');

const router = express.Router();

router.get('/',
	(req, res) => {
		res.render('index', {
			isAdmin: req.decoded.isAdmin
		});
	}
);


module.exports = router;
