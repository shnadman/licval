const _ = require("lodash");
const jimpify = require("./jimpify");

const tesseract = require("tesseract.js");

const { createWorker } = tesseract;

const isIdCandidate = (line) => {
  const number = /[0-9]{6,9}/;
  return number.test(line);
};

exports.handleId = async (relevant, id) => {
  let ans = false;

  let threshold = 145;

  try {
    for (let attempt = 0; attempt < 7 && !ans; attempt++) {
      jimpify(threshold - attempt * 10, id);
      const worker = createWorker({
        logger: (m) => console.log(m),
      });
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");

      const {
        data: { lines },
      } = await worker.recognize("./renderedNew.png");
      await worker.terminate();

      const linesText = lines.map((line) => _.trim(line.text));
      const filtered = linesText.filter((line) => isIdCandidate(line));
      const parsed = _.words(filtered[0]);
      const fullId = _.parseInt(parsed.join(""));

      ans = fullId === relevant.id;

      console.log(relevant);
    }
  } catch (e) {
    console.log(e);
  }

  return ans;
};
