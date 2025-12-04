const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator(); // Default is a 128-bit UID encoded in base58

// Async with `await`
const uidgenerate = async () => {
    // Async with `await`

    return await uidgen.generate();

}
// uidgenerate()

module.exports = uidgenerate