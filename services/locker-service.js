class Locker {
	constructor() {
		this.lockedKeys = [];
	}

	findKey(key) {
		if (typeof key === 'object') {
			return this.findCompositeKey(key);
		}

		return this.findPrimitiveKey(key);
	}

	findPrimitiveKey(key) {
		return this.lockedKeys.indexOf(key);
	}

	findCompositeKey(key) {
		const lockedKeys = this.lockedKeys;

		for (
			let lockArrIndex = 0, lockArrMaxIndex = lockedKeys.length;
			lockArrIndex < lockArrMaxIndex;
			lockArrIndex += 1
		) {
			const lockedKey = lockedKeys[lockArrIndex];
			if (this.checkPropsEquality(lockedKey, key)) {
				return lockArrIndex;
			}
		}

		return -1;
	}

	checkPropsEquality(obj, obj2) {
		const keys = Object.keys(obj);
		for (
			let keysIndex = 0, keysMaxIndex = keys.length;
			keysIndex < keysMaxIndex;
			keysIndex += 1
		) {
			const key = keys[keysIndex];

			if (typeof obj[key] === 'object') {
				if (!this.checkPropsEquality(obj[key], obj2[key])) {
					return false;
				}
			}

			if (obj[key] !== obj2[key]) {
				return false;
			}
		}
		return true;
	}

	checkKey(key) {
		const keyIndex = this.findKey(key);

		return keyIndex !== -1;
	}

	addKey(key) {
		this.lockedKeys.push(key);
	}

	deleteKey(key) {
		const keyIndex = this.findKey(key);

		this.lockedKeys.splice(keyIndex, 1);
	}
}

module.exports = Locker;
