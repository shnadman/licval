const Jimp = require("jimp");

module.exports = (threshold, path) => {
  Jimp.read(path)
    .then((img) => {
      return img
        .quality(100) // set JPEG quality
        .resize(1024, Jimp.AUTO)
        .greyscale()
        .threshold({ max: threshold, autoGreyscale: false })
        .write("./renderedNew.png"); // save
    })
    .catch((err) => {
      console.error(err);
    });
};
