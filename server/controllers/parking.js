const _ = require("lodash");
const mongoose = require("mongoose");
const Jimp = require("jimp");
const nodemailer = require("nodemailer");

const tesseract = require("tesseract.js");
const PSM = require("tesseract.js/src/constants/PSM.js");
const { createWorker } = tesseract;
const { Driver } = require("../models/driver");

const sendMail = async (email, content) => {
  try {
    // Generate test SMTP service account from ethereal.email

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      //  port: 587,
      // secure: false, // true for 465, false for other ports
      auth: {
        user: "roshhaain1@gmail.com", // generated ethereal user
        pass: "rosh1234", // generated ethereal password
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: "roshhaain1@gmail.com", // sender address
      to: email, // list of receivers
      subject: "Rosh Ha Ayin Parking service notification", // Subject line
      text: content, // plain text body
      html: "<b>You have been approved for parking</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } catch (e) {
    console.error(e);
  }
};

const handleNan = (word) => {
  const english = /^[A-Za-z]*$/;
  return english.test(word) ? word : word.split("").reverse().join("");
};

const isDateCandidate = (word) => {
  const date = /(0?[1-9]|[12][0-9]|3[01])[\/\-.](0?[1-9]|1[012])[\/\-.]\d{4}/;
  return date.test(word);
};

const isEnglish = (word) => {
  const english = /^[A-Za-z]*$/;
  return english.test(word);
};

const isIdCandidate = (line) => {
  const number = /[0-9]{6,9}/;
  return number.test(line);
};

const isCarNumber = (line) => {
  const number = /[0-9]{7,8}/;
  return number.test(line);
};

const extractDate = (arr, relevant) => {
  const words = _.words(arr);
  const [year, month, day] = [
    _.parseInt(words[2]),
    _.parseInt(words[1]),
    _.parseInt(words[0]),
  ];
  const expireDate = new Date(year, month - 1, day);
  relevant.driverExpires = expireDate;
};

const extractId = (arr, relevant) => {
  const words = _.words(arr);
  relevant.id = _.parseInt(words[0]);
};

const extractFirstName = (arr, relevant) => {
  const words = _.words(arr).filter((word) => isEnglish(word));
  relevant.firstName = words.join(" ");
};

const extractLastName = (arr, relevant) => {
  const words = _.words(arr).filter((word) => isEnglish(word));
  relevant.lastName = words.join(" ");
};

const handleId = async (relevant, id) => {
  let ans = false;

  let threshold = 125;

  const worker = createWorker({
    logger: (m) => console.log(m),
  });

  for (let attempt = 0; attempt < 5 && !ans; attempt++) {
    jimpify(threshold - attempt * 10, id);
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

  return ans;
};

const carLisAttempt = (relevant, lines) => {
  const linesText = lines.map((line) => _.trim(line.text));

  if (!relevant.carExpires) {
    const filteredDates = linesText.filter((line) => isDateCandidate(line));
    const parsedDates = _.words(filteredDates[0]);
    const [year, month, day] = [
      _.parseInt(parsedDates[2]),
      _.parseInt(parsedDates[1]),
      _.parseInt(parsedDates[0]),
    ];

    relevant.carExpires = new Date(year, month - 1, day);
  }

  if (!relevant.carNumber) {
    const filteredCarNumber = linesText.filter((line) => isCarNumber(line));
    const carNumberRegex = /[0-9]{7,8}/;
    //exec returns an array if a match was found, in the first cell ([0]) we have the match inside it's own array
    //so we take it by getting the first cell again ([0])
    const parsedCarNumber = carNumberRegex.exec(filteredCarNumber[0])[0];
    relevant.carNumber = parsedCarNumber;
  }

  const idRegex = /(?=.{9,10}$)[0-9]+(?:-[0-9])/;
  const filteredIdLine = linesText.filter((line) => idRegex.test(line))[0];
  const id = filteredIdLine.split(" ")[0].split("-").join("");
  return _.parseInt(id);
};

const handleCarLis = async (relevant, carLicense) => {
  let carLisID;
  const extractedAll = () =>
    relevant.carExpires && relevant.carNumber && carLisID;

  let threshold = 100;

  for (let attempt = 0; attempt < 5 && !extractedAll(); attempt++) {
    jimpify(threshold, carLicense);

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

const retryExtractDate = (linesText, relevant) => {
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
  const maxDate = new Date(Math.max.apply(null, parsedDates));
  console.log(maxDate);

  relevant.driverExpires = maxDate;
};

const driversLicenseAttempt = (relevant, lines) => {
  const expirationPrefix = /4b.(.*)/;
  const idPrefix = /D.(.*)/;
  const lastNamePrefix = / .1(.*)/;
  const firstNamePrefix = / .2(.*)/;
  const roshHaAyin = /תל אביב - יפו/;

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
    retryExtractDate(linesText, relevant);
  }
};

const handleDriversLicense = async (relevant, driverLicense) => {
  const extractedAll = () =>
    relevant.driverExpires &&
    relevant.firstName &&
    relevant.lastName &&
    relevant.id &&
    relevant.roshHaAyinCitizen;

  let threshold = 125;

  for (let attempt = 0; attempt < 5 && !extractedAll(); attempt++) {
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

    console.log(`Attempt number ${attempt}`);
    driversLicenseAttempt(relevant, lines);
    console.log("Temp relevant is ", relevant);
    await worker.terminate();
  }

  console.log("Final relevant is ", relevant);

  return relevant;
};

const jimpify = (threshold, path) => {
  Jimp.read(path)
    .then((img) => {
      return img
        .quality(100) // set JPEG quality
        .resize(1024, Jimp.AUTO)
        .greyscale()
        .threshold({ max: threshold, autoGreyscale: false }) //was 100 for Dganis license
        .write("renderedNew.png"); // save
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.validateParking = async (req, res, next) => {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  const { email } = req.body;

  const { driverLicense, carLicense, id } = req.files;
  const [driverLicenseImage, carLicenseImage, idImage] = [
    driverLicense[0]["buffer"],
    carLicense[0]["buffer"],
    id[0]["buffer"],
  ];

  let relevant = {};
  let idsMatch = false;
  await handleDriversLicense(relevant, driverLicenseImage);
  // idsMatch = await handleId(relevant, idImage);
  // if (!idsMatch)
  //   return res.send("Id numbers in driver's license and ID don't match!");
  idsMatch = await handleCarLis(relevant, carLicenseImage);
  console.log(relevant);

  if (!idsMatch)
    return res.send(
      "Id numbers in driver's license and car license don't match!"
    );
  const today = new Date();

  if (!relevant.roshHaAyinCitizen)
    return res.send("Denied! Not a citizen of Rosh Ha Ayin");
  if (relevant.driverExpires < today)
    return res.send("Denied! Driver license expired");
  //if(relevant.carExpires<today) return res.send("Denied! Car license expired");

  const driver = new Driver({ ...relevant, email });

  console.log(driver);

  driver.save();

  await sendMail(email, "Yay, you have been approved for parking");

  res.send("Approved!");
};
