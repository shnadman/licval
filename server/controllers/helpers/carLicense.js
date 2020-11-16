const _ = require("lodash");
import { jimpify } from "../parking";

const tesseract = require("tesseract.js");
const { createWorker } = tesseract;

const isValidDate = (d) => {
  return d instanceof Date && !isNaN(d);
};

const isDateCandidate = (word) => {
  const date = /(0?[1-9]|[12][0-9]|3[01])[\/\-.](0?[1-9]|1[012])[\/\-.]\d{4}/;
  return date.test(word);
};

const isCarNumber = (line) => {
  const number = /[0-9]{7,8}/;
  return number.test(line);
};

const carLisAttempt = (relevant, lines) => {
  const linesText = lines.map((line) => _.trim(line.text));
  console.log(linesText);

  if (!relevant.carExpires) {
    const filteredDates = linesText.filter((line) => isDateCandidate(line));
    const parsedDates = _.words(filteredDates[0]);
    const [year, month, day] = [
      _.parseInt(parsedDates[2]),
      _.parseInt(parsedDates[1]),
      _.parseInt(parsedDates[0]),
    ];
    const carExpires = new Date(year, month - 1, day);
    if (isValidDate(carExpires)) {
      relevant.carExpires = new Date(year, month - 1, day);
    }
  }
  console.log(relevant);

  if (!relevant.carNumber) {
    const filteredCarNumber = linesText.filter((line) => isCarNumber(line));
    const carNumberRegex = /[0-9]{7,8}/;
    //exec returns an array if a match was found, in the first cell ([0]) we have the match inside it's own array
    //so we take it by getting the first cell again ([0])
    const parsedCarNumber = carNumberRegex.exec(filteredCarNumber[0])[0];
    if (!_.startsWith(relevant.id, parsedCarNumber))
      relevant.carNumber = parsedCarNumber;
  }

  console.log(relevant);
  const idRegex = /(?=.{9,10}$)[0-9]+(?:-[0-9])/;
  const filteredIdLine = linesText.filter((line) => idRegex.test(line))[0];
  if (filteredIdLine) {
    const id = filteredIdLine.split(" ")[0].split("-").join("");
    return _.parseInt(id);
  }
};

export const handleCarLis = async (relevant, carLicense) => {
  let carLisID;
  const extractedAll = () =>
    relevant.carExpires && relevant.carNumber && carLisID;

  let threshold = 145;

  for (let attempt = 0; attempt < 7 && !extractedAll(); attempt++) {
    jimpify(threshold - attempt * 10, carLicense);

    const worker = createWorker({
      logger: (m) => console.log(m),
    });

    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    const {
      data: { lines },
    } = await worker.recognize("./renderedNew.png");

    console.log(`Attempt number ${attempt}`);
    carLisID = carLisAttempt(relevant, lines);
    console.log("Temp relevant is ", relevant);
  }

  return relevant.id === carLisID;
};
