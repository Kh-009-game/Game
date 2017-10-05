class Locker {
	constructor() {
		this.lockedKeys = [];
	}

	checkKey(key) {
		const keyIndex = this.lockedKeys.indexOf(key);
		return keyIndex !== -1;
	}

	checkCompositeKey(key) {
		const keyKeys = Object.keys(key);

		for (let i = 0, j = keyKeys.length; i < j; i += 1) {
			// if (typeof key[keyKeys[i]] === 'Object') {
			// 	if (this.checkCompositeKey(key[keyKeys[i]])) {
			// 		return true;
			// 	}
			// }
			for (let k = 0, l = this.lockedKeys.length; i < l; k += 1) {
				if (key[keyKeys[i]] === this.lockedKeys[k][keyKeys[i]]) {
					return true;
				}
			}
		}
	}
}
