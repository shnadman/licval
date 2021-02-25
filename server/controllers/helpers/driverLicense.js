const _ = require("lodash");
const jimpify = require("./jimpify");

const tesseract = require("tesseract.js");
const { createWorker } = tesseract;

const isValidDate = (d) => {
  return d instanceof Date && !isNaN(d);
};

const isNameProbalyWrong = (name) => {
  const index = _.findIndex(name.split(" "), (subName) => subName.length === 1);

  return index !== -1;
};

const isEnglish = (word) => /^[a-zA-Z]+$/.test(word);

const extractDate = (arr, relevant) => {
  const words = _.words(arr);
  const [year, month, day] = [
    _.parseInt(words[2]),
    _.parseInt(words[1]),
    _.parseInt(words[0]),
  ];
  const expireDate = new Date(year, month - 1, day);
  if (isValidDate(expireDate)) {
    relevant.driverExpires = expireDate;
  }
};

const extractId = (arr, relevant) => {
  const words = _.words(arr);
  relevant.id = _.parseInt(words[0]);
};

const extractFirstName = (arr, relevant) => {
  const words = _.words(arr).filter((word) => isEnglish(word));
  const firstName = words.join(" ");
  if (!isNameProbalyWrong(firstName)) {
    relevant.firstName = firstName;
  }
};

const extractLastName = (arr, relevant) => {
  const words = _.words(arr).filter((word) => isEnglish(word));
  const lastName = words.join(" ");
  if (!isNameProbalyWrong(lastName)) {
    relevant.lastName = lastName;
  }
};

const retryExtractDate = (linesText, relevant, extractedDates) => {
  const date = /(0?[1-9]|[12][0-9]|3[01])[\/\-.](0?[1-9]|1[012])[\/\-.]\d{4}/;

  const filteredDatesLines = linesText.filter((line) => date.test(line));

  const filteredDates = filteredDatesLines.map((line) => date.exec(line)[0]);

  const parsedDates = filteredDates.map((line) => {
    const parsedDates = _.words(line);
    const [year, month, day] = [
      _.parseInt(parsedDates[2]),
      _.parseInt(parsedDates[1]),
      _.parseInt(parsedDates[0]),
    ];
    return new Date(year, month - 1, day);
  });
  extractedDates = _.union(extractedDates, parsedDates);
  if (extractedDates.length === 3) {
    const maxDate = new Date(Math.max.apply(null, parsedDates));
    console.log(maxDate);
    if (isValidDate(maxDate)) {
      relevant.driverExpires = maxDate;
    }
  }
};

const driversLicenseAttempt = (relevant, lines) => {
  const expirationPrefix = /4b.(.*)/;
  const idPrefix = /D.(.*)/;
  const lastNamePrefix = /1.(.*)|.1(.*)/;
  const firstNamePrefix = /2.(.*)|.2(.*)/;
  const roshHaAyin = /ראש העין/;
  let extractedDates = [];

  const linesText = lines.map((line) => _.trim(line.text));
  console.log(linesText);

  linesText.forEach((line) => {
    //arr[1] is what comes AFTER the matched REGEX
    const arr1 = line.match(expirationPrefix);
    if (!relevant.driverExpires && arr1 != null) {
      // Did it match?
      extractDate(arr1[1], relevant);
    }
    const arr2 = line.match(idPrefix);
    if (!relevant.id && arr2 != null) {
      // Did it match?
      extractId(arr2[1], relevant);
    }
    const arr3 = line.match(firstNamePrefix);
    if (!relevant.firstName && arr3 != null) {
      // Did it match?
      extractFirstName(arr3["input"], relevant);
    }
    const arr4 = line.match(lastNamePrefix);
    if (!relevant.lastName && arr4 != null) {
      // Did it match?
      extractLastName(arr4["input"], relevant);
    }
    const arr5 = line.match(roshHaAyin);
    if (arr5 != null) {
      // Did it match?
      relevant.roshHaAyinCitizen = true;
    }
  });

  if (!relevant.driverExpires) {
    retryExtractDate(linesText, relevant, extractedDates);
  }
};

exports.handleDriversLicense = async (relevant, driverLicense) => {
  const extractedAll = () =>
    relevant.driverExpires &&
    relevant.firstName &&
    relevant.lastName &&
    relevant.id &&
    relevant.roshHaAyinCitizen;

  let threshold = 145;

  for (let attempt = 0; attempt < 7 && !extractedAll(); attempt++) {
    jimpify(threshold - attempt * 10, driverLicense);
    const worker = createWorker({
      langPath: "heb.traineddata",
      logger: (m) => console.log(m),
    });

    await worker.load();
    await worker.loadLanguage("heb+eng");
    await worker.initialize("heb+eng");

    const {
      data: { lines },
    } = await worker.recognize("./renderedNew.png");

    driversLicenseAttempt(relevant, lines);
    console.log("Temp relevant is ", relevant);
    await worker.terminate();
  }

  console.log("Final relevant is ", relevant);

  return relevant;
};
