const _ = require("lodash");
const jimpify = require("./jimpify");

const tesseract = require("tesseract.js");
const { createWorker } = tesseract;

const isRoshHayinCitizen = (line) => {
  const roshHaAyin = /ראש העין/;
  return roshHaAyin.test(line);
};

exports.handleIdAttachment = async (relevant, idAttachment) => {
  let ans = false;

  let threshold = 145;

  for (let attempt = 0; attempt < 7 && !ans; attempt++) {
    const worker = createWorker({
      logger: (m) => console.log(m),
    });

    jimpify(threshold - attempt * 10, idAttachment);
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    const {
      data: { lines },
    } = await worker.recognize("./renderedNew.png");
    await worker.terminate();

    const linesText = lines.map((line) => _.trim(line.text));

    const filtered = linesText.filter((line) => isRoshHayinCitizen(line));

    ans = filtered.length > 0;

    console.log(relevant);
  }

  return ans;
};
