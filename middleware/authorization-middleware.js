module.exports.isAdmin = (req, res, next) => {
	if (!req.decoded.isAdmin) {
		throw new Error('No such rights!');
	}
	next();
};
