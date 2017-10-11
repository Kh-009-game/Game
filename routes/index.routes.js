const express = require('express');
const lifecycleMiddleware = require('../middleware/lifecycle-middleware');

const router = express.Router();

router.get('/',
	lifecycleMiddleware.isLifecycle,
	(req, res) => {
		res.render('index', {
			isAdmin: req.decoded.isAdmin,
			isLifecycle: req.body.isLifecycle
		});
	}
);


module.exports = router;
